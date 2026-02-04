# Security Audit Report

**Date:** 2024  
**Application:** Counterpart Application Manager  
**Framework:** Next.js 14 (App Router)

## Executive Summary

This security audit identified **10 security vulnerabilities** ranging from **CRITICAL** to **MEDIUM** severity. The most critical issue is the exposure of API keys through the `NEXT_PUBLIC_` environment variable prefix, which makes the API key accessible in the client-side JavaScript bundle.

---

## Critical Vulnerabilities

### 1. 🔴 CRITICAL: API Key Exposure via NEXT_PUBLIC_ Prefix

**Location:** 
- `app/api/counterpart/[...path]/route.ts:4`
- `lib/api/counterpart.ts:46-47`
- `context/AUTHENTICATION.md:10`

**Issue:**
The API key is stored in `NEXT_PUBLIC_API_KEY`, which exposes it to the client-side bundle. Even though the proxy route adds it server-side, the environment variable itself is accessible via `process.env.NEXT_PUBLIC_API_KEY` in client-side code.

**Risk:**
- API key can be extracted from the JavaScript bundle
- Anyone can view the source code and see the API key
- Enables unauthorized API access

**Evidence:**
```typescript
// This is exposed to the client bundle!
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
```

**Recommendation:**
1. **Immediately** rename to `API_KEY` (remove `NEXT_PUBLIC_` prefix)
2. Only access it in server-side code (API routes, server components)
3. Update `lib/api/counterpart.ts` to never access the key on the client
4. Add validation to ensure the key is never sent to the client

**Fix:**
```typescript
// ❌ WRONG
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// ✅ CORRECT
const API_KEY = process.env.API_KEY; // Server-side only
```

---

### 2. 🔴 CRITICAL: Open CORS Policy (Wildcard Origin)

**Location:** `app/api/counterpart/[...path]/route.ts:10, 102`

**Issue:**
The API proxy allows requests from any origin (`Access-Control-Allow-Origin: *`), enabling any website to make requests through your proxy.

**Risk:**
- Cross-site request forgery (CSRF) attacks
- Unauthorized websites can use your API proxy
- Potential for abuse and rate limit exhaustion

**Recommendation:**
1. Restrict CORS to specific allowed origins
2. Use environment variable for allowed origins
3. Validate Origin header against whitelist

**Fix:**
```typescript
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

const origin = request.headers.get('origin');
const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : null;

return new NextResponse(null, {
  status: 200,
  headers: {
    "Access-Control-Allow-Origin": allowedOrigin || "",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  },
});
```

---

## High Severity Vulnerabilities

### 3. 🟠 HIGH: Path Traversal / Injection Vulnerability

**Location:** `app/api/counterpart/[...path]/route.ts:64`

**Issue:**
The proxy route reconstructs paths from user input without validation, allowing path traversal attacks.

**Risk:**
- Attackers can access unintended API endpoints
- Potential SSRF (Server-Side Request Forgery) if internal endpoints are accessible
- Bypass intended API restrictions

**Example Attack:**
```
/api/counterpart/../../../admin/users
/api/counterpart/application/123%2F..%2F..%2Fadmin
```

**Recommendation:**
1. Validate path segments against a whitelist
2. Sanitize path components
3. Reject paths with `..`, `//`, or other dangerous patterns
4. Limit to known API endpoints

**Fix:**
```typescript
function validatePath(pathSegments: string[]): boolean {
  // Reject dangerous patterns
  const dangerous = ['..', '//', '\\', '%2e%2e', '%2f%2f'];
  for (const segment of pathSegments) {
    if (dangerous.some(d => segment.includes(d))) {
      return false;
    }
    // Only allow alphanumeric, hyphens, underscores, and slashes
    if (!/^[a-zA-Z0-9_\-/]+$/.test(segment)) {
      return false;
    }
  }
  return true;
}

// In handleRequest:
if (!validatePath(params.path)) {
  return NextResponse.json(
    { error: "Invalid path" },
    { status: 400 }
  );
}
```

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

### 7. 🟡 MEDIUM: Error Information Disclosure

**Location:** `app/api/counterpart/[...path]/route.ts:107-112`

**Issue:**
Error messages may leak sensitive information about the system.

**Risk:**
- Stack traces exposed to clients
- Internal error details revealed
- Potential for information gathering attacks

**Recommendation:**
1. Sanitize error messages in production
2. Log detailed errors server-side only
3. Return generic error messages to clients
4. Use error codes instead of messages

**Fix:**
```typescript
} catch (error) {
  console.error("API proxy error:", error);
  
  // In production, don't expose error details
  const isProduction = process.env.NODE_ENV === 'production';
  
  return NextResponse.json(
    { 
      error: isProduction 
        ? "Failed to proxy request" 
        : "Failed to proxy request",
      ...(isProduction ? {} : { message: error instanceof Error ? error.message : "Unknown error" })
    },
    { status: 500 }
  );
}
```

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

1. **IMMEDIATE:** Fix API key exposure (remove `NEXT_PUBLIC_` prefix)
2. **IMMEDIATE:** Restrict CORS to specific origins
3. **HIGH:** Implement path validation
4. **HIGH:** Add rate limiting
5. **MEDIUM:** Add file upload size limits
6. **MEDIUM:** Sanitize error messages
7. **MEDIUM:** Implement authentication/authorization

---

## Testing Recommendations

1. **Penetration Testing:** Conduct security testing
2. **Dependency Scanning:** Use tools like Snyk or Dependabot
3. **Code Review:** Regular security-focused code reviews
4. **Security Headers Testing:** Use securityheaders.com
5. **OWASP Top 10:** Review against OWASP Top 10 vulnerabilities

---

## Conclusion

The application has several security vulnerabilities that need immediate attention, particularly the API key exposure and open CORS policy. While the application appears to be a sandbox/demo application, these issues should be addressed before any production deployment.

**Overall Security Rating:** ⚠️ **NEEDS IMPROVEMENT**

---

*This audit was conducted on the codebase as of the current date. Regular security audits should be performed, especially before production deployments.*
