/**
 * Mdoc DeviceAuth Verifier
 * Real cryptographic verification of an mdoc DeviceResponse's IssuerAuth (COSE_Sign1 over
 * the MSO) and DeviceAuth (COSE_Sign1/COSE_Mac0 over DeviceAuthentication bytes), plus
 * per-namespace digest checks against the MSO's valueDigests - all via @animo-id/mdoc's
 * `Verifier`, reached through Credo's own mdoc context so KMS-backed key material and
 * X.509/COSE primitives work exactly as they do for Credo's own mdoc flows.
 *
 * This replaces the previous placeholder in PresentationResponseValidator, which never
 * verified anything and always reported a hardcoded "not yet implemented" warning.
 */

import { Verifier } from "@animo-id/mdoc";
import { MdocDeviceResponse, TypedArrayEncoder, Kms } from "@credo-ts/core";
import { getCredoAgent } from "../simulator/CredoAgent.js";
import { ValidationCheck, Severity } from "../types/index.js";

// getMdocContext is not exposed through @credo-ts/core's package.json "exports" map
// (only ".", "./kms", "./package.json" are public) - reach the file directly via a
// filesystem path relative to the compiled dist/verifier/ location, which bypasses the
// package's exports-map restriction since it never resolves through the bare specifier.
let mdocContextModulePromise: Promise<{ getMdocContext: (agentContext: unknown) => unknown }> | undefined;

function loadMdocContextModule(): Promise<{ getMdocContext: (agentContext: unknown) => unknown }> {
  if (!mdocContextModulePromise) {
    const moduleUrl = new URL(
      "../../node_modules/@credo-ts/core/build/modules/mdoc/MdocContext.mjs",
      import.meta.url
    );
    mdocContextModulePromise = import(moduleUrl.href) as Promise<{
      getMdocContext: (agentContext: unknown) => unknown;
    }>;
  }
  return mdocContextModulePromise;
}

interface AnimoCheck {
  status: "PASSED" | "FAILED" | "WARNING";
  check: string;
  category: string;
  reason?: string;
}

function pemToDer(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s/g, "");
  return new Uint8Array(Buffer.from(base64, "base64"));
}

export interface MdocDeviceAuthVerifierInput {
  deviceResponseBase64Url: string;
  clientId: string;
  responseUri: string;
  nonce: string;
  // Verifier's own ECDH-ES public encryption key (the same key used to encrypt the JWE
  // response) - hashed into the 'openId4Vp' handover's OpenID4VPHandover thumbprint.
  verifierEncryptionJwk?: Record<string, unknown>;
  // Wallet-conveyed nonce (from the response JWE's `apu` header), needed only for the
  // superseded 'openId4VpDraft18' handover fallback.
  mdocGeneratedNonce?: string;
  // PEM-encoded IACA root certificates trusted for the PID issuer. Defaults to none:
  // no real trust anchor is configured for a real wallet's PID issuer, so the resulting
  // "chain not trusted" check is downgraded to a WARNING - the checks that matter here
  // (COSE_Sign1 signatures, per-item digests) run and are reported regardless.
  trustedCertificates?: string[];
}

export interface MdocDeviceAuthVerifierResult {
  checks: ValidationCheck[];
}

const SESSION_TRANSCRIPT_VARIANTS = ["openId4Vp", "openId4VpDraft18"] as const;

function buildSessionTranscriptOptions(
  variant: (typeof SESSION_TRANSCRIPT_VARIANTS)[number],
  input: MdocDeviceAuthVerifierInput,
  encryptionJwk: unknown
): Record<string, unknown> | undefined {
  if (variant === "openId4Vp") {
    return {
      type: "openId4Vp",
      clientId: input.clientId,
      responseUri: input.responseUri,
      verifierGeneratedNonce: input.nonce,
      encryptionJwk,
    };
  }
  // 'openId4VpDraft18' requires the wallet-conveyed mdocGeneratedNonce (from the JWE
  // `apu` header) - without it we can't attempt this variant at all.
  if (!input.mdocGeneratedNonce) return undefined;
  return {
    type: "openId4VpDraft18",
    clientId: input.clientId,
    responseUri: input.responseUri,
    verifierGeneratedNonce: input.nonce,
    mdocGeneratedNonce: input.mdocGeneratedNonce,
  };
}

/**
 * Run real DeviceAuth/IssuerAuth verification against an mdoc DeviceResponse, trying the
 * current OpenID4VP 1.0 ('openId4Vp') session-transcript handover first, falling back to
 * the superseded ('openId4VpDraft18') variant if a mdocGeneratedNonce is available. Which
 * variant (if either) actually validated is surfaced as its own diagnostic check - this is
 * the empirical answer that terse third-party verifier errors never gave us.
 */
export async function verifyMdocDeviceResponse(
  input: MdocDeviceAuthVerifierInput
): Promise<MdocDeviceAuthVerifierResult> {
  const checks: ValidationCheck[] = [];

  const agent = await getCredoAgent();
  const { getMdocContext } = await loadMdocContextModule();
  const mdocContext = getMdocContext(agent.context);

  const encodedDeviceResponse = TypedArrayEncoder.fromBase64(input.deviceResponseBase64Url);
  const encryptionJwk = input.verifierEncryptionJwk
    ? Kms.PublicJwk.fromPublicJwk(input.verifierEncryptionJwk as any)
    : undefined;

  let matchedVariant: string | undefined;
  let bestAttemptChecks: AnimoCheck[] = [];
  let lastError: string | undefined;

  for (const variant of SESSION_TRANSCRIPT_VARIANTS) {
    const options = buildSessionTranscriptOptions(variant, input, encryptionJwk);
    if (!options) continue;

    const attemptChecks: AnimoCheck[] = [];
    try {
      const sessionTranscriptBytes = await (MdocDeviceResponse as any).getSessionTranscriptBytesForOptions(
        mdocContext,
        options
      );

      const trustedCertificates = (input.trustedCertificates ?? []).map(pemToDer);

      const verifier = new Verifier();
      await verifier.verifyDeviceResponse(
        {
          encodedDeviceResponse,
          encodedSessionTranscript: sessionTranscriptBytes,
          trustedCertificates: trustedCertificates as [Uint8Array, ...Uint8Array[]],
          onCheck: (check) => {
            attemptChecks.push(check as AnimoCheck);
          },
        },
        mdocContext as any
      );

      const deviceAuthFailed = attemptChecks.some(
        (c) => c.category === "DEVICE_AUTH" && c.status === "FAILED"
      );

      if (bestAttemptChecks.length === 0) bestAttemptChecks = attemptChecks;

      if (!deviceAuthFailed) {
        matchedVariant = variant;
        bestAttemptChecks = attemptChecks;
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  bestAttemptChecks.forEach((c, i) => {
    // No PID issuer trust anchor is configured (see trustedCertificates doc above) - this
    // specific check always fails as a result, so it's a WARNING rather than an ERROR.
    // The rest of the checks (signatures, digests) are unaffected by this and still ERROR.
    const isUntrustedIssuerChain = c.category === "ISSUER_AUTH" && c.check === "Issuer certificate must be valid";

    checks.push({
      checkId: `mdoc.device_auth.${i}.${c.category.toLowerCase()}`,
      checkName: c.check,
      passed: c.status === "PASSED",
      category: "Cryptographic Verification",
      subcategory: c.category,
      severity: isUntrustedIssuerChain ? Severity.WARNING : Severity.ERROR,
      details: c.reason,
      issue: c.status === "FAILED" ? c.reason || c.check : undefined,
      specReference: {
        spec: "ISO/IEC 18013-5",
        section: "9.1.2 / 9.1.3",
        url: "https://www.iso.org/standard/69084.html",
      },
    });
  });

  checks.push({
    checkId: "mdoc.session_transcript.variant_detected",
    checkName: "Session Transcript Handover Variant",
    passed: !!matchedVariant,
    category: "Cryptographic Verification",
    subcategory: "Session Transcript",
    severity: Severity.ERROR,
    expectedValue: "openId4Vp or openId4VpDraft18 (device signature valid)",
    actualValue: matchedVariant ?? "none matched",
    issue: matchedVariant
      ? undefined
      : lastError ||
        "DeviceAuth signature did not validate against any known SessionTranscript handover variant",
    details: matchedVariant
      ? `DeviceAuth verified using the '${matchedVariant}' handover variant`
      : `Tried: ${SESSION_TRANSCRIPT_VARIANTS.filter((v) => buildSessionTranscriptOptions(v, input, encryptionJwk)).join(", ")}`,
  });

  return { checks };
}
