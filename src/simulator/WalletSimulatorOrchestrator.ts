/**
 * Wallet Simulator Orchestrator
 * Coordinates all simulation steps and provides a unified API for EudiVpDebugger
 */

import CredentialMatcher, { DCQLCredential } from "./CredentialMatcher.js";
import { CredoSDJWTGenerator } from "./CredoSDJWTGenerator.js";
import { CredoMdocGenerator } from "./CredoMdocGenerator.js";
import PresentationResponseAssembler from "./PresentationResponseAssembler.js";
import WalletSimulatorDiagnostics, {
  SimulationDiagnostics,
} from "./WalletSimulatorDiagnostics.js";
import { SimulationMode, PresentationResponse } from "../types/index.js";
import { logger } from "../utils/Logger.js";

import type { DecodedVPToken } from "./CredoSDJWTGenerator.js";

export interface OrchestrationResult {
  success: boolean;
  error?: string;
  response: PresentationResponse;
  diagnostics: SimulationDiagnostics;
  vp_token?: Record<string, string[]>;
  decodedVPTokens?: DecodedVPToken[];
}

export class WalletSimulatorOrchestrator {
  /**
   * Execute the full wallet simulator pipeline: match DCQL-requested credentials,
   * generate them (SD-JWT or mdoc), and assemble the presentation response.
   */
  static async simulate(
    dcqlCredentials: DCQLCredential[],
    state?: string,
    mode: SimulationMode = SimulationMode.VALID,
    nonce?: string,
    audience?: string,
    pidTemplate: string = "normal",
    // Verifier's response_uri, distinct from `audience` (client_id). Required for the
    // mdoc SessionTranscript, which hashes clientId and responseUri independently.
    responseUri?: string,
    // Verifier's ECDH-ES public encryption key (raw JWK), the same key used to encrypt
    // the JWE response. Required for the mdoc SessionTranscript's OpenID4VPHandover, which
    // hashes this key's JWK thumbprint.
    verifierEncryptionJwk?: Record<string, unknown>
  ): Promise<OrchestrationResult> {
    const diagnosticsAggregator = new WalletSimulatorDiagnostics();

    try {
      // Generate PID credentials matching DCQL. PID caching is disabled because KB-JWT
      // must be regenerated with fresh nonce/audience for each request to ensure proper
      // replay protection and audience validation per spec.
      const matcher = new CredentialMatcher();
      const matchedCredentials = matcher.matchCredentials(dcqlCredentials, mode, pidTemplate);
      diagnosticsAggregator.registerComponent(
        "CredentialMatcher",
        "Credential Matching",
        matcher.getDiagnostics()
      );

      if (matchedCredentials.length === 0) {
        const errorMsg = "No credentials matched DCQL requirements";
        logger.error("[WalletSimulatorOrchestrator] " + errorMsg, {
          dcqlCredentials,
          diagnostics: matcher.getDiagnostics(),
        });
        throw new Error(errorMsg);
      }

      const generatedCredentials = [];
      const credoGenerator = new CredoSDJWTGenerator();
      const mdocGenerator = new CredoMdocGenerator();

      for (const matched of matchedCredentials) {
        logger.info(`Generating new PID for format: ${matched.credential.format}`, {
          action: 'PID_GENERATION',
        });
        const requestedPaths = matched.requestedClaimPaths;

        // Check if this is an mdoc format credential
        if (matched.credential.format === "mso_mdoc") {
          // Generate mdoc credential
          const result = await mdocGenerator.generate({
            mode,
            requestedClaims: requestedPaths,
            nonce: nonce || state || "default-nonce",
            audience: audience || "https://self-issued.me/v2",
            responseUri: responseUri || audience || "https://self-issued.me/v2",
            pidClaims: matched.credential.claims,
            dcqlCredentialId: matched.credentialId,
            verifierEncryptionJwk,
          });

          // Convert to GeneratedCredential format
          generatedCredentials.push({
            credentialId: matched.credentialId,
            format: "mso_mdoc" as const,
            vp: result.mdoc,
            decoded: result.decoded as any, // Convert mdoc decoded to common format
            diagnostics: [{
              timestamp: Date.now(),
              event: "mso_mdoc generated with request-specific nonce/audience",
              details: {
                mode,
                claimsCount: Object.keys(result.claims).length,
                nonce: nonce || state || "default-nonce",
                audience: audience || "https://self-issued.me/v2"
              }
            }],
          });
        } else {
          // Generate SD-JWT with mode and request-specific values
          const result = await credoGenerator.generate({
            mode,
            requestedClaims: requestedPaths,
            nonce: nonce || state || "default-nonce",
            audience: audience || "https://self-issued.me/v2",
            pidClaims: matched.credential.claims,
            format: matched.credential.format,
          });

          // Convert to GeneratedCredential format
          generatedCredentials.push({
            credentialId: matched.credentialId, // Preserve the credential ID from the request
            format: matched.credential.format as "dc+sd-jwt" | "vc+sd-jwt" | "mso_mdoc",
            vp: result.sdJwtVc,
            decoded: result.decoded, // Include decoded structure
            diagnostics: [{
              timestamp: Date.now(),
              event: "SD-JWT generated with request-specific nonce/audience",
              details: {
                mode,
                claimsCount: Object.keys(result.claims).length,
                nonce: nonce || state || "default-nonce",
                audience: audience || "https://self-issued.me/v2"
              }
            }],
          });
        }
      }

      diagnosticsAggregator.registerComponent(
        "CredoSDJWTGenerator",
        "JWT Generation",
        [{
          timestamp: Date.now(),
          event: "Mode-based SD-JWT generation (PIDs generated fresh for each request)",
          details: { 
            mode, 
            credentialCount: generatedCredentials.length,
            note: "PID caching disabled for security: KB-JWT must use fresh nonce/audience per spec"
          }
        }]
      );

      // Assemble presentation response
      const assembler = new PresentationResponseAssembler();
      const assembled = assembler.assembleResponse(
        generatedCredentials,
        state
      );
      diagnosticsAggregator.registerComponent(
        "PresentationResponseAssembler",
        "Response Assembly",
        assembler.getDiagnostics()
      );

      const aggregatedDiagnostics = diagnosticsAggregator.aggregate();

      return {
        success: true,
        response: assembled.response,
        diagnostics: aggregatedDiagnostics,
        vp_token: assembled.response.vp_token,
        decodedVPTokens: assembled.decodedVPTokens,
      };
    } catch (error) {
      const aggregatedDiagnostics = diagnosticsAggregator.aggregate();
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        diagnostics: aggregatedDiagnostics,
        response: { vp_token: {} },
      };
    }
  }
}

export default WalletSimulatorOrchestrator;
