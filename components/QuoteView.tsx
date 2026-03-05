"use client"

import { useState, useEffect } from "react"
import { QuoteResponse, StoredApplication } from "@/lib/types"
import { getLocalQuote, saveWebhookResponse } from "@/lib/api/applications"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  DollarSign,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  Shield,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface QuoteViewProps {
  application: StoredApplication
}

export function QuoteView({ application }: QuoteViewProps) {
  const { toast } = useToast()
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteValue, setPasteValue] = useState("")
  const [isPasting, setIsPasting] = useState(false)

  const fetchQuote = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getLocalQuote(application.account_id)
      if (response) {
        setQuoteData(response)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch quote")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuote()
  }, [application.account_id])

  const handleRefresh = async () => {
    await fetchQuote()
    toast({ title: "Quote Refreshed", description: "Quote data has been updated." })
  }

  const handlePasteSubmit = async () => {
    const trimmed = pasteValue.trim()
    if (!trimmed) return

    let parsed: any
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      toast({ title: "Invalid JSON", description: "The pasted text is not valid JSON.", variant: "destructive" })
      return
    }

    if (!parsed.result) {
      toast({ title: "Invalid Payload", description: "Missing 'result' field in the webhook response.", variant: "destructive" })
      return
    }

    setIsPasting(true)
    try {
      await saveWebhookResponse(application.account_id, parsed)
      setQuoteData(parsed as QuoteResponse)
      setPasteValue("")
      setPasteOpen(false)
      toast({ title: "Quote Applied", description: `Quote result: ${parsed.result}` })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save webhook response",
        variant: "destructive",
      })
    } finally {
      setIsPasting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading quote details...</p>
        </CardContent>
      </Card>
    )
  }

  if (error && !quoteData) {
    return (
      <Card className="border-2 border-destructive/30">
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const result = quoteData?.result ?? "PENDING"
  const quote = quoteData?.quote
  const message = quoteData?.message ?? "Your quote is still being processed."
  const isPending = result === "PENDING" || result === "PROCESSING"

  return (
    <div className="space-y-6">
      {/* Quote Status Header */}
      <Card className={cn(
        "border-2",
        result === "QUOTED" && "border-green-200",
        result === "DECLINED" && "border-red-200",
        result === "REVIEW" && "border-yellow-200",
        result === "PENDING" && "border-muted",
        result === "PROCESSING" && "border-blue-200",
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {result === "QUOTED" && (
                <>
                  <div className="p-2.5 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-green-700">Quote Available</CardTitle>
                    <CardDescription className="text-sm mt-0.5">{message}</CardDescription>
                  </div>
                </>
              )}
              {result === "DECLINED" && (
                <>
                  <div className="p-2.5 bg-red-100 rounded-full">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-red-700">Application Declined</CardTitle>
                    <CardDescription className="text-sm mt-0.5">{message}</CardDescription>
                  </div>
                </>
              )}
              {result === "REVIEW" && (
                <>
                  <div className="p-2.5 bg-yellow-100 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-yellow-700">Under Review</CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      {message || "Your application requires additional review by our underwriting team."}
                    </CardDescription>
                  </div>
                </>
              )}
              {isPending && (
                <>
                  <div className="p-2.5 bg-blue-100 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-blue-700">Quote Processing</CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      {message || "Your quote is still being processed."}
                    </CardDescription>
                  </div>
                </>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh quote">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Paste Webhook Response - shown for pending/processing states */}
      {isPending && (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setPasteOpen(!pasteOpen)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Paste Webhook Response</CardTitle>
              </div>
              {pasteOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {!pasteOpen && (
              <CardDescription className="text-xs mt-1">
                Paste the raw JSON from the Counterpart webhook to load your quote.
              </CardDescription>
            )}
          </CardHeader>
          {pasteOpen && (
            <CardContent className="space-y-3">
              <Textarea
                placeholder='{"account_id": "...", "result": "QUOTED", "quote": { ... }}'
                className="font-mono text-xs min-h-[160px]"
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handlePasteSubmit}
                  disabled={!pasteValue.trim() || isPasting}
                  className="flex-1"
                >
                  {isPasting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Apply Webhook Response
                </Button>
                <Button variant="outline" onClick={() => { setPasteValue(""); setPasteOpen(false) }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quote Details */}
      {result === "QUOTED" && quote && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quote.total_premium && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">Total Premium</p>
                  <p className="text-3xl font-bold text-green-800">
                    ${Number(quote.total_premium).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            )}
            {quote.effective_date && (
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Effective Date</p>
                  <p className="text-lg font-semibold">{quote.effective_date}</p>
                </CardContent>
              </Card>
            )}
            {quote.expiration_date && (
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Expiration Date</p>
                  <p className="text-lg font-semibold">{quote.expiration_date}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coverage Breakdown */}
          {quote.coverages && quote.coverages.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Coverage Breakdown</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quote.coverages.map((cov, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm uppercase tracking-wide">{cov.coverage_line}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Limit: ${Number(cov.limit).toLocaleString()}</span>
                          <span>Retention: ${Number(cov.retention).toLocaleString()}</span>
                          {cov.selected_option !== undefined && (
                            <span>Option: {cov.selected_option}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        ${Number(cov.premium).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Quote Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote.quote_number && (
                <div className="flex justify-between text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Quote Number</span>
                  <span className="font-medium">{quote.quote_number}</span>
                </div>
              )}
              {quote.quote_expiration_date && (
                <div className="flex justify-between text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Quote Expiration</span>
                  <span className="font-medium">{quote.quote_expiration_date}</span>
                </div>
              )}
              {quote.carrier_name && (
                <div className="flex justify-between text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Carrier</span>
                  <span className="font-medium">{quote.carrier_name}</span>
                </div>
              )}
              {quote.carrier_type && (
                <div className="flex justify-between text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Carrier Type</span>
                  <span className="font-medium capitalize">{quote.carrier_type}</span>
                </div>
              )}
              {quote.can_bind !== undefined && (
                <div className="flex justify-between text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Bind Eligible</span>
                  <Badge variant="outline" className={cn(
                    quote.can_bind
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-yellow-300 bg-yellow-50 text-yellow-700"
                  )}>
                    {quote.can_bind ? "Yes" : "Subjectivities Required"}
                  </Badge>
                </div>
              )}
              {quote.quota_share && quote.quota_share.length > 0 && (
                <div className="flex justify-between text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Quota Share</span>
                  <div className="text-right">
                    {quote.quota_share.map((qs, i) => (
                      <span key={i} className="font-medium block">{qs.name}: {qs.percent}%</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Subjectivities */}
              {quoteData?.subjectivities && quoteData.subjectivities.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Subjectivities
                    </p>
                    <ul className="space-y-1.5">
                      {quoteData.subjectivities.map((sub: any, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground bg-yellow-50 px-3 py-2 rounded border border-yellow-200">
                          {typeof sub === "string" ? sub : sub.description || sub.name || JSON.stringify(sub)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Documents */}
              {quote.documents && Object.values(quote.documents).some(Boolean) && (
                <>
                  <Separator className="my-2" />
                  <div>
                    <p className="text-sm font-semibold mb-2">Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {quote.documents.quote_bundle && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={quote.documents.quote_bundle} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            Quote Bundle
                            <ExternalLink className="ml-1.5 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {quote.documents.sample_policy_forms && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={quote.documents.sample_policy_forms} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            Sample Policy
                            <ExternalLink className="ml-1.5 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {quote.documents.endorsements && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={quote.documents.endorsements} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            Endorsements
                            <ExternalLink className="ml-1.5 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {quote.documents.application && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={quote.documents.application} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-1.5 h-3.5 w-3.5" />
                            Application
                            <ExternalLink className="ml-1.5 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Counterpart account page link */}
              {quote.counterpart_account_page_url && (
                <>
                  <Separator className="my-2" />
                  <Button variant="outline" className="w-full" asChild>
                    <a href={quote.counterpart_account_page_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Counterpart
                    </a>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
