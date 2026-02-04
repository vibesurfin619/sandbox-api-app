"use client"

import { useState, useEffect } from "react"
import { getAllApplications, deleteApplication } from "@/lib/storage"
import { StoredApplication } from "@/lib/types"
import { ApplicationList } from "@/components/ApplicationList"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiCallSidebar } from "@/components/ApiCallSidebar"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function HomePage() {
  const [applications, setApplications] = useState<StoredApplication[]>([])

  useEffect(() => {
    // Load applications from localStorage
    const loadApplications = () => {
      const apps = getAllApplications()
      setApplications(apps)
    }

    loadApplications()

    // Listen for storage changes (in case of multiple tabs)
    const handleStorageChange = () => {
      loadApplications()
    }

    window.addEventListener("storage", handleStorageChange)

    // Poll for changes (since storage event doesn't fire in same tab)
    const interval = setInterval(loadApplications, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const handleDelete = (accountId: string) => {
    if (deleteApplication(accountId)) {
      setApplications((prev) => prev.filter((app) => app.account_id !== accountId))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Applications</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your insurance applications and track their status
            </p>
          </div>
          <Button asChild>
            <Link href="/applications/new">
              <Plus className="mr-2 h-4 w-4" />
              Start New Application
            </Link>
          </Button>
        </div>

        <ApplicationList applications={applications} onDelete={handleDelete} />
      </div>

      <ApiCallSidebar />
    </div>
  )
}
