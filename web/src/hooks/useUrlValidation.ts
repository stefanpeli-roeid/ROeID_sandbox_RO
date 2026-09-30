import { useState } from "react";
import { apiClient } from "../api/client.js";

export const useUrlValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = async (url: string) => {
    if (!url.trim()) {
      return { success: true, request: null };
    }

    setError(null);
    setIsValidating(true);

    try {
      const parseResponse = await apiClient.post("/api/parse-url", { url });

      if (!parseResponse.data.success) {
        const errors = parseResponse.data.data?.errors || ["Failed to parse URL"];
        setError(errors.join(", "));
        setIsValidating(false);
        return { success: false, request: null };
      }

      const parseResult = parseResponse.data.data;
      setIsValidating(false);
      return { success: true, request: parseResult.request };
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error?.message || err?.message || "Failed to validate URL";
      setError(errorMessage);
      setIsValidating(false);
      return { success: false, request: null };
    }
  };

  return { validateUrl, isValidating, error, setError };
};
