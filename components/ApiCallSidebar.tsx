"use client"

import { useState } from "react"
import { useApiCallContext } from "@/context/ApiCallContext"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ApiCall } from "@/context/ApiCallContext"
import { format } from "date-fns"
import { Bug } from "lucide-react"

function ApiCallCard({ call }: { call: ApiCall }) {
  const [expanded, setExpanded] = useState(false)

  const getStatusColor = (status: number | null) => {
    if (!status) return "destructive"
    if (status >= 200 && status < 300) return "default"
    if (status >= 400 && status < 500) return "destructive"
    return "destructive"
  }

  return (
    <Card className="mb-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{call.method}</Badge>
            <span className="text-sm font-medium truncate max-w-[200px]">
              {call.endpoint}
            </span>
          </div>
          {call.responseStatus && (
            <Badge variant={getStatusColor(call.responseStatus) as any}>
              {call.responseStatus}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span>{format(call.timestamp, "HH:mm:ss")}</span>
          <span>{call.duration}ms</span>
          {call.error && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? "Collapse" : "Expand"} Details
        </Button>
        {expanded && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Request Headers</h4>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(call.requestHeaders, null, 2)}
              </pre>
            </div>
            {call.requestBody && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Request Body</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                  {JSON.stringify(call.requestBody, null, 2)}
                </pre>
              </div>
            )}
            {call.responseBody && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Response Body</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                  {JSON.stringify(call.responseBody, null, 2)}
                </pre>
              </div>
            )}
            {call.error && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-destructive">
                  Error
                </h4>
                <pre className="text-xs bg-destructive/10 p-2 rounded overflow-auto max-h-32 text-destructive">
                  {JSON.stringify(call.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ApiCallSidebar() {
  const { apiCalls, clearApiCalls } = useApiCallContext()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="fixed bottom-4 right-4 z-50">
          <Bug className="mr-2 h-4 w-4" />
          API Calls ({apiCalls.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>API Call Debugger</SheetTitle>
          <SheetDescription>
            View all API requests and responses for debugging
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          {apiCalls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearApiCalls}
              className="mb-4"
            >
              Clear All
            </Button>
          )}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {apiCalls.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No API calls yet. Make a request to see it here.
              </div>
            ) : (
              apiCalls.map((call) => (
                <ApiCallCard key={call.id} call={call} />
              ))
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
