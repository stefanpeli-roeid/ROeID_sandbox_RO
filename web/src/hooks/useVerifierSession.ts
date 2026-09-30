import { useState } from "react";
import { apiClient } from "../api/client.js";
import { VerifierFormat, VerifierSessionData } from "../types.js";
import { logger } from "../../../src/utils/Logger.js";

export const useVerifierSession = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createSession = async (format: VerifierFormat) => {
    setIsCreating(true);
    try {
      const response = await apiClient.post("/api/verifier/session", { format });
      setIsCreating(false);

      if (response.data.success) {
        return { success: true, session: response.data.data };
      }
      logger.error("Verifier session creation failed", new Error(response.data.error?.message || "Unknown error"));
      return { success: false, session: null };
    } catch (err: any) {
      logger.error("Verifier session creation error", err instanceof Error ? err : new Error(String(err)));
      setIsCreating(false);
      return { success: false, session: null };
    }
  };

  const pollSession = async (sessionId: string): Promise<{ success: boolean; data: VerifierSessionData | null }> => {
    try {
      const response = await apiClient.get(`/api/verifier/session/${sessionId}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, data: null };
    } catch (err: any) {
      logger.error("Verifier session polling error", err instanceof Error ? err : new Error(String(err)));
      return { success: false, data: null };
    }
  };

  return { createSession, pollSession, isCreating };
};
