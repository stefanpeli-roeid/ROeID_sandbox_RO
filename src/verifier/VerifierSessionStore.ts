/**
 * Verifier Session Store
 * In-memory store for verifier sessions created by ERICA's own OpenID4VP verifier
 * (see src/verifier/). Single-process debugging tool - no persistence needed.
 */

import crypto from "crypto";
import { AuthorizationRequest, ValidationResult, DecodedVPToken } from "../types/index.js";

export type VerifierSessionStatus = "PENDING" | "RECEIVED" | "ERROR" | "EXPIRED";

export interface VerifierSession {
  id: string;
  format: "mso_mdoc" | "dc+sd-jwt";
  createdAt: number;
  expiresAt: number;
  status: VerifierSessionStatus;
  request: AuthorizationRequest;
  // Ephemeral ECDH-ES keypair generated for this session. The public half is embedded
  // in the request's client_metadata.jwks.keys; the private half decrypts the response JWE.
  encryptionPublicJwk: Record<string, unknown>;
  encryptionPrivateJwk: Record<string, unknown>;
  rawResponse?: string; // raw vp_token(s) as received, for display
  decodedVPTokens?: DecodedVPToken[];
  responseValidation?: ValidationResult;
  error?: string;
}

// Single-process debugging tool - a short TTL is enough to cover "scan the QR, respond"
// without sessions accumulating forever.
const TTL_MS = 10 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;

export class VerifierSessionStore {
  private static instance: VerifierSessionStore;
  private sessions = new Map<string, VerifierSession>();
  private sweepTimer: ReturnType<typeof setInterval>;

  private constructor() {
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    if (typeof this.sweepTimer.unref === "function") {
      this.sweepTimer.unref();
    }
  }

  static getInstance(): VerifierSessionStore {
    if (!VerifierSessionStore.instance) {
      VerifierSessionStore.instance = new VerifierSessionStore();
    }
    return VerifierSessionStore.instance;
  }

  /**
   * Reserve a fresh session id without creating a session yet. Needed because the
   * response_uri/client_id baked into the request object must contain the session id
   * before the request (and thus the session record) is finalized.
   */
  reserveId(): string {
    return crypto.randomUUID();
  }

  create(
    data: Omit<VerifierSession, "createdAt" | "expiresAt" | "status"> & { id?: string }
  ): VerifierSession {
    const now = Date.now();
    const session: VerifierSession = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      createdAt: now,
      expiresAt: now + TTL_MS,
      status: "PENDING",
    };
    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): VerifierSession | undefined {
    return this.sessions.get(id);
  }

  update(id: string, patch: Partial<VerifierSession>): VerifierSession | undefined {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;
    const updated: VerifierSession = { ...existing, ...patch };
    this.sessions.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }
  }
}
