"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getApplication } from "@/lib/storage"
import { getApplicationQuestions, startApplication } from "@/lib/api/counterpart"
import { useApiCallContext } from "@/context/ApiCallContext"
import { StoredApplication, Question, StartApplicationRequest } from "@/lib/types"
import { StartApplicationForm } from "@/components/StartApplicationForm"
import { ApplicationForm } from "@/components/ApplicationForm"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { saveApplication } from "@/lib/storage"
import { useToast } from "@/components/ui/use-toast"

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addApiCall } = useApiCallContext()
  const { toast } = useToast()
  const accountId = params.id as string
  const isNew = accountId === "new"

  const [application, setApplication] = useState<StoredApplication | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) {
      setIsLoading(false)
      return
    }

    const loadApplication = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Try to load from localStorage first
        const storedApp = getApplication(accountId)

        if (storedApp) {
          setApplication(storedApp)
          setQuestions(storedApp.questions || [])

          // Fetch latest questions from API to ensure we have the most up-to-date list
          try {
            const apiResponse = await getApplicationQuestions(accountId, addApiCall)
            setQuestions(apiResponse.questions)

            // Update stored application with latest questions
            saveApplication({
              ...storedApp,
              questions: apiResponse.questions,
            })
          } catch (apiError) {
            console.error("Failed to fetch latest questions:", apiError)
            // Continue with stored questions if API call fails
          }
        } else {
          // Not in storage, try to fetch from API
          try {
            const apiResponse = await getApplicationQuestions(accountId, addApiCall)
            setQuestions(apiResponse.questions)

            // Create a basic application record
            const newApp: StoredApplication = {
              account_id: accountId,
              status: "in_progress",
              company_name: "Unknown Company",
              coverages: [],
              answers: [],
              questions: apiResponse.questions,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            setApplication(newApp)
            saveApplication(newApp)
          } catch (apiError) {
            setError("Application not found")
            toast({
              title: "Error",
              description: "Could not load application. It may not exist or you may not have access.",
              variant: "destructive",
            })
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load application")
      } finally {
        setIsLoading(false)
      }
    }

    loadApplication()
  }, [accountId, isNew, addApiCall, toast])

  const handleStartSuccess = async (newAccountId: string) => {
    router.push(`/applications/${newAccountId}`)
  }

  const handleSubmitSuccess = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (error && !isNew) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Applications
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Link>
          </Button>
        </div>

        {isNew ? (
          <StartApplicationForm onSuccess={handleStartSuccess} />
        ) : application ? (
          <div className="space-y-6">
            {application.status === "draft" || application.status === "in_progress" ? (
              questions?.length > 0 ? (
                <ApplicationForm
                  accountId={accountId}
                  questions={questions}
                  initialAnswers={application.answers}
                  applicationData={application}
                  onSuccess={handleSubmitSuccess}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Loading questions...
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    This application has been {application.status}. View-only mode.
                  </p>
                  <ApplicationForm
                    accountId={accountId}
                    questions={questions || []}
                    initialAnswers={application.answers}
                    applicationData={application}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
