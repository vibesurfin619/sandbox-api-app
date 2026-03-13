"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Loader2,
  CheckCircle2,
  Shield,
  Building2,
  MapPin,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Star,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { CoverageType } from "@/lib/types"
import { useApiCallContext } from "@/context/ApiCallContext"

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",
  CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",
  IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",
  ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",
  MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",
  NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",
  OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",
  SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",
  VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",
  WY:"Wyoming",DC:"District of Columbia",
}

const COVERAGE_OPTIONS: { id: CoverageType; label: string; description: string }[] = [
  { id: "do", label: "D&O", description: "Directors & Officers Liability" },
  { id: "epli", label: "EPLI", description: "Employment Practices Liability" },
  { id: "fid", label: "Fiduciary", description: "Fiduciary Liability" },
  { id: "crm", label: "Crime", description: "Crime Coverage" },
  { id: "mpl", label: "MPL", description: "Professional Liability" },
]

interface FormData {
  legalName: string
  isNonProfit: boolean
  address: string
  city: string
  state: string
  zipcode: string
  coverages: CoverageType[]
  fullTimeEmployees: string
  partTimeEmployees: string
  totalRevenue: string
  hasClaimsOrLawsuits: boolean
}

interface CompetitorQuote {
  carrier: string
  color: string
  premium: number
  limit: string
  retention: string
  coverages: { name: string; premium: number; limit: string; retention: string }[]
  rating: string
  turnaround: string
  highlights: string[]
  isReal?: boolean
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function generateFakeQuotes(
  realPremium: number,
  coverages: CoverageType[]
): CompetitorQuote[] {
  const coverageLabels: Record<string, string> = {
    do: "D&O",
    epli: "EPLI",
    fid: "Fiduciary",
    crm: "Crime",
    mpl: "Professional Liability",
  }

  const basePremium = realPremium || 8500

  const competitors = [
    {
      carrier: "Chubb",
      color: "#1A1A1A",
      multiplier: 1.15 + Math.random() * 0.2,
      rating: "A++ (Superior)",
      turnaround: "5-7 business days",
      highlights: [
        "Worldwide coverage territory",
        "Broad definition of insured",
        "Crisis management sublimit",
      ],
    },
    {
      carrier: "Hiscox",
      color: "#E4002B",
      multiplier: 0.92 + Math.random() * 0.15,
      rating: "A (Excellent)",
      turnaround: "3-5 business days",
      highlights: [
        "Online portal for policy management",
        "Flexible payment options",
        "Free legal helpline included",
      ],
    },
    {
      carrier: "The Hartford",
      color: "#003B71",
      multiplier: 1.05 + Math.random() * 0.25,
      rating: "A+ (Superior)",
      turnaround: "7-10 business days",
      highlights: [
        "Dedicated claims team",
        "Loss prevention resources",
        "Multi-policy discount available",
      ],
    },
  ]

  return competitors.map((comp) => {
    const totalPremium = Math.round(basePremium * comp.multiplier)
    const coverageBreakdown = coverages.map((cov, i) => {
      const share = i === 0 ? 0.45 : 1 / coverages.length
      return {
        name: coverageLabels[cov] || cov.toUpperCase(),
        premium: Math.round(totalPremium * share),
        limit: "$1,000,000",
        retention: i === 0 ? "$10,000" : "$5,000",
      }
    })

    return {
      carrier: comp.carrier,
      color: comp.color,
      premium: totalPremium,
      limit: "$1,000,000",
      retention: "$10,000",
      coverages: coverageBreakdown,
      rating: comp.rating,
      turnaround: comp.turnaround,
      highlights: comp.highlights,
    }
  })
}

function QuoteCard({
  quote,
  isRecommended,
}: {
  quote: CompetitorQuote
  isRecommended?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`relative rounded-xl border-2 bg-white transition-all duration-300 hover:shadow-lg flex flex-col ${
        isRecommended
          ? "border-counterpart-primary/40 ring-1 ring-counterpart-primary/20"
          : "border-gray-200"
      }`}
    >
      {isRecommended && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ backgroundColor: quote.color }}
        />
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Badges */}
        {(isRecommended || quote.isReal) && (
          <div className="flex items-center gap-2 mb-3">
            {isRecommended && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-counterpart-primary text-white">
                <Star className="h-3 w-3 fill-white" />
                Best Match
              </span>
            )}
            {quote.isReal && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white">
                <CheckCircle2 className="h-3 w-3" />
                Live Quote
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          {quote.carrier === "Counterpart" ? (
            <Shield className="h-5 w-5 text-counterpart-primary" />
          ) : (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: quote.color }}
            >
              {quote.carrier[0]}
            </div>
          )}
          <span
            className="font-bold text-lg"
            style={{ color: quote.color }}
          >
            {quote.carrier}
          </span>
        </div>

        {/* Premium */}
        <div className="mb-4 p-4 rounded-lg bg-gray-50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Annual Premium
          </p>
          <p
            className="text-3xl font-bold tracking-tight"
            style={{ color: quote.color }}
          >
            {formatCurrency(quote.premium)}
          </p>
          <p className="text-xs text-gray-400 mt-1">per year</p>
        </div>

        {/* AM Best Rating & Turnaround */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              AM Best Rating
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {quote.rating}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Turnaround
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {quote.turnaround}
            </p>
          </div>
        </div>

        {/* Aggregate Limits */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Aggregate Limit
            </p>
            <p className="text-sm font-semibold text-gray-800">{quote.limit}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Retention
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {quote.retention}
            </p>
          </div>
        </div>

        {/* Coverage Breakdown */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left py-2 border-t border-gray-100"
        >
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Coverage Breakdown
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {expanded && (
          <div className="space-y-2 mt-2">
            {quote.coverages.map((cov) => (
              <div
                key={cov.name}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {cov.name}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Limit: {cov.limit} / Retention: {cov.retention}
                  </p>
                </div>
                <p className="text-sm font-semibold" style={{ color: quote.color }}>
                  {formatCurrency(cov.premium)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Highlights */}
        <div className="mt-auto pt-4">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
            Highlights
          </p>
          <ul className="space-y-1.5">
            {quote.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t bg-gray-50/50 rounded-b-xl">
        <Button
          className="w-full text-white"
          style={{ backgroundColor: quote.color }}
          disabled={!quote.isReal}
        >
          {quote.isReal ? (
            <>
              Select Quote <ArrowRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            "Request Proposal"
          )}
        </Button>
      </div>
    </div>
  )
}

export default function ShopCoveragePage() {
  const { addApiCall } = useApiCallContext()
  const [step, setStep] = useState<"form" | "loading" | "results">("form")
  const [formData, setFormData] = useState<FormData>({
    legalName: "",
    isNonProfit: false,
    address: "",
    city: "",
    state: "",
    zipcode: "",
    coverages: ["do", "epli"],
    fullTimeEmployees: "",
    partTimeEmployees: "",
    totalRevenue: "",
    hasClaimsOrLawsuits: false,
  })
  const [quotes, setQuotes] = useState<CompetitorQuote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingStage, setLoadingStage] = useState("")

  const isFormValid =
    formData.legalName.trim() !== "" &&
    formData.address.trim() !== "" &&
    formData.city.trim() !== "" &&
    formData.state !== "" &&
    formData.zipcode.trim() !== "" &&
    formData.coverages.length > 0 &&
    formData.fullTimeEmployees.trim() !== "" &&
    formData.partTimeEmployees.trim() !== "" &&
    formData.totalRevenue.trim() !== ""

  function toggleCoverage(cov: CoverageType) {
    setFormData((prev) => ({
      ...prev,
      coverages: prev.coverages.includes(cov)
        ? prev.coverages.filter((c) => c !== cov)
        : [...prev.coverages, cov],
    }))
  }

  async function handleSubmit() {
    setStep("loading")
    setError(null)
    setLoadingStage("Starting application...")

    try {
      setLoadingStage("Submitting to Counterpart API...")

      const res = await fetch("/api/shop-coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      // Register API call traces in the sidebar regardless of success/failure
      if (data.apiCalls) {
        for (const trace of data.apiCalls) {
          addApiCall(trace)
        }
      }

      if (!res.ok) {
        let message = data.error || "Failed to get quote"
        if (data.unmappedQuestions?.length) {
          message += "\n\nUnmapped required questions:\n" +
            data.unmappedQuestions.map((q: string) => `• ${q}`).join("\n")
        }
        throw new Error(message)
      }

      setLoadingStage("Comparing quotes from carriers...")

      await new Promise((r) => setTimeout(r, 1500))

      const realPremium = 7500 + Math.random() * 5000
      const roundedPremium = Math.round(realPremium / 100) * 100

      const counterpartQuote: CompetitorQuote = {
        carrier: "Counterpart",
        color: "#29525E",
        premium: roundedPremium,
        limit: "$1,000,000",
        retention: "$10,000",
        coverages: formData.coverages.map((cov, i) => ({
          name:
            COVERAGE_OPTIONS.find((c) => c.id === cov)?.description ||
            cov.toUpperCase(),
          premium: Math.round(
            roundedPremium * (i === 0 ? 0.45 : (0.55 / (formData.coverages.length - 1 || 1)))
          ),
          limit: "$1,000,000",
          retention: i === 0 ? "$10,000" : "$5,000",
        })),
        rating: "A (Excellent)",
        turnaround: "Instant",
        highlights: [
          "AI-powered underwriting - instant decision",
          "Dedicated claims advocacy team",
          "Risk management resources included",
          `Application submitted (ID: ${data.accountId?.slice(0, 8)}...)`,
        ],
        isReal: true,
      }

      const fakeQuotes = generateFakeQuotes(roundedPremium, formData.coverages)
      setQuotes([counterpartQuote, ...fakeQuotes])
      setStep("results")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setStep("form")
    }
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-full bg-counterpart-primary/10 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-counterpart-primary animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Getting Your Quotes
            </h2>
            <p className="text-muted-foreground text-sm">{loadingStage}</p>
          </div>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-counterpart-primary/40 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (step === "results") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Quote Comparison
                </h1>
                <p className="text-muted-foreground mt-1">
                  {quotes.length} quotes for{" "}
                  <span className="font-semibold text-foreground">
                    {formData.legalName}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("form")
                  setQuotes([])
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                New Quote
              </Button>
            </div>

            {/* Summary bar */}
            <div className="mt-4 p-4 rounded-xl bg-white border border-gray-200 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-gray-500">Company:</span>{" "}
                <span className="font-medium">{formData.legalName}</span>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>{" "}
                <span className="font-medium">
                  {formData.city}, {formData.state} {formData.zipcode}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Employees:</span>{" "}
                <span className="font-medium">
                  {formData.fullTimeEmployees} FT / {formData.partTimeEmployees}{" "}
                  PT
                </span>
              </div>
              <div>
                <span className="text-gray-500">Revenue:</span>{" "}
                <span className="font-medium">
                  {formatCurrency(Number(formData.totalRevenue))}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Coverages:</span>{" "}
                <span className="font-medium">
                  {formData.coverages
                    .map(
                      (c) =>
                        COVERAGE_OPTIONS.find((o) => o.id === c)?.label || c
                    )
                    .join(", ")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {quotes.map((quote, i) => (
              <QuoteCard
                key={quote.carrier}
                quote={quote}
                isRecommended={i === 0}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Shop Coverage</h1>
          <p className="text-muted-foreground mt-1">
            Answer a few questions and get comparable quotes from top carriers
            instantly
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <pre className="text-sm text-red-600 mt-0.5 whitespace-pre-wrap font-sans">{error}</pre>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Section 1: Company Information */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-counterpart-primary" />
              <h2 className="font-semibold text-foreground">
                Company Information
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label htmlFor="legalName" className="text-sm font-medium">
                  Legal Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="legalName"
                  placeholder="e.g. Acme Corporation, Inc."
                  value={formData.legalName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, legalName: e.target.value }))
                  }
                  className="mt-1.5"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <Label htmlFor="nonProfit" className="text-sm font-medium">
                    Is this a non-profit organization?
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Non-profits may qualify for special rates
                  </p>
                </div>
                <Switch
                  id="nonProfit"
                  checked={formData.isNonProfit}
                  onCheckedChange={(checked) =>
                    setFormData((p) => ({ ...p, isNonProfit: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-counterpart-primary" />
              <h2 className="font-semibold text-foreground">Business Address</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label htmlFor="address" className="text-sm font-medium">
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, address: e.target.value }))
                  }
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, city: e.target.value }))
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm font-medium">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(val) =>
                      setFormData((p) => ({ ...p, state: val }))
                    }
                  >
                    <SelectTrigger id="state" className="mt-1.5">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st} - {STATE_NAMES[st]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zipcode" className="text-sm font-medium">
                    ZIP Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="zipcode"
                    placeholder="94105"
                    value={formData.zipcode}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, zipcode: e.target.value }))
                    }
                    className="mt-1.5"
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Coverage Selection */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <Shield className="h-5 w-5 text-counterpart-primary" />
              <h2 className="font-semibold text-foreground">
                Coverage Selection <span className="text-red-500">*</span>
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Select the coverages you need. You can choose multiple.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COVERAGE_OPTIONS.map((cov) => {
                  const isSelected = formData.coverages.includes(cov.id)
                  return (
                    <button
                      key={cov.id}
                      type="button"
                      onClick={() => toggleCoverage(cov.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-counterpart-primary bg-counterpart-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                      />
                      <div>
                        <p className="text-sm font-semibold">{cov.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {cov.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {formData.coverages.length === 0 && (
                <p className="text-xs text-red-500 mt-2">
                  Please select at least one coverage type
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Employees & Revenue */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <Users className="h-5 w-5 text-counterpart-primary" />
              <h2 className="font-semibold text-foreground">
                Employees & Revenue
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="fullTimeEmployees"
                    className="text-sm font-medium"
                  >
                    Full-Time Employees{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullTimeEmployees"
                    type="number"
                    placeholder="e.g. 50"
                    value={formData.fullTimeEmployees}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        fullTimeEmployees: e.target.value,
                      }))
                    }
                    className="mt-1.5"
                    min={0}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="partTimeEmployees"
                    className="text-sm font-medium"
                  >
                    Part-Time Employees{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="partTimeEmployees"
                    type="number"
                    placeholder="e.g. 10"
                    value={formData.partTimeEmployees}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        partTimeEmployees: e.target.value,
                      }))
                    }
                    className="mt-1.5"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="totalRevenue" className="text-sm font-medium">
                  Total Annual Revenue{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="totalRevenue"
                    type="number"
                    placeholder="e.g. 5000000"
                    value={formData.totalRevenue}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        totalRevenue: e.target.value,
                      }))
                    }
                    className="pl-9"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Claims History */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-counterpart-primary" />
              <h2 className="font-semibold text-foreground">Claims History</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <Label
                    htmlFor="claims"
                    className="text-sm font-medium"
                  >
                    Any claims or lawsuits in the last 3 years?
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Including pending, settled, or dismissed claims
                  </p>
                </div>
                <Switch
                  id="claims"
                  checked={formData.hasClaimsOrLawsuits}
                  onCheckedChange={(checked) =>
                    setFormData((p) => ({
                      ...p,
                      hasClaimsOrLawsuits: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="bg-counterpart-primary hover:bg-counterpart-primary/90 text-white px-8 py-3 text-base"
              size="lg"
            >
              Get Quotes
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
