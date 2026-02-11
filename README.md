# Counterpart Application Manager

A Next.js application for managing insurance applications using the Counterpart API. This app allows users to start applications, answer dynamic questions, submit completed applications, and track all API calls for debugging.

## Features

- **Application Management**: Create, view, edit, and delete insurance applications
- **Dynamic Question Forms**: Automatically renders questions based on API response with support for all question types (text, number, currency, percentage, radio, checkbox, date, file, boolean, select)
- **Auto-save**: Automatically saves application progress to localStorage
- **API Call Debugging**: Sidebar showing all API requests and responses with full payloads
- **Brand Compliant**: Uses Counterpart brand colors and styling guidelines
- **Type Safe**: Full TypeScript coverage with types extracted from OpenAPI spec

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Counterpart API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
API_KEY=your_api_key_here
API_BASE_URL=https://sandbox-api.yourcounterpart.com/partners/v1
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Note:** `API_KEY` and `API_BASE_URL` (without `NEXT_PUBLIC_` prefix) are server-side only and never exposed to the client bundle. Client-side requests go through the proxy route at `/api/counterpart`. `ALLOWED_ORIGINS` is a comma-separated list of allowed origins for CORS (defaults to localhost if not set).

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /api/counterpart/[...path]/route.ts    # API proxy route
  /page.tsx                               # Application listing page
  /applications/[id]/page.tsx            # Application detail/edit page
  /layout.tsx                             # Root layout
/components
  /ui/                                    # shadcn/ui components
  /ApplicationForm.tsx                   # Dynamic question form
  /StartApplicationForm.tsx              # Initial application form
  /ApplicationList.tsx                   # Application listing
  /ApplicationCard.tsx                   # Application card component
  /ApiCallSidebar.tsx                    # API debug sidebar
  /QuestionField.tsx                     # Question field component
/lib
  /api/counterpart.ts                    # API client functions
  /storage.ts                            # localStorage utilities
  /types.ts                              # TypeScript types
  /utils.ts                              # Utility functions
/context
  /ApiCallContext.tsx                    # API call tracking context
```

## Usage

### Starting a New Application

1. Click "Start New Application" on the home page
2. Fill in company and broker information
3. Select coverage types
4. Click "Start Application"

### Answering Questions

1. After starting an application, you'll see a list of questions
2. Answer all required questions (marked with *)
3. Your progress is automatically saved as you type
4. Click "Save Progress" to manually save
5. Click "Submit Application" when all required questions are answered

### Viewing API Calls

Click the "API Calls" button in the bottom right corner to view all API requests and responses for debugging.

## Technology Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (component library)
- **react-hook-form** (form management)
- **zod** (validation)

## Environment Variables

- `API_KEY`: Your Counterpart API key (server-side only, never exposed to client)
- `API_BASE_URL`: Counterpart API base URL (server-side only, defaults to sandbox)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS (optional, defaults to localhost)

## License

Private - Counterpart Internal Use
