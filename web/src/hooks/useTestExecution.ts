import { useState } from "react";
import { apiClient } from "../api/client.js";
import { Profile, SimulationMode, PIDTemplate } from "../types.js";
import { logger } from "../../../src/utils/Logger.js";

export const useTestExecution = () => {
  const [isLoading, setIsLoading] = useState(false);

  const executeTest = async (
    parsedRequest: any,
    profile: Profile,
    simulationMode: SimulationMode,
    pidTemplate: PIDTemplate,
    preferredFormat: 'dc+sd-jwt' | 'mso_mdoc'
  ) => {
    if (!parsedRequest) {
      return { success: false, session: null };
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post("/api/debug", {
        request: parsedRequest,
        validationProfile: profile,
        simulationMode,
        pidTemplate,
        postResponseToUri: true,
        preferredFormat,
      });

      setIsLoading(false);

      if (response.data.success) {
        return { success: true, session: response.data.data };
      } else {
        logger.error("Test failed", new Error(response.data.error?.message || "Unknown error"));
        return { success: false, session: null };
      }
    } catch (err: any) {
      logger.error("Test error", err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
      return { success: false, session: null };
    }
  };

  return { executeTest, isLoading };
};
