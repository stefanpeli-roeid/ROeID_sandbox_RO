/**
 * Response Token Decoder
 * Decodes raw vp_token strings (mdoc DeviceResponse or SD-JWT presentation) into the
 * shared DecodedVPToken shape used by both the wallet-simulator flow and the verifier
 * flow, so existing UI components (WalletResponseInspector etc.) render either unmodified.
 */

import { MdocDeviceResponse } from "@credo-ts/core";
import { DecodedVPToken, DecodedJWT } from "../types/index.js";

function base64urlDecode(input: string): Buffer {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}

/**
 * Decode a base64url-encoded ISO 18013-5 DeviceResponse.
 * Works on any well-formed DeviceResponse, not just self-generated ones.
 */
export function decodeMdocToken(deviceResponseBase64: string): DecodedVPToken {
  const deviceResponse = MdocDeviceResponse.fromBase64Url(deviceResponseBase64);
  const doc = deviceResponse.documents[0];

  return {
    format: "mso_mdoc",
    docType: doc.docType,
    issuerSigned: {
      namespaces: doc.issuerSignedNamespaces,
      issuerAuth: {},
    },
    deviceSigned: (doc as any).deviceSignedNamespaces ?? undefined,
    metadata: {
      algorithm: (doc as any).alg ?? "",
      digestAlgorithm: "sha-256",
      validFrom: doc.validityInfo?.validFrom,
      validUntil: doc.validityInfo?.validUntil,
    },
  };
}

function decodeJwtPart(jwt: string): DecodedJWT {
  const [headerB64, payloadB64, signature] = jwt.split(".");
  return {
    header: JSON.parse(base64urlDecode(headerB64).toString("utf-8")),
    payload: JSON.parse(base64urlDecode(payloadB64).toString("utf-8")),
    signature,
  };
}

/**
 * Decode an SD-JWT presentation: JWT~disclosure1~disclosure2~...~KB-JWT
 */
export function decodeSdJwtToken(token: string): DecodedVPToken {
  const parts = token.split("~");
  const jwtPart = parts[0];
  const disclosures = parts.slice(1, parts.length > 1 ? -1 : undefined).filter((p) => p);
  const kbJwtPart = parts.length > 1 ? parts[parts.length - 1] : undefined;

  const jwt = decodeJwtPart(jwtPart);
  const kbJwt = kbJwtPart ? decodeJwtPart(kbJwtPart) : undefined;

  return {
    format: "sd-jwt",
    jwt,
    disclosures,
    kbJwt,
    metadata: {
      algorithm: jwt.header.alg,
      type: jwt.header.typ,
      keyId: jwt.header.kid,
      issuer: jwt.payload.iss,
      subject: jwt.payload.sub,
      issuedAt: jwt.payload.iat,
      expiresAt: jwt.payload.exp,
      notBefore: jwt.payload.nbf,
      credentialType: jwt.payload.vct,
      audience: jwt.payload.aud,
    },
    holderBinding: kbJwt
      ? {
          nonce: kbJwt.payload.nonce,
          audience: kbJwt.payload.aud,
          issuedAt: kbJwt.payload.iat,
          expiresAt: kbJwt.payload.exp,
        }
      : undefined,
  };
}

/**
 * Decode a single vp_token entry, auto-detecting mdoc (base64url CBOR, no '.'/'~') vs SD-JWT.
 */
export function decodeToken(token: string): DecodedVPToken {
  const isMdoc = !token.includes("~") && !token.includes(".");
  return isMdoc ? decodeMdocToken(token) : decodeSdJwtToken(token);
}
