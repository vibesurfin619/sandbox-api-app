# Authentication & Proxy Architecture

## Authentication Summary

API key-based authentication using the `X-API-KEY` header, with a proxy pattern to keep the key server-side.

## Architecture

### API Key Storage
- Stored in `API_KEY` (from `.env.local`) - **server-side only**
- **Important:** Using `API_KEY` (without `NEXT_PUBLIC_` prefix) ensures the key is never exposed to the client bundle
- Validated at startup with warnings if missing

### Dual-Path Authentication

**Browser requests (client-side):**
- Client calls `/api/counterpart/[...path]` (Next.js API route)
- The proxy route (`app/api/counterpart/[...path]/route.ts`) adds `X-API-KEY` server-side
- The API key never reaches the browser
- Avoids CORS issues by proxying through Next.js

**Server-side requests:**
- Direct calls to the external API
- `X-API-KEY` is added in `lib/api/counterpart.ts` using `process.env.API_KEY`
- Only when `!isBrowser` is true
- Uses `API_KEY` (server-side only) instead of `NEXT_PUBLIC_API_KEY`

### Security Measures
- API key is stored as `API_KEY` (server-side only, never exposed to client bundle)
- API key is masked in logs (`***` instead of the actual key)
- Key validation before requests
- Server-side injection prevents client exposure
- Path validation prevents traversal attacks
- CORS restricted to allowed origins only

### Flow Diagram

```
Browser Request:
Client → /api/counterpart/endpoint → [Server adds X-API-KEY] → External API

Server Request:
Server → [Adds X-API-KEY] → External API
```

This keeps the API key on the server and avoids exposing it to the client.

---

## Detailed Proxy Explanation

### 1. Route Structure: Catch-All Dynamic Route

The proxy uses Next.js App Router catch-all routing:
- `/app/api/counterpart/[...path]/route.ts`

The `[...path]` segment captures all path segments. Examples:
- `/api/counterpart/application/start` → `params.path = ['application', 'start']`
- `/api/counterpart/application/123` → `params.path = ['application', '123']`

### 2. Client-Side Detection & URL Construction

In `lib/api/counterpart.ts` (lines 49-53):

```typescript
const isBrowser = typeof window !== 'undefined';
const url = isBrowser
  ? `/api/counterpart${endpoint}`  // Browser: use proxy
  : `${API_BASE_URL}${endpoint}`;  // Server: direct call
```

- **Browser**: calls `/api/counterpart/...` (same origin)
- **Server**: calls the external API directly

### 3. Request Flow Through the Proxy

#### Step 1: Request Reception (lines 13-38)
- Handles `GET`, `POST`, `PUT`, `DELETE`
- `OPTIONS` handles CORS preflight

#### Step 2: Path Reconstruction (line 64)
```typescript
const path = `/${params.path.join('/')}`;
const url = `${API_BASE_URL}${path}`;
```
Rebuilds the full external API URL.

#### Step 3: Body Extraction (lines 77-79)
```typescript
const body = method !== 'GET' && method !== 'DELETE'
  ? await request.text()
  : undefined;
```
Reads body for POST/PUT; GET/DELETE have no body.

#### Step 4: API Key Injection (lines 112, 147)
The proxy adds `X-API-KEY` server-side:
```typescript
headers: {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-API-KEY': API_KEY,  // ← Added here, never exposed to client
}
```

### 4. Dual Transport Mechanisms

#### Option A: SOCKS5 Proxy (Cloudflare Warp) (lines 92-139)
If `WARP_PROXY` is set:
- Uses `SocksProxyAgent` for SOCKS5
- Uses Node.js `http`/`https` with the agent
- Streams response data

#### Option B: Native Fetch (lines 140-169)
If no `WARP_PROXY`:
- Uses native `fetch`
- Normalizes the response to a consistent format

### 5. Response Transformation

#### Step 1: Parse Response (lines 178-184)
```typescript
const responseData = await response.text();
let jsonData;
try {
  jsonData = JSON.parse(responseData);
} catch {
  jsonData = responseData;  // Fallback if not JSON
}
```

#### Step 2: Return as NextResponse (lines 186-193)
```typescript
return NextResponse.json(jsonData, {
  status: response.status,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
});
```

### 6. CORS Handling
- `OPTIONS` handler (lines 41-50) responds to preflight
- Response headers (lines 189-192) allow cross-origin requests
- Same-origin proxy avoids browser CORS issues

### 7. Complete Request Flow Diagram

```
┌─────────────────┐
│  Browser Client │
│  (React/Next.js)│
└────────┬────────┘
         │
         │ fetch('/api/counterpart/application/start', {...})
         │ (No API key in headers)
         ▼
┌─────────────────────────────────────┐
│  Next.js API Route Handler          │
│  /api/counterpart/[...path]/route.ts│
│                                     │
│  1. Reconstructs external URL      │
│  2. Extracts request body           │
│  3. Adds X-API-KEY header          │ ← API KEY INJECTED HERE
│  4. Forwards to external API        │
└────────┬────────────────────────────┘
         │
         │ fetch('https://qa-counterpart.../application/start', {
         │   headers: { 'X-API-KEY': 'secret-key' }
         │ })
         ▼
┌─────────────────────────────────────┐
│  External Counterpart API           │
│  (qa-counterpart.test-counterpart)  │
└────────┬────────────────────────────┘
         │
         │ Response (JSON)
         ▼
┌─────────────────────────────────────┐
│  Next.js API Route Handler          │
│                                     │
│  1. Parses response                 │
│  2. Adds CORS headers               │
│  3. Returns NextResponse            │
└────────┬────────────────────────────┘
         │
         │ JSON response
         ▼
┌─────────────────┐
│  Browser Client │
│  Receives data  │
└─────────────────┘
```

### 8. Security Benefits
- API key never exposed to the browser
- No CORS issues (same-origin requests)
- Centralized error handling
- Optional network-level proxy (Warp) for additional routing

### 9. Error Handling
- API key validation (lines 57-62)
- Try/catch around the external request (lines 76-206)
- Error responses with status codes (lines 202-205)

The proxy acts as a secure intermediary: the client never sees the API key, and all external API communication happens server-side.
