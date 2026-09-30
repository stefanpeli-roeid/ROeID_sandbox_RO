/**
 * Template generators for presentation requests
 */

export const createPIDTemplate = () => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 10 * 60;
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `${Math.floor(Math.random() * 1e8)}-${now}`;

  return {
    response_type: "vp_token",
    client_id: "x509_hash:fQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE",
    response_uri: "https://example.com/oid4vp",
    response_mode: "direct_post.jwt",
    nonce: randomId,
    verifier_info: {
      data: "registrationcertificatejwt",
      format: "registration_cert"
    },
    dcql_query: {
      credentials: [{
        id: "pid-sd-jwt",
        format: "dc+sd-jwt",
        claims: [
          { path: ["given_name"] },
          { path: ["family_name"] },
          { path: ["birthdate"] }
        ],
        meta: { vct_values: ["urn:eudi:pid:de:1"] }
      }]
    },
    client_metadata: {
      jwks: { keys: [{
        kty: "EC",
        x: "ShU4Fr3NH7v9TOAc9aYiu9eicdkfVT9ecVCPaPgJrMs",
        y: "iV0VXASylR0qWoDr_mKUWwzo-M59Wz3QBzpCm4oiXT0",
        crv: "P-256"
      }] },
      vp_formats_supported: {
        "dc+sd-jwt": {
          "kb-jwt_alg_values": ["ES256"],
          "sd-jwt_alg_values": ["ES256"]
        }
      }
    },
    state: randomId,
    aud: "https://self-issued.me/v2",
    exp: now + expiresIn,
    iat: now,
    nbf: now
  };
};

export const createPIDRomaniaTemplate = () => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 10 * 60;
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `${Math.floor(Math.random() * 1e8)}-${now}`;

  return {
    response_type: "vp_token",
    client_id: "x509_hash:fQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE",
    response_uri: "https://servicii.mai.gov.ro/oid4vp/response",
    response_mode: "direct_post.jwt",
    nonce: randomId,
    verifier_info: {
      data: "registrationcertificatejwt",
      format: "registration_cert"
    },
    dcql_query: {
      credentials: [{
        id: "pid-sd-jwt",
        format: "dc+sd-jwt",
        claims: [
          { path: ["given_name"] },
          { path: ["family_name"] },
          { path: ["birthdate"] },
          { path: ["personal_administrative_number"] },
          { path: ["nationalities"] },
          { path: ["gender"] },
          { path: ["birth_place"] },
          { path: ["address", "locality"] }
        ],
        meta: { vct_values: ["urn:eu.europa.ec.eudi:pid:1", "urn:eudi:pid:ro:1"] }
      }]
    },
    client_metadata: {
      client_name: "Portal Verificare Servicii Publice România (IGSU / MAI)",
      jwks: { keys: [{
        kty: "EC",
        x: "ShU4Fr3NH7v9TOAc9aYiu9eicdkfVT9ecVCPaPgJrMs",
        y: "iV0VXASylR0qWoDr_mKUWwzo-M59Wz3QBzpCm4oiXT0",
        crv: "P-256"
      }] },
      vp_formats_supported: {
        "dc+sd-jwt": {
          "kb-jwt_alg_values": ["ES256"],
          "sd-jwt_alg_values": ["ES256"]
        }
      }
    },
    state: randomId,
    aud: "https://self-issued.me/v2",
    exp: now + expiresIn,
    iat: now,
    nbf: now
  };
};

export const createPIDMdocTemplate = () => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 10 * 60;
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `${Math.floor(Math.random() * 1e8)}-${now}`;

  return {
    response_type: "vp_token",
    client_id: "x509_hash:fQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE",
    response_uri: "https://example.com/oid4vp",
    response_mode: "direct_post.jwt",
    nonce: randomId,
    verifier_info: {
      data: "registrationcertificatejwt",
      format: "registration_cert"
    },
    dcql_query: {
      credentials: [{
        id: "pid-mdoc",
        format: "mso_mdoc",
        claims: [
          { path: ["given_name"] },
          { path: ["family_name"] },
          { path: ["birth_date"] }
        ],
        meta: { doctype_value: "eu.europa.ec.eudi.pid.1" }
      }]
    },
    client_metadata: {
      jwks: { keys: [{
        kty: "EC",
        x: "ShU4Fr3NH7v9TOAc9aYiu9eicdkfVT9ecVCPaPgJrMs",
        y: "iV0VXASylR0qWoDr_mKUWwzo-M59Wz3QBzpCm4oiXT0",
        crv: "P-256"
      }] },
      vp_formats_supported: {
        "mso_mdoc": {
          alg: ["ES256"]
        }
      }
    },
    state: randomId,
    aud: "https://self-issued.me/v2",
    exp: now + expiresIn,
    iat: now,
    nbf: now
  };
};


export const createEAATemplate = () => {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 10 * 60;
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `${Math.floor(Math.random() * 1e8)}-${now}`;

  return {
    response_type: "vp_token",
    client_id: "x509_hash:fQuobVwJv000vDWcMtriXPzo2sPTm5_Mp10O87lCqcE",
    response_uri: "https://example.com/oid4vp",
    response_mode: "direct_post.jwt",
    nonce: randomId,
    verifier_info: {
      data: "registrationcertificatejwt",
      format: "registration_cert",
    },
    dcql_query: {
      credentials: [{
        id: "diploma-sd-jwt",
        format: "dc+sd-jwt",
        claims: [
          { path: ["degree"] },
          { path: ["field_of_study"] },
          { path: ["institution"] },
          { path: ["graduation_date"] }
        ],
        meta: { vct_values: ["https://example.com/credentials/diploma"] }
      }]
    },
    client_metadata: {
      jwks: { keys: [{
        kty: "EC",
        x: "ShU4Fr3NH7v9TOAc9aYiu9eicdkfVT9ecVCPaPgJrMs",
        y: "iV0VXASylR0qWoDr_mKUWwzo-M59Wz3QBzpCm4oiXT0",
        crv: "P-256"
      }] },
      vp_formats_supported: {
        "dc+sd-jwt": {
          "kb-jwt_alg_values": ["ES256"],
          "sd-jwt_alg_values": ["ES256"]
        }
      }
    },
    state: randomId,
    aud: "https://self-issued.me/v2",
    exp: now + expiresIn,
    iat: now,
    nbf: now
  };
};
