import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { initializeRuntime } from "./src/runtime.js";
import debugRoutes from "./api/src/routes/debug.js";
import verifierRoutes from "./api/src/routes/verifier.js";
import { logger } from "./src/utils/Logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", true);
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
// Wallets POST direct_post.jwt responses as application/x-www-form-urlencoded
app.use("/api/verifier", express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API Routes
app.use("/api", debugRoutes);
app.use("/api/verifier", verifierRoutes);

async function startServer() {
  try {
    // Initialize certificate infrastructure and trust list
    await initializeRuntime();

    if (process.env.NODE_ENV === "production") {
      const publicPath = path.resolve(__dirname, "web/dist");
      app.use(express.static(publicPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.resolve(publicPath, "index.html"));
      });
    } else {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          host: "0.0.0.0",
        },
        appType: "spa",
        root: path.resolve(__dirname, "web"),
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`ERICA – EUDI VP Debugger started on http://0.0.0.0:${PORT}`, {
        port: PORT,
        debugEndpoint: `/api/debug`,
        certificateInfrastructure: "initialized",
      });
    });
  } catch (error) {
    logger.error("Failed to start server", error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

startServer();
