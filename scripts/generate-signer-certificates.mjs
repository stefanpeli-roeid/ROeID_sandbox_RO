#!/usr/bin/env node
// One-time/dev utility: generates stable mdoc + SD-JWT signer certificates signed by the
// persisted root CA (src/security/issuer/issuer-certificate.pem) and writes them to disk so
// CertificateManager loads the same signer identities on every run. Run after `npm run
// build:core`:
//
//   node scripts/generate-signer-certificates.mjs
//
// Re-run only if the signer certs need to be rotated - doing so changes the leaf certs that
// get embedded in generated PIDs (the root CA / trust anchor is untouched).

import path from "path";
import { fileURLToPath } from "url";
import { CertificateManager } from "../dist/security/CertificateManager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const issuerDir = path.resolve(__dirname, "../src/security/issuer");

const certManager = CertificateManager.getInstance();
await certManager.generateAndPersistSignerCertificates(issuerDir);

console.log(`[generate-signer-certificates] Wrote mdoc-signer and sdjwt-signer certificates to ${issuerDir}`);
