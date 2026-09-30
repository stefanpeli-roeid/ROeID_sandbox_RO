/**
 * End-to-end self-test for ERICA's first-party verifier: builds a real verifier
 * session, drives the *existing* WalletSimulator against it over a genuine HTTP
 * POST (matching what a real wallet would do to response_uri), and asserts the
 * full encrypt -> POST -> decrypt -> verifyMdocDeviceResponse round trip passes
 * with no phone involved. See plan step "Self-test smoke test".
 */

import { test } from "node:test";
import { strict as assert } from "assert";
import http from "node:http";
import type { AddressInfo } from "node:net";
import {
  createVerifierRequestBuilder,
  createVerifierResponseHandler,
  getVerifierSessionStore,
  initializeRuntime,
} from "../../runtime.js";
import { WalletSimulator } from "../../simulator/WalletSimulator.js";
import { SimulationMode } from "../../types/index.js";
import type { VerifierRequestFormat } from "../../verifier/VerifierRequestBuilder.js";

async function startVerifierServer(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const responseHandler = createVerifierResponseHandler();

  const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url?.startsWith("/api/verifier/response/")) {
      const sessionId = req.url.split("/").pop() as string;
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        const params = new URLSearchParams(body);
        try {
          const result = await responseHandler.handleResponse(sessionId, {
            response: params.get("response") ?? undefined,
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "invalid_request",
              error_description: error instanceof Error ? error.message : String(error),
            })
          );
        }
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function runSelfTest(format: VerifierRequestFormat) {
  await initializeRuntime();

  const { baseUrl, close } = await startVerifierServer();
  try {
    const requestBuilder = createVerifierRequestBuilder();
    const store = getVerifierSessionStore();

    const { session } = await requestBuilder.buildRequest({ format, baseUrl });

    const walletSimulator = new WalletSimulator();
    const result = (await walletSimulator.simulate(session.request, {
      mode: SimulationMode.VALID,
      credentialSource: "TEMPLATE",
      postResponseToUri: true,
      preferredFormat: format,
    })) as any;

    assert.ok(result.postResult, "WalletSimulator should have attempted to POST the response");
    assert.equal(
      result.postResult.success,
      true,
      `POST to response_uri should succeed: ${result.postResult.error}`
    );
    assert.equal(result.postResult.statusCode, 200);

    const updatedSession = store.get(session.id);
    assert.ok(updatedSession, "Verifier session should still exist after the response was posted");
    assert.equal(updatedSession!.status, "RECEIVED");
    assert.ok(updatedSession!.responseValidation, "Response validation should have run");

    const checks = updatedSession!.responseValidation!.checks || [];
    assert.ok(checks.length > 0, "Should have produced at least one validation check");

    const errorChecks = checks.filter((c: any) => !c.passed && c.severity === "ERROR");
    assert.deepEqual(
      errorChecks,
      [],
      `Expected no ERROR-severity checks, got: ${JSON.stringify(errorChecks, null, 2)}`
    );

    return checks;
  } finally {
    await close();
  }
}

test("Verifier self-test: mdoc end-to-end via WalletSimulator", async () => {
  const checks = await runSelfTest("mso_mdoc");

  const variantCheck = checks.find((c: any) =>
    c.checkId.endsWith("mdoc.session_transcript.variant_detected")
  );
  assert.ok(variantCheck, "Should report which SessionTranscript handover variant validated");
  assert.equal(variantCheck.passed, true, `Expected a validated handover variant: ${variantCheck.details}`);
});

test("Verifier self-test: SD-JWT end-to-end via WalletSimulator", async () => {
  await runSelfTest("dc+sd-jwt");
});
