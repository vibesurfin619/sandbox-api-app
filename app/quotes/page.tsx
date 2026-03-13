"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Star } from "lucide-react"

type Carrier = {
  id: string
  name: string
  tagline: string
  specialties: string[]
  color: string
  textColor: string
  bgColor: string
  borderColor: string
  featured?: boolean
}

const carriers: Carrier[] = [
  {
    id: "counterpart",
    name: "Counterpart",
    tagline: "AI-powered commercial insurance for modern businesses",
    specialties: ["Management Liability", "Professional Liability", "General Liability", "A&E"],
    color: "#29525E",
    textColor: "text-counterpart-primary",
    bgColor: "bg-counterpart-primary",
    borderColor: "border-counterpart-primary",
    featured: true,
  },
  {
    id: "chubb",
    name: "Chubb",
    tagline: "World's largest publicly traded P&C insurer",
    specialties: ["Commercial Property", "Casualty", "Professional Liability", "Cyber"],
    color: "#1A1A1A",
    textColor: "text-gray-900",
    bgColor: "bg-gray-900",
    borderColor: "border-gray-900",
  },
  {
    id: "hiscox",
    name: "Hiscox",
    tagline: "Specialist insurer for businesses and professionals",
    specialties: ["Professional Liability", "General Liability", "Cyber", "D&O"],
    color: "#E4002B",
    textColor: "text-red-700",
    bgColor: "bg-red-700",
    borderColor: "border-red-700",
  },
  {
    id: "hartford",
    name: "The Hartford",
    tagline: "Insurance and financial services since 1810",
    specialties: ["Workers' Comp", "General Liability", "Commercial Auto", "Property"],
    color: "#003B71",
    textColor: "text-blue-900",
    bgColor: "bg-blue-900",
    borderColor: "border-blue-900",
  },
  {
    id: "travelers",
    name: "Travelers",
    tagline: "One of the largest U.S. commercial property casualty writers",
    specialties: ["Property", "General Liability", "Workers' Comp", "Commercial Auto"],
    color: "#C8102E",
    textColor: "text-red-700",
    bgColor: "bg-red-700",
    borderColor: "border-red-700",
  },
  {
    id: "zurich",
    name: "Zurich",
    tagline: "Global leader in commercial and specialty insurance",
    specialties: ["Property", "Casualty", "Professional Liability", "Specialty Lines"],
    color: "#003399",
    textColor: "text-blue-800",
    bgColor: "bg-blue-800",
    borderColor: "border-blue-800",
  },
]

function CarrierLogo({ carrier, size = "default" }: { carrier: Carrier; size?: "default" | "small" }) {
  const sizeClass = size === "small" ? "text-lg" : "text-2xl"

  if (carrier.id === "counterpart") {
    return (
      <Image
        src="/counterpart_logo.svg"
        alt="Counterpart"
        width={160}
        height={18}
        className="h-auto"
      />
    )
  }

  const logoStyles: Record<string, React.ReactNode> = {
    chubb: (
      <span className={`${sizeClass} font-black tracking-wider uppercase`} style={{ color: carrier.color }}>
        CHUBB
      </span>
    ),
    hiscox: (
      <span className={`${sizeClass} font-bold tracking-wide`} style={{ color: carrier.color }}>
        Hiscox
      </span>
    ),
    hartford: (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: carrier.color }}>
          <span className="text-white text-xs font-bold">H</span>
        </div>
        <span className={`${sizeClass} font-bold`} style={{ color: carrier.color }}>
          The Hartford
        </span>
      </div>
    ),
    travelers: (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: carrier.color }}>
          <span className="text-white text-sm font-bold">T</span>
        </div>
        <span className={`${sizeClass} font-bold`} style={{ color: carrier.color }}>
          Travelers
        </span>
      </div>
    ),
    zurich: (
      <span className={`${sizeClass} font-bold tracking-wide`} style={{ color: carrier.color }}>
        Zurich
      </span>
    ),
  }

  return <div className="flex items-center">{logoStyles[carrier.id]}</div>
}

export default function GetQuotesPage() {
  const [hoveredCarrier, setHoveredCarrier] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Get Quotes</h1>
          <p className="text-muted-foreground mt-1">
            Select a carrier to start a new quote request
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {carriers.map((carrier) => (
            <Link
              key={carrier.id}
              href={carrier.id === "counterpart" ? "/applications/new" : "#"}
              className="group relative"
              onMouseEnter={() => setHoveredCarrier(carrier.id)}
              onMouseLeave={() => setHoveredCarrier(null)}
            >
              <div
                className={`relative overflow-hidden rounded-xl border-2 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col ${
                  carrier.featured
                    ? "border-counterpart-primary/40 ring-1 ring-counterpart-primary/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {carrier.featured && (
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: carrier.color }} />
                )}

                {carrier.featured && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-counterpart-primary/10 text-counterpart-primary">
                      <Star className="h-3 w-3 fill-counterpart-primary" />
                      Preferred
                    </span>
                  </div>
                )}

                <div className="p-6 pb-4 flex-1 flex flex-col">
                  <div className="h-12 flex items-center mb-4">
                    <CarrierLogo carrier={carrier} />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {carrier.tagline}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {carrier.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className={`px-6 py-4 border-t transition-colors duration-300 ${
                    hoveredCarrier === carrier.id
                      ? "bg-gray-50"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-semibold transition-colors duration-300"
                      style={{ color: carrier.color }}
                    >
                      Request Quote
                    </span>
                    <div
                      className="p-1.5 rounded-lg transition-all duration-300 group-hover:translate-x-1"
                      style={{
                        backgroundColor: hoveredCarrier === carrier.id ? carrier.color + "15" : "transparent",
                      }}
                    >
                      <ArrowRight className="h-4 w-4" style={{ color: carrier.color }} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
