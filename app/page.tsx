"use client"

import { useState, useEffect } from "react"
import { getAllApplications } from "@/lib/storage"
import { StoredApplication } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ApiCallSidebar } from "@/components/ApiCallSidebar"
import Link from "next/link"
import { Plus, FileText, DollarSign, CheckCircle, Upload, Mail, UserPlus, Download } from "lucide-react"

export default function HomePage() {
  const [applications, setApplications] = useState<StoredApplication[]>([])

  useEffect(() => {
    // Load applications from SQLite
    const loadApplications = async () => {
      const apps = await getAllApplications()
      setApplications(apps)
    }

    loadApplications()

    // Poll for changes (SQLite doesn't have cross-tab events like localStorage)
    const interval = setInterval(loadApplications, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Calculate metrics
  const totalApps = applications.length
  const boundApps = applications.filter(app => app.status === 'bound')
  const totalPremiumBound = boundApps.reduce((sum, app) => {
    const premium = app.quote?.premium || 0
    return sum + premium
  }, 0)
  const bindRate = totalApps > 0 ? (boundApps.length / totalApps) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Overview of your insurance applications and performance metrics
            </p>
          </div>
          <Button asChild>
            <Link href="/applications/new">
              <Plus className="mr-2 h-4 w-4" />
              Start New Application
            </Link>
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-counterpart-primary/10">
                <FileText className="h-6 w-6 text-counterpart-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Apps Submitted</p>
                <p className="text-2xl font-bold text-counterpart-primary">{totalApps}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-counterpart-green-light/20">
                <CheckCircle className="h-6 w-6 text-counterpart-green-dark" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Policies Bound</p>
                <p className="text-2xl font-bold text-counterpart-green-dark">{boundApps.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-counterpart-green-light/20">
                <DollarSign className="h-6 w-6 text-counterpart-green-dark" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Premium Bound</p>
                <p className="text-2xl font-bold text-counterpart-green-dark">
                  ${totalPremiumBound.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-counterpart-secondary/20">
                <FileText className="h-6 w-6 text-counterpart-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bind Rate</p>
                <p className="text-2xl font-bold text-counterpart-primary">
                  {bindRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-counterpart-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link 
              href="/applications/upload" 
              className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow group"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-lg bg-counterpart-primary/10 group-hover:bg-counterpart-primary/20 transition-colors">
                  <Upload className="h-8 w-8 text-counterpart-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-counterpart-primary mb-1">Upload Application</h3>
                  <p className="text-sm text-muted-foreground">Import existing application data</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/applications/new" 
              className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow group"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-lg bg-counterpart-primary/10 group-hover:bg-counterpart-primary/20 transition-colors">
                  <Plus className="h-8 w-8 text-counterpart-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-counterpart-primary mb-1">Start New Application</h3>
                  <p className="text-sm text-muted-foreground">Create a new insurance application</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/applications" 
              className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow group"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-lg bg-counterpart-primary/10 group-hover:bg-counterpart-primary/20 transition-colors">
                  <FileText className="h-8 w-8 text-counterpart-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-counterpart-primary mb-1">View All Applications</h3>
                  <p className="text-sm text-muted-foreground">Browse and manage applications</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/applications/email" 
              className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow group"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-lg bg-counterpart-primary/10 group-hover:bg-counterpart-primary/20 transition-colors">
                  <Mail className="h-8 w-8 text-counterpart-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-counterpart-primary mb-1">Email Application</h3>
                  <p className="text-sm text-muted-foreground">Send application via email</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/agents/invite" 
              className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow group"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-lg bg-counterpart-primary/10 group-hover:bg-counterpart-primary/20 transition-colors">
                  <UserPlus className="h-8 w-8 text-counterpart-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-counterpart-primary mb-1">Invite Retail Agent</h3>
                  <p className="text-sm text-muted-foreground">Add a new retail agent</p>
                </div>
              </div>
            </Link>

            <Link 
              href="/resources/appetite-guide" 
              className="bg-white border border-counterpart-secondary/30 rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow group"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-lg bg-counterpart-primary/10 group-hover:bg-counterpart-primary/20 transition-colors">
                  <Download className="h-8 w-8 text-counterpart-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-counterpart-primary mb-1">Download Appetite Guide</h3>
                  <p className="text-sm text-muted-foreground">Get the latest appetite guide</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <ApiCallSidebar />
    </div>
  )
}
