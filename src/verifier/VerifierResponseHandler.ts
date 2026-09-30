/**
 * Verifier Response Handler
 * Handles the wallet's POST to our own response_uri: decrypts the direct_post.jwt JWE,
 * decodes the vp_token(s) for display, and runs them through PresentationResponseValidator
 * with full mdoc DeviceAuth verification wired in.
 */

import * as jose from "jose";
import { PresentationResponse } from "../types/index.js";
import { PresentationResponseValidator } from "../validators/PresentationResponseValidator.js";
import { VerifierSessionStore, VerifierSession } from "./VerifierSessionStore.js";
import { decodeToken } from "./ResponseTokenDecoder.js";

export interface HandleResponseResult {
  redirect_uri: string;
}

function flattenVpToken(vpToken: unknown): string[] {
  if (!vpToken) return [];
  if (typeof vpToken === "string") return [vpToken];
  if (Array.isArray(vpToken)) return vpToken.filter((t): t is string => typeof t === "string");
  if (typeof vpToken === "object") {
    return Object.values(vpToken as Record<string, unknown>)
      .filter((v): v is string[] => Array.isArray(v))
      .flat()
      .filter((t): t is string => typeof t === "string");
  }
  return [];
}

export class VerifierResponseHandler {
  constructor(
    private readonly store: VerifierSessionStore,
    private readonly validator: PresentationResponseValidator = new PresentationResponseValidator()
  ) {}

  async handleResponse(sessionId: string, formBody: Record<string, unknown>): Promise<HandleResponseResult> {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new Error(`Unknown or expired verifier session: ${sessionId}`);
    }

    const encryptedResponse = formBody.response;
    if (typeof encryptedResponse !== "string") {
      this.store.update(sessionId, { status: "ERROR", error: "Missing 'response' form parameter" });
      throw new Error("Missing 'response' form parameter");
    }

    try {
      // The JWE `apu` header (if the wallet sets one) conveys the mdocGeneratedNonce used
      // by the superseded 'openId4VpDraft18' handover - captured here so
      // MdocDeviceAuthVerifier can try that variant as a fallback.
      let mdocGeneratedNonce: string | undefined;
      try {
        const protectedHeader = jose.decodeProtectedHeader(encryptedResponse) as { apu?: string };
        if (protectedHeader.apu) {
          mdocGeneratedNonce = Buffer.from(protectedHeader.apu, "base64url").toString("utf-8");
        }
      } catch {
        // Non-fatal - decryption below will surface any real problem with the JWE.
      }

      const privateKey = await jose.importJWK(session.encryptionPrivateJwk as jose.JWK, "ECDH-ES");
      const { plaintext } = await jose.compactDecrypt(encryptedResponse, privateKey);
      const payload = JSON.parse(Buffer.from(plaintext).toString("utf-8"));

      const vpTokenArray = flattenVpToken(payload.vp_token);
      const decodedVPTokens = vpTokenArray.map((token) => decodeToken(token));

      const response: PresentationResponse = {
        vp_token: payload.vp_token,
        state: payload.state,
        decodedVPTokens,
      };

      const responseValidation = await this.validator.validate(response, session.request, {
        mdocGeneratedNonceB64u: mdocGeneratedNonce,
        // No PID issuer trust anchor is configured for real/pilot wallets yet - see
        // MdocDeviceAuthVerifier's doc comment on trustedCertificates.
        trustedCertificates: [],
      });

      this.store.update(sessionId, {
        status: "RECEIVED",
        rawResponse: JSON.stringify(payload.vp_token),
        decodedVPTokens,
        responseValidation,
      });

      return { redirect_uri: `${this.baseUrlFor(session)}#verifier-session=${sessionId}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.store.update(sessionId, { status: "ERROR", error: message });
      throw error;
    }
  }

  private baseUrlFor(session: VerifierSession): string {
    const responseUri = (session.request as any).response_uri as string;
    try {
      return new URL(responseUri).origin;
    } catch {
      return responseUri;
    }
  }
}
