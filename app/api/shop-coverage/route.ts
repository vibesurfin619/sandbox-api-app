import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  "https://qa-api.yourcounterpart.com/partners/v1";
const API_KEY = process.env.API_KEY?.trim();

interface ApiCallTrace {
  method: string;
  url: string;
  endpoint: string;
  requestHeaders: Record<string, string>;
  requestBody: any;
  responseStatus: number | null;
  responseHeaders: Record<string, string>;
  responseBody: any;
  error: any;
  duration: number;
}

async function callCounterpartAPI(
  endpoint: string,
  method: string,
  body?: object
): Promise<{ data: any; trace: ApiCallTrace }> {
  if (!API_KEY) {
    throw new Error("API key not configured");
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = Date.now();
  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-KEY": "***",
    "User-Agent": "Mozilla/5.0 ...",
  };

  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Connection: "keep-alive",
      Referer: API_BASE_URL,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const duration = Date.now() - startTime;
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  const trace: ApiCallTrace = {
    method,
    url,
    endpoint,
    requestHeaders,
    requestBody: body || null,
    responseStatus: res.status,
    responseHeaders,
    responseBody: data,
    error: res.ok ? null : data,
    duration,
  };

  if (!res.ok) {
    throw Object.assign(
      new Error(
        typeof data === "object"
          ? JSON.stringify(data)
          : `HTTP ${res.status}: ${data}`
      ),
      { trace }
    );
  }

  return { data, trace };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      legalName,
      isNonProfit,
      address,
      city,
      state,
      zipcode,
      coverages,
      fullTimeEmployees,
      partTimeEmployees,
      totalRevenue,
      hasClaimsOrLawsuits,
    } = body;

    // Step 1: Start Application
    const startPayload = {
      app_source: "counterpart" as const,
      application_version: "1000" as const,
      legal_name: legalName,
      dba_name: null,
      website: "https://example.com",
      industry: "541219",
      address_1: address,
      address_2: null,
      address_city: city,
      address_state: state,
      address_zipcode: zipcode,
      broker_first_name: "Marc",
      broker_last_name: "Broker",
      broker_email: "marc+broker@yourcounterpart.com",
      brokerage_office_city: null,
      brokerage_office_state: null,
      coverages: coverages as string[],
    };

    const apiTraces: ApiCallTrace[] = [];

    console.log("[Shop Coverage] Starting application...");
    const { data: startResult, trace: startTrace } = await callCounterpartAPI(
      "/application/start",
      "POST",
      startPayload
    );
    apiTraces.push(startTrace);

    const accountId = startResult.account_id;
    const questions = startResult.questions || [];

    console.log(
      `[Shop Coverage] Application started: ${accountId}, got ${questions.length} questions`
    );

    // Step 2: Map only the answers we actually have from the form
    console.log(
      "[Shop Coverage] Question keys from API:",
      questions.map((q: any) => `${q.key} (${q.type}, required: ${q.required})`).join("\n  ")
    );

    function keyMatches(key: string, patterns: string[]): boolean {
      const lower = key.toLowerCase();
      return patterns.some((p) => lower.includes(p));
    }

    const answers: { key: string; answer: string | number | boolean }[] = [];
    const unmatchedRequired: string[] = [];

    for (const q of questions) {
      const key = q.key as string;

      if (keyMatches(key, ["nonprofit", "non_profit", "not_for_profit", "tax_exempt"])) {
        answers.push({ key, answer: isNonProfit ? "Yes" : "No" });
      } else if (keyMatches(key, ["full_time", "fulltime", "ft_emp"])) {
        answers.push({ key, answer: Number(fullTimeEmployees) });
      } else if (keyMatches(key, ["part_time", "parttime", "pt_emp"])) {
        answers.push({ key, answer: Number(partTimeEmployees) });
      } else if (keyMatches(key, ["total_revenue", "annual_revenue", "gross_revenue", "revenue"])) {
        answers.push({ key, answer: Number(totalRevenue) });
      } else if (keyMatches(key, ["claims_or_lawsuit", "prior_claims", "has_claims", "claims_history", "loss_history", "legal_action", "prior_lawsuit", "pending_litigation"])) {
        answers.push({ key, answer: hasClaimsOrLawsuits ? "Yes" : "No" });
      } else if (keyMatches(key, ["total_employees", "number_of_employees", "num_employees", "employee_count"])) {
        answers.push({ key, answer: Number(fullTimeEmployees || 0) + Number(partTimeEmployees || 0) });
      } else if (q.required) {
        unmatchedRequired.push(`${key} (${q.type}: "${q.title}")`);
      }
    }

    console.log(`[Shop Coverage] Mapped ${answers.length} answers from form data`);

    if (unmatchedRequired.length > 0) {
      console.warn(
        `[Shop Coverage] ${unmatchedRequired.length} required questions could not be mapped:\n  ${unmatchedRequired.join("\n  ")}`
      );
      return NextResponse.json(
        {
          error: `Could not map all required questions. ${unmatchedRequired.length} required questions have no matching form field.`,
          unmappedQuestions: unmatchedRequired,
        },
        { status: 422 }
      );
    }

    // Step 3: Submit the application
    const submitPayload = {
      answers,
      hr_contact_name: "HR Contact",
      hr_contact_email: "hr@company.com",
      hr_contact_title: "HR Manager",
      hr_contact_phone: "(555) 000-0000",
    };

    console.log(
      `[Shop Coverage] Submitting application ${accountId} with ${answers.length} answers...`
    );
    const { data: submitResult, trace: submitTrace } = await callCounterpartAPI(
      `/application/${accountId}/submit`,
      "POST",
      submitPayload
    );
    apiTraces.push(submitTrace);

    console.log(`[Shop Coverage] Submit result:`, submitResult);

    return NextResponse.json({
      success: true,
      accountId,
      submitResult,
      questionsReceived: questions.length,
      answersSubmitted: answers.length,
      apiCalls: apiTraces,
    });
  } catch (error: any) {
    console.error("[Shop Coverage] Error:", error);
    const traces: ApiCallTrace[] = [];
    if (error?.trace) traces.push(error.trace);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
        apiCalls: traces.length > 0 ? traces : undefined,
      },
      { status: 500 }
    );
  }
}
