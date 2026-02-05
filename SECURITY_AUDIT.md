# Security Audit Report

**Date:** 2024 (Updated: December 2024)  
**Application:** Counterpart Application Manager  
**Framework:** Next.js 14 (App Router)

## Executive Summary

This security audit identified **10 security vulnerabilities** ranging from **CRITICAL** to **MEDIUM** severity. **3 critical vulnerabilities have been resolved** since the initial audit:
- ✅ API key exposure fixed (removed `NEXT_PUBLIC_` prefix)
- ✅ CORS policy restricted to allowed origins
- ✅ Path traversal protection implemented

**Remaining vulnerabilities:** 7 issues still need attention, primarily around rate limiting, input validation, and authentication.

## Security Status Summary

| Status | Count | Details |
|--------|-------|---------|
| ✅ **Resolved** | 3 | API key exposure, CORS policy, Path traversal |
| ⚠️ **Partially Resolved** | 1 | Error information disclosure |
| 🔴 **Critical** | 0 | All critical issues resolved |
| 🟠 **High** | 2 | Rate limiting, Input validation (body size) |
| 🟡 **Medium** | 5 | File upload limits, Authentication, CSRF, Storage, Error sanitization |

---

## Critical Vulnerabilities

### 1. ✅ RESOLVED: API Key Exposure via NEXT_PUBLIC_ Prefix

**Status:** **FIXED** ✅  
**Location:** 
- `app/api/counterpart/[...path]/route.ts:6`
- `lib/api/counterpart.ts:49`

**Original Issue:**
The API key was stored in `NEXT_PUBLIC_API_KEY`, which would expose it to the client-side bundle.

**Resolution:**
- ✅ API key now uses `API_KEY` (without `NEXT_PUBLIC_` prefix) - server-side only
- ✅ Key is only accessed in server-side code (API routes)
- ✅ `lib/api/counterpart.ts` checks `isBrowser` before accessing the key
- ✅ Key validation added to ensure it exists before making requests
- ✅ API key is masked in logs (shows `***` instead of actual value)

**Current Implementation:**
```typescript
// ✅ CORRECT - Server-side only
const API_KEY = process.env.API_KEY?.trim();

// In lib/api/counterpart.ts:
const apiKey = process.env.API_KEY?.trim();
if (!isBrowser && apiKey) {
  requestHeaders["X-API-KEY"] = apiKey;
}
```

**Verification:**
- API key is never exposed to client bundle
- Server-side proxy adds the key automatically
- Key validation prevents requests without proper configuration

---

### 2. ✅ RESOLVED: Open CORS Policy (Wildcard Origin)

**Status:** **FIXED** ✅  
**Location:** `app/api/counterpart/[...path]/route.ts:8-88`

**Original Issue:**
The API proxy allowed requests from any origin (`Access-Control-Allow-Origin: *`), enabling any website to make requests through the proxy.

**Resolution:**
- ✅ CORS restricted to specific allowed origins via `getAllowedOrigins()` function
- ✅ Environment variable `ALLOWED_ORIGINS` supported for configuration
- ✅ `isOriginAllowed()` function validates Origin header against whitelist
- ✅ Defaults to localhost:300* ports for development
- ✅ CORS headers only set for allowed origins (empty string for disallowed)

**Current Implementation:**
```typescript
// ✅ CORRECT - Restricted CORS
const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS;
  if (origins) {
    return origins.split(',').map(o => o.trim());
  }
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
};

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  // Allow any localhost:300* port for development
  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):300\d$/;
  return localhostPattern.test(origin);
}

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
```

**Verification:**
- Only whitelisted origins can make CORS requests
- Environment variable allows production configuration
- Development-friendly defaults for localhost

---

## High Severity Vulnerabilities

### 3. ✅ RESOLVED: Path Traversal / Injection Vulnerability

**Status:** **FIXED** ✅  
**Location:** `app/api/counterpart/[...path]/route.ts:18-56, 154-159`

**Original Issue:**
The proxy route reconstructed paths from user input without validation, allowing path traversal attacks.

**Resolution:**
- ✅ `validatePath()` function implemented with comprehensive validation
- ✅ Rejects dangerous patterns: `..`, `//`, `\`, URL-encoded variants (`%2e%2e`, `%2f%2f`, `%5c`)
- ✅ Validates URL decoding to prevent double-encoding attacks
- ✅ Only allows alphanumeric, hyphens, underscores, and forward slashes
- ✅ Rejects empty segments and empty paths
- ✅ Case-insensitive pattern matching
- ✅ Returns 400 error for invalid paths

**Current Implementation:**
```typescript
// ✅ CORRECT - Path validation
function validatePath(pathSegments: string[]): boolean {
  if (pathSegments.length === 0) {
    return false;
  }
  
  const dangerous = ['..', '//', '\\', '%2e%2e', '%2f%2f', '%5c'];
  
  for (const segment of pathSegments) {
    if (!segment || segment.trim() === '') {
      return false;
    }
    
    const lowerSegment = segment.toLowerCase();
    if (dangerous.some(d => lowerSegment.includes(d.toLowerCase()))) {
      return false;
    }
    
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return false;
    }
    
    if (!/^[a-zA-Z0-9_\-/]+$/.test(decoded)) {
      return false;
    }
  }
  return true;
}

// In handleRequest:
if (!validatePath(params.path)) {
  return NextResponse.json(
    { error: "Invalid path" },
    { status: 400, headers: getCorsHeaders(request) }
  );
}
```

**Verification:**
- Path traversal attacks are blocked
- URL-encoded attacks are prevented
- Only valid API paths are allowed

---

### 4. 🟠 HIGH: No Rate Limiting

**Location:** `app/api/counterpart/[...path]/route.ts`

**Issue:**
The API proxy has no rate limiting, allowing unlimited requests.

**Risk:**
- API abuse and exhaustion
- DDoS attacks
- Cost implications if API usage is metered
- Potential for brute force attacks

**Recommendation:**
1. Implement rate limiting using middleware
2. Use libraries like `@upstash/ratelimit` or `rate-limiter-flexible`
3. Set different limits for different endpoints
4. Return appropriate HTTP status codes (429 Too Many Requests)

**Example:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
});

// In handleRequest:
const identifier = request.ip || "anonymous";
const { success } = await ratelimit.limit(identifier);
if (!success) {
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    { status: 429 }
  );
}
```

---

### 5. 🟠 HIGH: No Input Validation on Proxy Route

**Location:** `app/api/counterpart/[...path]/route.ts:68-70, 75`

**Issue:**
Query parameters and request bodies are passed through without validation.

**Risk:**
- Injection attacks through query parameters
- Large payload attacks
- Malformed requests causing errors

**Recommendation:**
1. Validate query parameters
2. Limit request body size
3. Validate Content-Type headers
4. Sanitize query strings

**Fix:**
```typescript
// Limit body size
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

if (method !== "GET" && method !== "DELETE") {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }
  body = await request.text();
  if (body.length > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }
}
```

---

## Medium Severity Vulnerabilities

### 6. 🟡 MEDIUM: File Upload Size Limits Missing

**Location:** `components/QuestionField.tsx:136-155`

**Issue:**
File uploads are converted to base64 without size validation, potentially causing:
- Memory exhaustion
- Slow performance
- Large localStorage usage

**Risk:**
- DoS through large file uploads
- Browser crashes
- Storage quota exceeded errors

**Recommendation:**
1. Add file size validation (e.g., max 5MB)
2. Validate file types
3. Consider server-side upload instead of base64

**Fix:**
```typescript
case "file":
  return (
    <Input
      type="file"
      onChange={async (e) => {
        const file = e.target.files?.[0]
        if (file) {
          // Validate file size (5MB limit)
          const MAX_SIZE = 5 * 1024 * 1024; // 5MB
          if (file.size > MAX_SIZE) {
            toast({
              title: "File too large",
              description: "Maximum file size is 5MB",
              variant: "destructive",
            });
            return;
          }
          
          // Validate file type if needed
          // const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
          // if (!allowedTypes.includes(file.type)) { ... }
          
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = reader.result as string
            const base64Data = base64.split(",")[1] || base64
            onChange(base64Data)
          }
          reader.readAsDataURL(file)
        }
      }}
    />
  )
```

---

### 7. ✅ PARTIALLY RESOLVED: Error Information Disclosure

**Status:** **PARTIALLY FIXED** ⚠️  
**Location:** `app/api/counterpart/[...path]/route.ts:239-249`

**Original Issue:**
Error messages may leak sensitive information about the system.

**Current Status:**
- ✅ Error messages are conditionally exposed based on `NODE_ENV`
- ✅ Production mode hides detailed error messages
- ✅ Development mode shows error details for debugging
- ✅ Server-side logging still captures full error details
- ⚠️ Error messages could be more generic in production

**Current Implementation:**
```typescript
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
```

**Recommendation:**
- Consider using error codes instead of messages for better security
- Ensure stack traces are never exposed to clients
- Add structured error logging for production debugging

---

### 8. 🟡 MEDIUM: No Authentication/Authorization

**Location:** `app/api/counterpart/[...path]/route.ts`

**Issue:**
The API proxy has no authentication or authorization checks. Anyone can use it.

**Risk:**
- Unauthorized API access
- Abuse of API resources
- Potential for malicious use

**Recommendation:**
1. Implement authentication (e.g., JWT tokens, session-based auth)
2. Add authorization checks for different endpoints
3. Consider API key per user/client
4. Implement request signing

**Example:**
```typescript
// Add authentication middleware
async function authenticateRequest(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  // Validate JWT or session token
  // Return true if valid, false otherwise
  return true;
}

// In handleRequest:
if (!await authenticateRequest(request)) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
```

---

### 9. 🟡 MEDIUM: No CSRF Protection

**Location:** All POST/PUT/DELETE endpoints

**Issue:**
No CSRF tokens or SameSite cookie protection for state-changing operations.

**Risk:**
- Cross-site request forgery attacks
- Unauthorized actions performed on behalf of users

**Recommendation:**
1. Implement CSRF tokens
2. Use SameSite cookies
3. Validate Origin/Referer headers
4. Use double-submit cookie pattern

---

### 10. 🟡 MEDIUM: Insecure Client-Side Storage

**Location:** `lib/storage.ts`

**Issue:**
Sensitive application data is stored in localStorage, which is:
- Accessible via XSS attacks
- Not encrypted
- Persists across sessions

**Risk:**
- Data theft via XSS
- Sensitive information exposure
- No server-side backup

**Recommendation:**
1. Encrypt sensitive data before storing
2. Consider server-side storage for sensitive information
3. Implement proper XSS protections
4. Use secure storage mechanisms

**Note:** This is acceptable for a sandbox/demo app, but should be addressed for production.

---

## Additional Security Recommendations

### 11. Security Headers

Add security headers to responses:
```typescript
headers: {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}
```

### 12. Input Sanitization

Ensure all user inputs are sanitized before:
- Storing in localStorage
- Displaying in UI
- Sending to API

### 13. Dependency Security

Regularly audit dependencies:
```bash
npm audit
npm audit fix
```

### 14. Environment Variables

- Never commit `.env.local` to version control
- Use different API keys for development/production
- Rotate API keys regularly

### 15. Logging

- Don't log sensitive data (API keys, tokens, passwords)
- Use structured logging
- Implement log rotation

---

## Priority Action Items

### ✅ Completed
1. ✅ **COMPLETED:** Fix API key exposure (removed `NEXT_PUBLIC_` prefix)
2. ✅ **COMPLETED:** Restrict CORS to specific origins
3. ✅ **COMPLETED:** Implement path validation

### 🔴 High Priority (Remaining)
4. **HIGH:** Add rate limiting to prevent API abuse
5. **HIGH:** Add request body size limits to prevent DoS attacks

### 🟡 Medium Priority (Remaining)
6. **MEDIUM:** Add file upload size limits in `QuestionField.tsx`
7. **MEDIUM:** Further sanitize error messages (use error codes)
8. **MEDIUM:** Implement authentication/authorization
9. **MEDIUM:** Add CSRF protection
10. **MEDIUM:** Consider server-side storage for sensitive data (currently acceptable for sandbox)

---

## Testing Recommendations

1. **Penetration Testing:** Conduct security testing
2. **Dependency Scanning:** Use tools like Snyk or Dependabot
3. **Code Review:** Regular security-focused code reviews
4. **Security Headers Testing:** Use securityheaders.com
5. **OWASP Top 10:** Review against OWASP Top 10 vulnerabilities

---

## Conclusion

**Progress Update:** Significant security improvements have been made since the initial audit:
- ✅ **3 critical vulnerabilities resolved** (API key exposure, CORS policy, path traversal)
- ✅ **1 medium vulnerability partially resolved** (error information disclosure)
- ⚠️ **7 vulnerabilities remain** (rate limiting, input validation, authentication, CSRF, file upload limits)

The most critical security issues have been addressed. The application now properly protects API keys, restricts CORS access, and validates paths to prevent traversal attacks. Remaining issues are primarily around rate limiting, authentication, and additional input validation.

**Overall Security Rating:** 🟡 **IMPROVED - Additional Work Needed**

**For Production Deployment:**
- Must implement rate limiting
- Must add request body size limits
- Should implement authentication/authorization
- Should add file upload size validation
- Consider CSRF protection for state-changing operations

---

*This audit was conducted on the codebase as of December 2024. Regular security audits should be performed, especially before production deployments.*
