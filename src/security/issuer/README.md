# Test PID Issuer Certificates

## ⚠️ WARNING: TEST ONLY - DO NOT USE IN PRODUCTION ⚠️

These certificates are for **testing purposes only** and are used by the EUDI VP Debugger wallet simulator to sign PID credentials.

### What's Here

- `issuer-private-key.pem` / `issuer-certificate.pem` - the root CA (trust anchor). Self-signed.
- `mdoc-signer-private-key.pem` / `mdoc-signer-certificate.pem` - leaf cert signing mdoc PIDs.
  No `basicConstraints` extension, per the ISO 18013-5 Document Signer profile (Annex B).
- `sdjwt-signer-private-key.pem` / `sdjwt-signer-certificate.pem` - leaf cert signing SD-JWT VC
  PIDs. Carries `basicConstraints` (`cA:FALSE`), as expected by general X.509/PKIX-based
  verifiers for an end-entity cert.

Both signer certs are issued by the root CA above and are loaded from these files on every
startup (see `CertificateManager.loadCertificateChain`) rather than regenerated - so the same
signer identity, and the same root trust anchor, stay stable across restarts and deployments.
Regenerate them with `node scripts/generate-signer-certificates.mjs` (after `npm run
build:core`) only if you intend to rotate them; doing so changes the leaf certs embedded in
every future generated PID, though the root CA/trust anchor is untouched.

### Security Notice

**THESE KEYS ARE INTENTIONALLY PUBLIC AND COMMITTED TO THE REPOSITORY**

- ❌ DO NOT use these certificates in production
- ❌ DO NOT trust these certificates for real identity verification
- ❌ DO NOT use PIDs signed by these certificates for actual authentication
- ✅ DO use these certificates to test your Relying Party verification logic
- ✅ DO use these certificates to understand EUDI PID flows

### For Relying Party Developers

If you're building an EUDI Relying Party and want to test against the wallet simulator:

1. **Download the trust anchor**: `GET https://your-debugger-url/api/issuer/trust-anchor`
2. **Add to your test trust list**: Configure your RP to trust this issuer (test environment only!)
3. **Verify credentials**: PIDs from the wallet simulator are signed by the mdoc/SD-JWT signer
   certs above, both of which chain to the trust anchor and are stable across restarts - so a
   trust anchor added once keeps working for as long as you want to test against it.

### Certificate Details

```
Root CA:
  Subject: C=DE, O=EUDI VP Debugger - TEST ONLY, OU=Wallet Simulator, CN=Test PID Issuer (DO NOT USE IN PRODUCTION)
  Validity: 10 years from 2026-05-04
  Algorithm: ES256 (P-256)

mdoc / SD-JWT signers:
  Subject: C=DE, O=EUDI VP Debugger, CN=EUDI VP Debugger Wallet Simulator
  Issuer: (root CA above)
  Validity: 5 years from 2026-07-31
  Algorithm: ES256 (P-256)
```

### Why Are These Keys Public?

This is a **debugging and testing tool**. The private key is intentionally public so that:
- Developers can reproduce the exact same credentials
- RPs can configure a stable trust anchor for testing
- The community can verify the tool's behavior
- There's no confusion about security (it's clearly labeled as TEST ONLY)

**Any PID signed by these certificates is FAKE and contains NO real personal data.**

### For Production

In a production environment:
- PID issuers use HSM-protected private keys
- Certificates are issued by government certificate authorities
- Trust lists are maintained by national or European authorities
- Private keys are NEVER public

These are test certificates only. Never use in production.
