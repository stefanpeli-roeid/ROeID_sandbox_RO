/**
 * Verifier endpoints
 * ERICA acting as its own first-party OpenID4VP verifier, so real wallets (or our own
 * WalletSimulator, for the self-test smoke path) can be tested end-to-end with full
 * visibility into request/response/validation - see src/verifier/.
 */

import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { logger } from "../utils/Logger.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getRuntimeUrl(): string {
  const rootDir = path.resolve(__dirname, "../../..");
  const distPath = path.resolve(rootDir, "dist/runtime.js");
  const srcPath = path.resolve(rootDir, "src/runtime.ts");
  return pathToFileURL(fs.existsSync(distPath) ? distPath : srcPath).href;
}

async function loadRuntime() {
  const url = getRuntimeUrl();
  try {
    return await import(url);
  } catch (error) {
    logger.error(`Failed to load runtime from: ${url}`, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * A phone running a real wallet can't reach localhost - the request/response endpoints
 * must be built from a publicly reachable base URL (e.g. an ngrok tunnel), configurable
 * via VERIFIER_BASE_URL. Falls back to the incoming request's own host, which works for
 * the localhost-only self-test smoke path.
 */
function resolveBaseUrl(req: Request): string {
  if (process.env.VERIFIER_BASE_URL) {
    return process.env.VERIFIER_BASE_URL.replace(/\/+$/, "");
  }
  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

interface CreateSessionRequest {
  format?: "mso_mdoc" | "dc+sd-jwt";
}

/**
 * Create a new verifier session and OpenID4VP request
 * POST /api/verifier/session
 */
router.post("/session", async (req: Request<{}, any, CreateSessionRequest>, res: Response) => {
  try {
    const format = req.body.format === "mso_mdoc" ? "mso_mdoc" : "dc+sd-jwt";

    const runtime = await loadRuntime();
    const requestBuilder = runtime.createVerifierRequestBuilder();

    const { session, requestUri, deepLink } = await requestBuilder.buildRequest({
      format,
      baseUrl: resolveBaseUrl(req),
    });

    return res.json({
      success: true,
      data: {
        sessionId: session.id,
        requestUri,
        deepLink,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    logger.error("Verifier session creation error", error instanceof Error ? error : new Error(String(error)));
    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to create verifier session",
        details: error instanceof Error ? error.message : String(error),
      },
    });
  }
});

/**
 * Serve the OpenID4VP request object for the wallet's request_uri fetch
 * GET /api/verifier/request-object/:sessionId
 */
router.get("/request-object/:sessionId", async (req: Request, res: Response) => {
  try {
    const runtime = await loadRuntime();
    const store = runtime.getVerifierSessionStore();
    const session = store.get(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: { message: "Unknown or expired verifier session" } });
    }

    res.setHeader("Content-Type", "application/json");
    return res.json(session.request);
  } catch (error) {
    logger.error("Request object endpoint error", error instanceof Error ? error : new Error(String(error)));
    return res.status(500).json({
      success: false,
      error: { message: "Failed to serve request object", details: error instanceof Error ? error.message : String(error) },
    });
  }
});

/**
 * The wallet's response_uri target: decrypts and validates the direct_post.jwt response
 * POST /api/verifier/response/:sessionId
 *
 * Body parsing: this endpoint needs express.urlencoded() (registered scoped to this route
 * in server.ts) - the wallet posts `application/x-www-form-urlencoded` with a `response`
 * field, not JSON.
 */
router.post("/response/:sessionId", async (req: Request, res: Response) => {
  try {
    const runtime = await loadRuntime();
    const responseHandler = runtime.createVerifierResponseHandler();

    const result = await responseHandler.handleResponse(req.params.sessionId, req.body);

    return res.status(200).json(result);
  } catch (error) {
    logger.error("Verifier response handling error", error instanceof Error ? error : new Error(String(error)));
    return res.status(400).json({
      error: "invalid_request",
      error_description: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Poll a verifier session's status/results for the frontend "waiting" step
 * GET /api/verifier/session/:sessionId
 */
router.get("/session/:sessionId", async (req: Request, res: Response) => {
  try {
    const runtime = await loadRuntime();
    const store = runtime.getVerifierSessionStore();
    const session = store.get(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: { message: "Unknown or expired verifier session" } });
    }

    return res.json({
      success: true,
      data: {
        id: session.id,
        format: session.format,
        status: session.status,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        rawResponse: session.rawResponse,
        decodedVPTokens: session.decodedVPTokens,
        responseValidation: session.responseValidation,
        error: session.error,
      },
    });
  } catch (error) {
    logger.error("Verifier session polling error", error instanceof Error ? error : new Error(String(error)));
    return res.status(500).json({
      success: false,
      error: { message: "Failed to retrieve verifier session", details: error instanceof Error ? error.message : String(error) },
    });
  }
});

export default router;
