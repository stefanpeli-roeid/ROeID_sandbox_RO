/**
 * Credo-based Mdoc Generator
 * Uses Credo's DcqlService to generate DeviceResponse with DeviceSigned
 */

import { webcrypto } from 'crypto';
import { cborDecode, cborEncode } from '@animo-id/mdoc';
import { getCredoAgent } from './CredoAgent.js';
import { SimulationMode } from '../types/index.js';
import { SimulationModeHandler } from './SimulationModeHandler.js';
import { decodeMdocToken } from '../verifier/ResponseTokenDecoder.js';
import {
  DcqlService,
  Mdoc,
  MdocRecord,
  MdocOpenId4VpSessionTranscriptOptions,
  Agent,
  DcqlCredentialsForRequest,
  ClaimFormat,
  X509Service,
  X509Certificate,
  Kms
} from '@credo-ts/core';
import { HOLDER_KEY } from './TestKeys.js';
import { CertificateManager } from '../security/CertificateManager.js';

const ISSUER_LEAF_KEY_ID = 'mdoc-issuer-leaf-key';

export interface CredoMdocGenerationOptions {
  mode: SimulationMode;
  requestedClaims: string[][]; // DCQL claim paths
  nonce: string;
  audience?: string; // Verifier's client_id
  // Verifier's response_uri. Distinct from `audience` (client_id) - e.g. client_id is
  // often "x509_hash:..." while response_uri is an HTTPS endpoint. The mdoc
  // SessionTranscript hashes clientId and responseUri independently, so conflating
  // them produces a SessionTranscript the verifier can't reproduce.
  responseUri?: string;
  state?: string;
  pidClaims?: any;
  dcqlCredentialId: string; // The credential ID from DCQL request
  // Verifier's ECDH-ES public encryption key (raw JWK from client_metadata.jwks.keys),
  // the same key used to encrypt the JWE response. The OpenID4VP mdoc SessionTranscript
  // hashes this key's JWK thumbprint alongside clientId/responseUri/nonce, so it must be
  // the literal same key object the verifier used for its own transcript computation -
  // no separate wallet-side nonce conveyance (e.g. via JWE `apu`) is needed for this.
  verifierEncryptionJwk?: Record<string, unknown>;
}

export interface CredoMdocGenerationResult {
  mdoc: string; // Base64url-encoded DeviceResponse
  claims: any;
  mode: SimulationMode;
  decoded?: any;
}

export class CredoMdocGenerator {
  /**
   * Generate mdoc DeviceResponse using Credo's DCQL service
   */
  async generate(options: CredoMdocGenerationOptions): Promise<CredoMdocGenerationResult> {
    // Get Credo agent
    const agent = await getCredoAgent();

    // Convert PID claims to mdoc format
    const mdocFormattedClaims = options.pidClaims ? this.convertToMdocFormat(options.pidClaims) : {};

    // Apply simulation mode modifications
    const { claims } = SimulationModeHandler.getClaimsForMode(
      options.mode,
      options.requestedClaims,
      mdocFormattedClaims
    );

    const docType = 'eu.europa.ec.eudi.pid.1';
    const namespaces = { [docType]: claims };

    // Create mdoc credential using Credo
    const mdoc = await this.createMdocCredential(agent, docType, namespaces);

    // Create DeviceResponse using Credo's DCQL service
    const deviceResponseBase64 = await this.createDeviceResponse(agent, mdoc, namespaces, options);

    const decoded = this.decodeDeviceResponse(deviceResponseBase64);

    return {
      mdoc: deviceResponseBase64,
      claims,
      mode: options.mode,
      decoded,
    };
  }

  /**
   * Ensure a private key is registered in the agent's KMS under the given keyId.
   * Safe to call repeatedly on the singleton agent.
   */
  private async ensureKeyImported(agent: Agent, keyId: string, privateJwk: Record<string, unknown>): Promise<void> {
    try {
      const existing = await agent.kms.getPublicKey({ keyId });
      if (existing) return;
    } catch {
      // Not found in any backend - fall through and import below
    }

    await agent.kms.importKey({
      privateJwk: { ...privateJwk, kid: keyId } as any,
    });
  }

  /**
   * Create an Mdoc credential using Credo's MdocApi
   */
  private async createMdocCredential(agent: Agent, docType: string, namespaces: any): Promise<Mdoc> {
    // Issuer certificate + signing key: must correspond to the private key backing the
    // leaf certificate managed by CertificateManager so the MSO signature is verifiable
    // against the x5chain embedded in the mdoc.
    const certManager = CertificateManager.getInstance();
    const x5cArray = certManager.getX5c();
    const issuerCertificate: X509Certificate = X509Service.getLeafCertificate(agent.context, {
      certificateChain: x5cArray,
    });

    const issuerPrivateJwk = await webcrypto.subtle.exportKey('jwk', certManager.getLeafPrivateKey());
    await this.ensureKeyImported(agent, ISSUER_LEAF_KEY_ID, issuerPrivateJwk as Record<string, unknown>);
    issuerCertificate.keyId = ISSUER_LEAF_KEY_ID;

    // Holder (device) key: fixed test key pair, already carries a stable kid.
    await this.ensureKeyImported(agent, HOLDER_KEY.privateKeyJwk.kid!, HOLDER_KEY.privateKeyJwk);
    const holderKey = Kms.PublicJwk.fromPublicJwk(HOLDER_KEY.publicKeyJwk as any);

    // Sign the mdoc using Credo's MdocApi
    const mdoc = await agent.mdoc.sign({
      docType,
      namespaces,
      issuerCertificate,
      holderKey,
      validityInfo: {
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }
    });

    return mdoc;
  }

  /**
   * Create DeviceResponse using Credo's DCQL service
   */
  private async createDeviceResponse(
    agent: Agent,
    mdoc: Mdoc,
    namespaces: any,
    options: CredoMdocGenerationOptions
  ): Promise<string> {
    const dcqlService = agent.dependencyManager.resolve(DcqlService);

    // MdocRecord.fromMdoc builds an in-memory record - no agent storage/persistence needed
    const mdocRecord = MdocRecord.fromMdoc(mdoc);

    const credentialsForRequest: DcqlCredentialsForRequest = {
      [options.dcqlCredentialId]: [
        {
          claimFormat: ClaimFormat.MsoMdoc,
          credentialRecord: mdocRecord,
          disclosedPayload: namespaces,
        }
      ]
    };

    // Session transcript per the current (final) OpenID4VP 1.0 mdoc handover, which hashes
    // the verifier's own encryption key thumbprint instead of a wallet-conveyed nonce
    // (unlike the superseded 'openId4VpDraft18' variant, which needed mdocGeneratedNonce
    // conveyed via the JWE `apu` header).
    const sessionTranscript: MdocOpenId4VpSessionTranscriptOptions = {
      type: 'openId4Vp',
      responseUri: options.responseUri || options.audience || 'https://self-issued.me/v2',
      clientId: options.audience || 'https://self-issued.me/v2',
      verifierGeneratedNonce: options.nonce,
      encryptionJwk: options.verifierEncryptionJwk
        ? Kms.PublicJwk.fromPublicJwk(options.verifierEncryptionJwk as any)
        : undefined,
    };

    // Create presentation with DeviceResponse
    const { encodedDcqlPresentation } = await dcqlService.createPresentation(
      agent.context,
      {
        credentialQueryToCredential: credentialsForRequest,
        challenge: options.nonce,
        domain: options.audience,
        mdocSessionTranscript: sessionTranscript,
      }
    );

    // Extract the mdoc DeviceResponse
    const mdocPresentation = encodedDcqlPresentation[options.dcqlCredentialId];
    if (!mdocPresentation || !Array.isArray(mdocPresentation) || mdocPresentation.length === 0) {
      throw new Error('Failed to create mdoc presentation');
    }

    const entry = mdocPresentation[0];
    if (typeof entry !== 'string') {
      throw new Error('Expected mdoc DeviceResponse presentation to be a base64url string');
    }

    return this.canonicalizeDeviceResponse(entry);
  }

  /**
   * Re-serialize the DeviceResponse with minimal-length CBOR encoding.
   *
   * @animo-id/mdoc's plain-object maps (the DeviceResponse/Document/issuerSigned
   * wrappers) always go through cbor-x's fixed-width "map 16" writer regardless of
   * how few entries they hold, e.g. a 3-entry map is written as `b9 00 03` instead
   * of the minimal `a3`. That violates the non-preferred-encoding rule some
   * verifiers enforce strictly. Decoding and re-encoding fixes this because cbor-x
   * decodes maps as native `Map`s, and Map re-encoding always picks the minimal
   * length header. This is safe: every signed byte range (MSO, IssuerSignedItems,
   * COSE protected headers) is preserved as opaque byte strings during decode, so
   * their exact bytes - and the signatures over them - are untouched.
   */
  private canonicalizeDeviceResponse(deviceResponseBase64: string): string {
    const decoded = cborDecode(Buffer.from(deviceResponseBase64, 'base64url'));
    const canonical = cborEncode(decoded);
    return Buffer.from(canonical).toString('base64url');
  }

  /**
   * Decode the freshly-created DeviceResponse for UI display, matching the DecodedMdoc
   * shape used elsewhere (docType + issuerSigned.namespaces).
   */
  private decodeDeviceResponse(deviceResponseBase64: string): any {
    return decodeMdocToken(deviceResponseBase64);
  }

  /**
   * Convert PID claims from SD-JWT format to mdoc format
   */
  private convertToMdocFormat(pidClaims: any): any {
    const converted: any = {};

    // Direct mappings
    if (pidClaims.given_name) converted.given_name = pidClaims.given_name;
    if (pidClaims.family_name) converted.family_name = pidClaims.family_name;
    if (pidClaims.birthdate) converted.birth_date = pidClaims.birthdate;
    if (pidClaims.gender) converted.gender = pidClaims.gender;
    if (pidClaims.birth_place) converted.birth_place = pidClaims.birth_place;
    if (pidClaims.birth_country) converted.birth_country = pidClaims.birth_country;
    if (pidClaims.age_over_18) converted.age_over_18 = pidClaims.age_over_18;
    if (pidClaims.age_over_21) converted.age_over_21 = pidClaims.age_over_21;

    // Address conversion — mdoc's eu.europa.ec.eudi.pid.1 namespace uses the ARF's
    // resident_* flat element identifiers, distinct from SD-JWT's nested `address.*`
    // (see PIDPresentationProfile.ts, which lists resident_* as the mdoc PID claim names).
    if (pidClaims.address) {
      if (pidClaims.address.street_address) converted.resident_street = pidClaims.address.street_address;
      if (pidClaims.address.postal_code) converted.resident_postal_code = pidClaims.address.postal_code;
      if (pidClaims.address.locality) converted.resident_city = pidClaims.address.locality;
      if (pidClaims.address.country) converted.resident_country = pidClaims.address.country;
    }

    // Nationalities
    if (pidClaims.nationalities && Array.isArray(pidClaims.nationalities) && pidClaims.nationalities.length > 0) {
      converted.nationality = pidClaims.nationalities[0];
    }

    return converted;
  }
}
