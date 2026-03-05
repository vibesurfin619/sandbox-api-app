"use client"

import { useState, useEffect } from "react"
import { QuoteResponse, QuoteSubjectivity, CoverageLineDetail, StoredApplication } from "@/lib/types"
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
  Layers,
  ScrollText,
  Upload,
  HelpCircle,
  Check,
  X,
} from "lucide-react"

const COVERAGE_LABELS: Record<string, string> = {
  do: "Directors & Officers (D&O)",
  epli: "Employment Practices Liability (EPLI)",
  fid: "Fiduciary Liability",
  crm: "Crime",
  mpl: "Miscellaneous Professional Liability",
  gl: "General Liability",
  ah: "Allied Health",
  ae: "Architects & Engineers",
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return String(value)
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatCurrencyPremium(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return String(value)
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface QuoteViewProps {
  application: StoredApplication
}

function CoverageLineCard({ lineKey, detail }: { lineKey: string; detail: CoverageLineDetail }) {
  const [expanded, setExpanded] = useState(false)
  const label = COVERAGE_LABELS[lineKey] || lineKey.toUpperCase()

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-counterpart-primary/10 rounded-lg shrink-0">
            <Shield className="h-5 w-5 text-counterpart-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{label}</p>
            <div className="flex gap-4 text-xs text-muted-foreground mt-0.5">
              <span>Limit: {formatCurrency(detail.limit)}</span>
              <span>Retention: {formatCurrency(detail.retention)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-lg font-bold text-green-700">{formatCurrencyPremium(detail.premium)}</p>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t">
          {/* Limits of Liability / Sublimits */}
          {detail.limits_of_liability && detail.limits_of_liability.length > 0 && (
            <div className="p-5 border-b">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Limits of Liability</p>
              <div className="space-y-2">
                {detail.limits_of_liability
                  .sort((a, b) => a.order - b.order)
                  .map((lol) => (
                    <div key={lol.key} className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/40 text-sm">
                      <span className="text-muted-foreground">
                        {lol.name}
                        {lol.is_additional_limit && (
                          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">Additional</Badge>
                        )}
                      </span>
                      <span className="font-medium">{formatCurrency(lol.value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Retentions */}
          {detail.retentions && detail.retentions.length > 0 && (
            <div className="p-5 border-b">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Retentions</p>
              <div className="space-y-2">
                {detail.retentions
                  .sort((a, b) => a.order - b.order)
                  .map((ret, idx) => (
                    <div key={ret.key || idx} className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/40 text-sm">
                      <span className="text-muted-foreground">{ret.name}</span>
                      <span className="font-medium">{formatCurrency(ret.value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Coverage-specific Endorsements */}
          {detail.endorsements && detail.endorsements.length > 0 && (
            <div className="p-5 border-b">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Endorsements</p>
              <div className="space-y-1.5">
                {detail.endorsements.map((end) => (
                  <div key={end.id} className="flex items-start gap-2 py-1.5 px-3 rounded bg-muted/40 text-sm">
                    <ScrollText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground">{end.name}</span>
                      <span className="text-xs text-muted-foreground/70 ml-2">({end.id})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Options */}
          {detail.options && Object.keys(detail.options).length > 1 && (
            <div className="p-5 border-t">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Available Options</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(detail.options).map(([optKey, opt]) => (
                  <div
                    key={optKey}
                    className={cn(
                      "p-3 rounded-lg border text-sm",
                      opt.limit === detail.limit && opt.retention === detail.retention
                        ? "border-green-300 bg-green-50"
                        : "border-border bg-muted/30"
                    )}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Option {optKey}</p>
                    <p className="font-medium">{formatCurrency(opt.limit)} / {formatCurrency(opt.retention)}</p>
                    <p className="text-green-700 font-semibold">{formatCurrencyPremium(opt.premium)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function SubjectivityItem({ sub }: { sub: QuoteSubjectivity }) {
  return (
    <div className={cn(
      "p-4 rounded-lg border",
      sub.cleared ? "border-green-200 bg-green-50/50" : "border-yellow-200 bg-yellow-50/50"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-1.5 rounded-full mt-0.5 shrink-0",
          sub.cleared ? "bg-green-100" : "bg-yellow-100"
        )}>
          {sub.type === "upload" ? (
            <Upload className={cn("h-3.5 w-3.5", sub.cleared ? "text-green-600" : "text-yellow-600")} />
          ) : (
            <HelpCircle className={cn("h-3.5 w-3.5", sub.cleared ? "text-green-600" : "text-yellow-600")} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn(
              "text-[10px] px-1.5 py-0",
              sub.type === "upload"
                ? "border-blue-200 text-blue-700 bg-blue-50"
                : "border-purple-200 text-purple-700 bg-purple-50"
            )}>
              {sub.type === "upload" ? "File Upload" : "Question"}
            </Badge>
            {sub.required && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-200 text-red-700 bg-red-50">Required</Badge>
            )}
            <div className="ml-auto flex items-center gap-1">
              {sub.cleared ? (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-300 bg-green-100 text-green-700">
                  <Check className="h-2.5 w-2.5 mr-0.5" />
                  Cleared
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-300 bg-yellow-100 text-yellow-700">
                  <X className="h-2.5 w-2.5 mr-0.5" />
                  Pending
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm">{sub.question}</p>
          {sub.details && (
            <p className="text-xs text-muted-foreground mt-1">{sub.details}</p>
          )}
        </div>
      </div>
    </div>
  )
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
  const canBind = quoteData?.can_bind ?? quote?.can_bind

  // Compute total premium from coverage object if total_premium not provided
  const coverageEntries = quote?.coverage ? Object.entries(quote.coverage) : []
  const computedTotalPremium = quote?.total_premium
    ? Number(quote.total_premium)
    : coverageEntries.reduce((sum, [, detail]) => sum + (detail.premium || 0), 0)

  // Collect subjectivities from both possible locations
  const subjectivities: QuoteSubjectivity[] =
    quote?.subjectivities ?? quoteData?.subjectivities ?? []

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

      {/* Paste Webhook Response */}
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
          <div className={cn(
            "grid gap-4",
            quote.quote_number ? "grid-cols-1 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
          )}>
            {computedTotalPremium > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wider mb-1">Total Premium</p>
                  <p className="text-lg font-bold text-green-800">{formatCurrencyPremium(computedTotalPremium)}</p>
                </CardContent>
              </Card>
            )}
            {quote.quote_number && (
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Quote Number</p>
                  <p className="text-sm font-semibold">{quote.quote_number}</p>
                </CardContent>
              </Card>
            )}
            {quote.quote_expiration_date && (
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Quote Expires</p>
                  <p className="text-sm font-semibold">{quote.quote_expiration_date}</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="pt-6 pb-4 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Bind Eligible</p>
                <Badge variant="outline" className={cn(
                  "text-xs px-2 py-0.5",
                  canBind
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-yellow-300 bg-yellow-50 text-yellow-700"
                )}>
                  {canBind ? "Ready to Bind" : "Subjectivities Required"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Coverage Lines (new detailed format) */}
          {coverageEntries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Coverage Lines</h3>
              </div>
              {coverageEntries.map(([lineKey, detail]) => (
                <CoverageLineCard key={lineKey} lineKey={lineKey} detail={detail} />
              ))}
            </div>
          )}

          {/* Fallback: old coverages array format */}
          {!coverageEntries.length && quote.coverages && quote.coverages.length > 0 && (
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
                        <p className="font-semibold text-sm">{COVERAGE_LABELS[cov.coverage_line] || cov.coverage_line.toUpperCase()}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Limit: {formatCurrency(cov.limit)}</span>
                          <span>Retention: {formatCurrency(cov.retention)}</span>
                          {cov.selected_option !== undefined && (
                            <span>Option: {cov.selected_option}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-700">{formatCurrencyPremium(cov.premium)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subjectivities */}
          {subjectivities.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-lg">Subjectivities</CardTitle>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {subjectivities.filter((s) => s.cleared).length}/{subjectivities.length} Cleared
                  </Badge>
                </div>
                <CardDescription>Requirements that must be fulfilled before binding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subjectivities.map((sub, idx) => (
                    <SubjectivityItem key={sub.key || idx} sub={sub} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Carrier & Quota Share Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Quote Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote.carrier_name && (
                <div className="flex justify-between text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Carrier</span>
                  <span className="font-medium text-right max-w-[60%]">{quote.carrier_name}</span>
                </div>
              )}
              {quote.carrier_type && (
                <div className="flex justify-between text-sm py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Carrier Type</span>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    quote.carrier_type === "SURPLUS"
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  )}>
                    {quote.carrier_type}
                  </Badge>
                </div>
              )}
              {quote.quota_share && quote.quota_share.length > 0 && (
                <div className="py-2 border-b border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">Quota Share</p>
                  <div className="space-y-1.5">
                    {quote.quota_share.map((qs, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-3 py-2 bg-muted/40 rounded">
                        <span>{qs.name}</span>
                        <span className="font-semibold">{qs.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Endorsements */}
              {quote.general_endorsements && quote.general_endorsements.length > 0 && (
                <div className="py-2 border-b border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">General Endorsements</p>
                  <div className="space-y-1.5">
                    {quote.general_endorsements.map((end) => (
                      <div key={end.id} className="flex items-start gap-2 text-sm px-3 py-2 bg-muted/40 rounded">
                        <ScrollText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span>{end.name}</span>
                          <span className="text-xs text-muted-foreground/70 ml-2">({end.id})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
