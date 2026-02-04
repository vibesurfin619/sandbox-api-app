import {
  StartApplicationRequest,
  StartApplicationResponse,
  GetApplicationQuestionsResponse,
  SubmitApplicationRequest,
  SubmitApplicationResponse,
  ApiError,
} from "../types";
import { ApiCall } from "@/context/ApiCallContext";

// Server-side only - API base URL is never exposed to client
// Client-side calls go through the proxy route at /api/counterpart
const API_BASE_URL =
  process.env.API_BASE_URL ||
  "https://sandbox-api.yourcounterpart.com/partners/v1";

// Helper to mask API key in logs
function maskApiKey(headers: Record<string, string>): Record<string, string> {
  const masked = { ...headers };
  if (masked["X-API-KEY"]) {
    masked["X-API-KEY"] = "***";
  }
  return masked;
}

// Helper to make API calls and track them
async function makeApiCall<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    addApiCall?: (call: Omit<ApiCall, "id" | "timestamp">) => void;
  } = {}
): Promise<T> {
  const { method = "GET", body, addApiCall } = options;
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? `/api/counterpart${endpoint}`
    : `${API_BASE_URL}${endpoint}`;

  const startTime = Date.now();
  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Add API key for server-side calls only
  // Note: API_KEY (without NEXT_PUBLIC_) is server-side only and never exposed to client
  const apiKey = process.env.API_KEY?.trim();
  if (!isBrowser && apiKey) {
    requestHeaders["X-API-KEY"] = apiKey;
  }

  let responseStatus: number | null = null;
  let responseBody: any = null;
  let error: any = null;
  let responseHeaders: Record<string, string> = {};

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    responseStatus = response.status;

    // Get response headers
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const responseText = await response.text();
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    if (!response.ok) {
      error = responseBody;
      throw new Error(
        responseBody?.error || responseBody?.message || `HTTP ${responseStatus}`
      );
    }

    return responseBody as T;
  } catch (err) {
    error = err;
    throw err;
  } finally {
    const duration = Date.now() - startTime;

    // Track API call if callback provided
    if (addApiCall) {
      addApiCall({
        method,
        url: isBrowser ? url : `${API_BASE_URL}${endpoint}`,
        endpoint,
        requestHeaders: maskApiKey(requestHeaders),
        requestBody: body,
        responseStatus,
        responseHeaders,
        responseBody,
        error,
        duration,
      });
    }
  }
}

export async function startApplication(
  data: StartApplicationRequest,
  addApiCall?: (call: Omit<ApiCall, "id" | "timestamp">) => void
): Promise<StartApplicationResponse> {
  return makeApiCall<StartApplicationResponse>(
    "/application/start",
    {
      method: "POST",
      body: data,
      addApiCall,
    }
  );
}

export async function getApplicationQuestions(
  accountId: string,
  addApiCall?: (call: Omit<ApiCall, "id" | "timestamp">) => void
): Promise<GetApplicationQuestionsResponse> {
  return makeApiCall<GetApplicationQuestionsResponse>(
    `/application/${accountId}`,
    {
      method: "GET",
      addApiCall,
    }
  );
}

export async function submitApplication(
  accountId: string,
  data: SubmitApplicationRequest,
  addApiCall?: (call: Omit<ApiCall, "id" | "timestamp">) => void
): Promise<SubmitApplicationResponse> {
  return makeApiCall<SubmitApplicationResponse>(
    `/application/${accountId}/submit`,
    {
      method: "POST",
      body: data,
      addApiCall,
    }
  );
}
