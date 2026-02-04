import { NextRequest, NextResponse } from "next/server";

// Server-side only - never exposed to client
const API_BASE_URL = process.env.API_BASE_URL || "https://sandbox-api.yourcounterpart.com/partners/v1";
// Server-side only - never exposed to client
const API_KEY = process.env.API_KEY?.trim();

// Allowed origins for CORS
const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (origins) {
    return origins.split(',').map(o => o.trim());
  }
  // Default to localhost for development
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
};

// Validate path to prevent traversal attacks
function validatePath(pathSegments: string[]): boolean {
  // Reject empty path
  if (pathSegments.length === 0) {
    return false;
  }
  
  // Reject dangerous patterns
  const dangerous = ['..', '//', '\\', '%2e%2e', '%2f%2f', '%5c'];
  
  for (const segment of pathSegments) {
    // Reject empty segments
    if (!segment || segment.trim() === '') {
      return false;
    }
    
    // Check for dangerous patterns (case-insensitive)
    const lowerSegment = segment.toLowerCase();
    if (dangerous.some(d => lowerSegment.includes(d.toLowerCase()))) {
      return false;
    }
    
    // Decode and validate URL-encoded characters
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      // Invalid URL encoding
      return false;
    }
    
    // Only allow alphanumeric, hyphens, underscores, and forward slashes
    // This prevents path traversal and injection attacks
    if (!/^[a-zA-Z0-9_\-/]+$/.test(decoded)) {
      return false;
    }
  }
  return true;
}

// Check if origin is allowed (supports localhost:300* pattern)
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  // Check explicit allowed origins from env
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Allow any localhost:300* port (3000, 3001, 3002, etc.)
  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):300\d$/;
  if (localhostPattern.test(origin)) {
    return true;
  }
  
  return false;
}

// Get CORS headers based on origin
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigin = isOriginAllowed(origin) ? origin : null;
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin || "",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, "DELETE");
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  // Validate API key (check both existence and non-empty after trim)
  if (!API_KEY || API_KEY.trim().length === 0) {
    return NextResponse.json(
      { 
        error: "API key not configured",
        hint: "Please set API_KEY in your .env.local file and restart the dev server"
      },
      { status: 500 }
    );
  }

  // Debug logging in development (only log that key exists, not the value)
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Proxy] API Key configured:', API_KEY ? 'Yes' : 'No');
    console.log('[API Proxy] API Key length:', API_KEY?.length || 0);
    console.log('[API Key] First 4 chars:', API_KEY?.substring(0, 4));
    console.log('[API Key] Last 4 chars:', API_KEY?.substring(API_KEY.length - 4));
  }

  // Validate path to prevent traversal attacks
  if (!validatePath(params.path)) {
    return NextResponse.json(
      { error: "Invalid path" },
      { status: 400, headers: getCorsHeaders(request) }
    );
  }

  try {
    // Reconstruct the path (already validated)
    const path = `/${params.path.join("/")}`;
    const url = `${API_BASE_URL}${path}`;

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // Extract body for POST/PUT
    let body: string | undefined;
    if (method !== "GET" && method !== "DELETE") {
      body = await request.text();
    }

    // Make the request to the external API
    // Note: Using X-API-KEY as per OpenAPI spec security scheme
    // The description mentions X-Api-Key but the security scheme uses X-API-KEY
    const requestHeaders: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
    };

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Proxy] Making request to:', fullUrl);
      console.log('[API Proxy] Request headers:', {
        ...requestHeaders,
        "X-API-KEY": requestHeaders["X-API-KEY"] ? `***${requestHeaders["X-API-KEY"].slice(-4)}` : 'MISSING',
      });
    }

    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: body || undefined,
    });

    // Parse response
    const responseData = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(responseData);
    } catch {
      jsonData = responseData;
    }

    // Return response with CORS headers
    return NextResponse.json(jsonData, {
      status: response.status,
      headers: getCorsHeaders(request),
    });
  } catch (error) {
    console.error("API proxy error:", error);
    const isProduction = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      { 
        error: "Failed to proxy request",
        ...(isProduction ? {} : { message: error instanceof Error ? error.message : "Unknown error" })
      },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
