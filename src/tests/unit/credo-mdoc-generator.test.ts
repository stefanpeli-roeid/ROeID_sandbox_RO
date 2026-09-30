/**
 * Regression test for the mdoc PID address claim naming bug: a real third-party
 * verifier's DCQL query requested ["eu.europa.ec.eudi.pid.1", "resident_city"] and
 * ["eu.europa.ec.eudi.pid.1", "resident_postal_code"] (the ARF-correct flat element
 * names for that namespace), but CredoMdocGenerator used to emit street_address/
 * postal_code/locality/country instead, so those claims were silently dropped.
 */

import { test } from "node:test";
import { strict as assert } from "assert";
import { initializeRuntime } from "../../runtime.js";
import { CredoMdocGenerator } from "../../simulator/CredoMdocGenerator.js";
import { generateFakePIDData } from "../../simulator/FakePIDData.js";
import { SimulationMode } from "../../types/index.js";

test("CredoMdocGenerator - discloses resident_* address claims requested by mdoc DCQL path", async () => {
  await initializeRuntime();

  const generator = new CredoMdocGenerator();
  const pidClaims = generateFakePIDData();

  const requestedClaims = [
    ["eu.europa.ec.eudi.pid.1", "family_name"],
    ["eu.europa.ec.eudi.pid.1", "given_name"],
    ["eu.europa.ec.eudi.pid.1", "birth_date"],
    ["eu.europa.ec.eudi.pid.1", "resident_city"],
    ["eu.europa.ec.eudi.pid.1", "resident_postal_code"],
    ["eu.europa.ec.eudi.pid.1", "nationality"],
  ];

  const result = await generator.generate({
    mode: SimulationMode.VALID,
    requestedClaims,
    nonce: "test-nonce",
    audience: "https://verifier.example.com",
    responseUri: "https://verifier.example.com/response",
    pidClaims,
    dcqlCredentialId: "pid",
  });

  assert.deepEqual(
    Object.keys(result.claims).sort(),
    ["birth_date", "family_name", "given_name", "nationality", "resident_city", "resident_postal_code"].sort(),
    "Every requested claim path should resolve to a disclosed claim"
  );
  assert.equal(result.claims.resident_city, pidClaims.address!.locality);
  assert.equal(result.claims.resident_postal_code, pidClaims.address!.postal_code);
  assert.equal(result.claims.nationality, pidClaims.nationalities![0]);

  const namespaces = result.decoded?.issuerSigned?.namespaces?.["eu.europa.ec.eudi.pid.1"];
  assert.ok(namespaces, "Decoded DeviceResponse should carry the pid namespace");
  assert.ok("resident_city" in namespaces, "DeviceResponse should carry resident_city");
  assert.ok("resident_postal_code" in namespaces, "DeviceResponse should carry resident_postal_code");
});
