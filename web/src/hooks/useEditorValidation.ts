import { useState } from "react";
import { apiClient } from "../api/client.js";
import { Profile, SimulationMode, PIDTemplate } from "../types.js";
import { logger } from "../../../src/utils/Logger.js";

export const useEditorValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const validateRequest = async (requestJson: string, profile: Profile) => {
    setIsValidating(true);
    try {
      const request = JSON.parse(requestJson);
      const response = await apiClient.post("/api/debug", {
        request,
        validationProfile: profile,
        simulationMode: SimulationMode.VALID,
        pidTemplate: PIDTemplate.NORMAL,
        postResponseToUri: false,
        preferredFormat: 'dc+sd-jwt',
      });

      if (response.data.success) {
        setValidationResult(response.data.data.requestValidation);
      }
    } catch (err: any) {
      logger.error("Validation error", err instanceof Error ? err : new Error(String(err)));
      setValidationResult({
        valid: false,
        errors: [{ message: err?.message || "Invalid JSON or validation failed" }]
      });
    } finally {
      setIsValidating(false);
    }
  };

  const clearValidation = () => {
    setValidationResult(null);
  };

  return { validateRequest, isValidating, validationResult, clearValidation };
};
