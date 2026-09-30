/**
 * Verifier Request Builder
 * Builds a real OpenID4VP PID authorization request (SD-JWT or mdoc), served by ERICA
 * acting as its own verifier, so a real wallet (or our own WalletSimulator, for the
 * self-test smoke path) can respond to it end-to-end.
 */

import * as jose from "jose";
import crypto from "crypto";
import { AuthorizationRequest } from "../types/index.js";
import { VerifierSessionStore, VerifierSession } from "./VerifierSessionStore.js";

export type VerifierRequestFormat = "mso_mdoc" | "dc+sd-jwt";

export interface BuildRequestOptions {
  format: VerifierRequestFormat;
  baseUrl: string; // Public base URL the wallet can reach (e.g. an ngrok tunnel)
}

export interface BuildRequestResult {
  session: VerifierSession;
  requestUri: string;
  deepLink: string;
}

function buildDcqlQuery(format: VerifierRequestFormat) {
  if (format === "mso_mdoc") {
    return {
      credentials: [
        {
          id: "pid-mdoc",
          format: "mso_mdoc",
          claims: [
            { path: ["eu.europa.ec.eudi.pid.1", "given_name"] },
            { path: ["eu.europa.ec.eudi.pid.1", "family_name"] },
            { path: ["eu.europa.ec.eudi.pid.1", "birth_date"] },
          ],
          meta: { doctype_value: "eu.europa.ec.eudi.pid.1" },
        },
      ],
    };
  }

  return {
    credentials: [
      {
        id: "pid-sd-jwt",
        format: "dc+sd-jwt",
        claims: [{ path: ["given_name"] }, { path: ["family_name"] }, { path: ["birthdate"] }],
        meta: { vct_values: ["urn:eudi:pid:de:1"] },
      },
    ],
  };
}

export class VerifierRequestBuilder {
  constructor(private readonly store: VerifierSessionStore) {}

  async buildRequest(options: BuildRequestOptions): Promise<BuildRequestResult> {
    const { publicKey, privateKey } = await jose.generateKeyPair("ECDH-ES", { crv: "P-256", extractable: true });
    const encryptionPublicJwk = (await jose.exportJWK(publicKey)) as Record<string, unknown>;
    const encryptionPrivateJwk = (await jose.exportJWK(privateKey)) as Record<string, unknown>;

    const kid = crypto.randomUUID();
    encryptionPublicJwk.kid = kid;
    encryptionPublicJwk.alg = "ECDH-ES";
    encryptionPublicJwk.use = "enc";
    encryptionPrivateJwk.kid = kid;

    const now = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomUUID();
    const state = crypto.randomUUID();

    // Reserve the session id up front so it can be baked into response_uri/client_id
    // before the request object itself is finalized.
    const sessionId = this.store.reserveId();
    const responseUri = `${options.baseUrl}/api/verifier/response/${sessionId}`;

    // client_id scheme 'redirect_uri': the client_id is the literal response_uri, prefixed
    // with the scheme, and the request is served unsigned. Real, production-configured
    // wallets may reject this - the next step would be signing with CertificateManager's
    // existing leaf-cert infra and switching to 'x509_hash', but that's not needed yet.
    const request: AuthorizationRequest = {
      response_type: "vp_token",
      client_id: `redirect_uri:${responseUri}`,
      response_uri: responseUri,
      response_mode: "direct_post.jwt",
      nonce,
      state,
      dcql_query: buildDcqlQuery(options.format),
      client_metadata: {
        jwks: { keys: [encryptionPublicJwk] },
        authorization_encrypted_response_alg: "ECDH-ES",
        authorization_encrypted_response_enc: "A128GCM",
        vp_formats_supported:
          options.format === "mso_mdoc"
            ? { mso_mdoc: { alg: ["ES256"] } }
            : { "dc+sd-jwt": { "sd-jwt_alg_values": ["ES256"], "kb-jwt_alg_values": ["ES256"] } },
      },
      aud: "https://self-issued.me/v2",
      iat: now,
      exp: now + 10 * 60,
      nbf: now,
    } as AuthorizationRequest;

    const session = this.store.create({
      id: sessionId,
      format: options.format,
      request,
      encryptionPublicJwk,
      encryptionPrivateJwk,
    });

    const requestUri = `${options.baseUrl}/api/verifier/request-object/${sessionId}`;
    const deepLink = `eudi-openid4vp://?request_uri=${encodeURIComponent(requestUri)}&client_id=${encodeURIComponent(
      request.client_id as string
    )}`;

    return { session, requestUri, deepLink };
  }
}
