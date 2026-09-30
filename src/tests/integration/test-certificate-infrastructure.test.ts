/**
 * Integration test: Certificate Infrastructure
 * Tests X.509 certificate chain generation and integration with wallet simulator
 */

import { test } from 'node:test';
import { strict as assert } from 'assert';
import crypto from 'crypto';
import { CertificateManager } from '../../security/CertificateManager.js';
import { initializeRuntime } from '../../runtime.js';
import { getSDJWTGenerator } from '../../simulator/CredoSDJWTGenerator.js';
import { SimulationMode } from '../../types/index.js';

/**
 * Convert an IEEE P1363 signature (raw r||s, 64 bytes for P-256) to DER format,
 * as required by Node.js crypto.createVerify.
 */
function ieeeP1363ToDer(sig: Buffer): Buffer {
  if (sig.length !== 64) throw new Error('Expected 64-byte P-256 signature');
  const trimLeading = (b: Buffer): Buffer => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i++;
    const t = b.subarray(i);
    return (t[0] & 0x80) ? Buffer.concat([Buffer.from([0x00]), t]) : t;
  };
  const r = trimLeading(sig.subarray(0, 32));
  const s = trimLeading(sig.subarray(32, 64));
  const rDer = Buffer.concat([Buffer.from([0x02, r.length]), r]);
  const sDer = Buffer.concat([Buffer.from([0x02, s.length]), s]);
  const seq = Buffer.concat([rDer, sDer]);
  return Buffer.concat([Buffer.from([0x30, seq.length]), seq]);
}

test('Certificate infrastructure initialization', async () => {
  // Initialize runtime (this sets up certificates)
  await initializeRuntime();

  const certManager = CertificateManager.getInstance();
  const chain = certManager.getCertificateChain();

  console.log('\n=== Certificate Chain ===');
  console.log(`Root CA: ${chain.rootCA.cert.subject.typesAndValues[3].value.toString()}`);
  console.log(`Leaf Cert: ${chain.leafCert.cert.subject.typesAndValues[2].value.toString()}`);

  // Verify x5c array has 2 certificates
  assert.strictEqual(chain.x5c.length, 2, 'x5c should contain 2 certificates');
  console.log(`\nx5c array length: ${chain.x5c.length} ✓`);

  // Verify trust anchor is available
  assert.ok(chain.trustAnchor.pem.includes('BEGIN CERTIFICATE'), 'Trust anchor PEM should be valid');
  assert.ok(chain.trustAnchor.der.length > 0, 'Trust anchor DER should exist');
  console.log(`Trust anchor PEM format: ${chain.trustAnchor.pem.substring(0, 30)}... ✓`);
  console.log(`Trust anchor DER size: ${chain.trustAnchor.der.length} bytes ✓`);
});

test('SD-JWT generation includes x5c header', async () => {
  // Ensure runtime is initialized
  await initializeRuntime();

  const generator = getSDJWTGenerator();

  // Generate an SD-JWT credential
  const result = await generator.generate({
    mode: SimulationMode.VALID,
    requestedClaims: [['given_name'], ['family_name']],
    nonce: 'test-nonce',
    audience: 'https://example.com',
  });

  console.log('\n=== SD-JWT with x5c ===');
  console.log(`JWT Header: ${JSON.stringify(result.decoded.jwt.header, null, 2)}`);

  // Verify x5c is in the header
  assert.ok(result.decoded.jwt.header.x5c, 'JWT header should contain x5c');
  assert.ok(Array.isArray(result.decoded.jwt.header.x5c), 'x5c should be an array');
  assert.strictEqual(result.decoded.jwt.header.x5c.length, 2, 'x5c should contain 2 certificates');

  console.log(`\nx5c found in JWT header with ${result.decoded.jwt.header.x5c.length} certificates ✓`);
  console.log(`First certificate (leaf) length: ${result.decoded.jwt.header.x5c[0].length} bytes ✓`);
  console.log(`Second certificate (root) length: ${result.decoded.jwt.header.x5c[1].length} bytes ✓`);
});

test('SD-JWT signature verifies against the x5c leaf cert public key', async () => {
  await initializeRuntime();

  const result = await getSDJWTGenerator().generate({
    mode: SimulationMode.VALID,
    requestedClaims: [['given_name'], ['family_name']],
    nonce: 'test-nonce',
    audience: 'https://example.com',
  });

  // The SD-JWT compact format is: JWT~disclosure1~...~KB-JWT
  // The first segment before '~' is the issuer-signed JWT.
  const jwtPart = result.sdJwtVc.split('~')[0];
  const [headerB64, payloadB64, signatureB64] = jwtPart.split('.');

  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString()) as Record<string, unknown>;
  const x5c = header.x5c as string[] | undefined;

  assert.ok(x5c && x5c.length > 0, 'JWT header must contain x5c');

  // Extract the leaf cert public key and verify the signature with it.
  // This is exactly what a verifier (e.g. katana) does — if this fails, the
  // credential will be rejected during presentation even though erica reports success.
  const leafCert = new crypto.X509Certificate(Buffer.from(x5c[0], 'base64'));
  const sigRaw = Buffer.from(signatureB64, 'base64url');
  const sigDer = ieeeP1363ToDer(sigRaw);

  const verify = crypto.createVerify('SHA256');
  verify.update(`${headerB64}.${payloadB64}`);
  assert.ok(
    verify.verify(leafCert.publicKey, sigDer),
    'JWT signature must verify against the leaf cert public key (signing key must match x5c cert)',
  );
});

test('Trust anchor export works', async () => {
  await initializeRuntime();

  const certManager = CertificateManager.getInstance();
  const trustAnchor = certManager.getTrustAnchor();

  console.log('\n=== Trust Anchor Export ===');

  // Verify PEM format
  assert.ok(trustAnchor.pem.includes('-----BEGIN CERTIFICATE-----'), 'Should have PEM BEGIN marker');
  assert.ok(trustAnchor.pem.includes('-----END CERTIFICATE-----'), 'Should have PEM END marker');
  console.log('PEM format valid ✓');

  // Verify DER format
  assert.ok(trustAnchor.der instanceof Buffer, 'DER should be a Buffer');
  assert.ok(trustAnchor.der.length > 400, 'DER certificate should be substantial');
  console.log(`DER format valid (${trustAnchor.der.length} bytes) ✓`);

  // Show sample PEM for visual verification
  console.log(`\nSample PEM (first 200 chars):\n${trustAnchor.pem.substring(0, 200)}...`);
});
