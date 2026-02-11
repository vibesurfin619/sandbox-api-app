import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ApiCallProvider } from "@/context/ApiCallContext"
import { Toaster } from "@/components/ui/toaster"
import { ApiCallSidebar } from "@/components/ApiCallSidebar"
import Image from "next/image"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Counterpart Application Manager",
  description: "Manage insurance applications with Counterpart API",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApiCallProvider>
          <div className="min-h-screen bg-background">
            <header className="bg-white border-b border-secondary/30">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="inline-block">
                    <Image
                      src="/counterpart_logo.svg"
                      alt="Counterpart"
                      width={194}
                      height={22}
                      className="h-auto"
                      priority
                    />
                  </Link>
                  <nav className="flex gap-6">
                    <Link 
                      href="/" 
                      className="text-sm font-medium text-counterpart-primary hover:opacity-70 transition-opacity"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/applications" 
                      className="text-sm font-medium text-counterpart-primary hover:opacity-70 transition-opacity"
                    >
                      Applications
                    </Link>
                  </nav>
                </div>
              </div>
            </header>
            <main>{children}</main>
            <ApiCallSidebar />
            <Toaster />
          </div>
        </ApiCallProvider>
      </body>
    </html>
  )
}
