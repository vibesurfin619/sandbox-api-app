"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { Question, Answer, AnswerValue, StoredApplication, SubmitApplicationRequest } from "@/lib/types"
import { QuestionField } from "./QuestionField"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitApplication } from "@/lib/api/counterpart"
import { useApiCallContext } from "@/context/ApiCallContext"
import { useToast } from "@/components/ui/use-toast"
import { saveApplication, updateApplicationStatus } from "@/lib/storage"
import { useDebouncedCallback } from "use-debounce"
import { generateAnswersForQuestions, generateHrContactData } from "@/lib/faker-utils"
import { Sparkles } from "lucide-react"
import { evaluateDependantOn } from "@/lib/expression-evaluator"

interface ApplicationFormProps {
  accountId: string
  questions: Question[]
  initialAnswers?: Answer[]
  applicationData?: StoredApplication
  onSuccess?: () => void
}

export function ApplicationForm({
  accountId,
  questions,
  initialAnswers = [],
  applicationData,
  onSuccess,
}: ApplicationFormProps) {
  const { addApiCall } = useApiCallContext()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hrContact, setHrContact] = useState({
    name: "",
    email: "",
    title: "",
    phone: "",
  })

  // Convert initial answers to form values
  const defaultValues = questions.reduce((acc, q) => {
    const existingAnswer = initialAnswers.find((a) => a.key === q.key)
    if (existingAnswer) {
      acc[q.key] = existingAnswer.answer
    } else if (q.type === "checkbox") {
      acc[q.key] = []
    } else {
      acc[q.key] = ""
    }
    return acc
  }, {} as Record<string, AnswerValue>)

  const form = useForm<Record<string, AnswerValue>>({
    defaultValues,
  })

  const formValues = form.watch()

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!applicationData) return

    const answers: Answer[] = Object.entries(formValues)
      .filter(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0
        return value !== "" && value !== null && value !== undefined
      })
      .map(([key, value]) => ({
        key,
        answer: value,
      }))

    try {
      await saveApplication({
        ...applicationData,
        answers,
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Auto-save failed:", error)
    }
  }, [formValues, applicationData])

  // Debounced auto-save
  const debouncedAutoSave = useDebouncedCallback(autoSave, 2000)

  // Trigger auto-save on form changes
  useEffect(() => {
    debouncedAutoSave()
  }, [formValues, debouncedAutoSave])

  // Manual save function
  const handleSave = async () => {
    await autoSave()
    toast({
      title: "Saved",
      description: "Your progress has been saved.",
    })
  }

  // Filter questions based on dependencies using expression evaluator
  const getVisibleQuestions = (): Question[] => {
    return questions.filter((question) => {
      return evaluateDependantOn(question.dependant_on, formValues)
    })
  }

  const visibleQuestions = getVisibleQuestions()

  // Calculate progress
  const answeredCount = visibleQuestions.filter((q) => {
    const value = formValues[q.key]
    if (q.required) {
      if (Array.isArray(value)) return value.length > 0
      return value !== "" && value !== null && value !== undefined
    }
    return true
  }).length

  const progress = visibleQuestions.length > 0 
    ? (answeredCount / visibleQuestions.length) * 100 
    : 0

  const requiredQuestions = visibleQuestions.filter((q) => q.required)
  const allRequiredAnswered = requiredQuestions.every((q) => {
    const value = formValues[q.key]
    if (Array.isArray(value)) return value.length > 0
    return value !== "" && value !== null && value !== undefined
  })

  const handleGenerateData = async () => {
    // Generate answers for all visible questions
    const fakeAnswers = await generateAnswersForQuestions(visibleQuestions)
    
    // Set form values
    Object.entries(fakeAnswers).forEach(([key, value]) => {
      form.setValue(key, value)
    })
    
    // Generate HR contact data
    const fakeHrContact = await generateHrContactData()
    setHrContact(fakeHrContact)
    
    toast({
      title: "Data Generated",
      description: "Form has been populated with fake data. You can edit any fields as needed.",
    })
  }

  const handleSubmit = async () => {
    if (!allRequiredAnswered) {
      toast({
        title: "Validation Error",
        description: "Please answer all required questions before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Filter answers to only include visible questions with non-empty values
      const answers: Answer[] = Object.entries(formValues)
        .filter(([key]) => {
          const question = questions.find((q) => q.key === key)
          return question && getVisibleQuestions().includes(question)
        })
        .filter(([_, value]) => {
          // Filter out empty values
          if (Array.isArray(value)) return value.length > 0
          if (typeof value === "string") return value.trim() !== ""
          return value !== null && value !== undefined && value !== ""
        })
        .map(([key, value]) => ({
          key,
          answer: value,
        }))

      // Build request payload, omitting empty fields
      const requestPayload: SubmitApplicationRequest = {
        answers,
      }

      // Only include HR contact fields if they have non-empty values
      if (hrContact.name?.trim()) {
        requestPayload.hr_contact_name = hrContact.name.trim()
      }
      if (hrContact.email?.trim()) {
        requestPayload.hr_contact_email = hrContact.email.trim()
      }
      if (hrContact.title?.trim()) {
        requestPayload.hr_contact_title = hrContact.title.trim()
      }
      if (hrContact.phone?.trim()) {
        requestPayload.hr_contact_phone = hrContact.phone.trim()
      }

      await submitApplication(
        accountId,
        requestPayload,
        addApiCall
      )

      // Update status in storage
      if (applicationData) {
        await updateApplicationStatus(accountId, "submitted", new Date().toISOString())
      }

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully.",
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormProvider {...form}>
      <div className="space-y-6">
        <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Application Questions</CardTitle>
              <CardDescription>
                Answer all required questions to complete your application
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateData}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Sample Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>
                {answeredCount} of {visibleQuestions.length} questions answered
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <Separator />

          <div className="space-y-6">
            {visibleQuestions.map((question) => (
              <QuestionField
                key={question.key}
                name={question.key}
                question={question}
                value={formValues[question.key]}
                onChange={(value) => form.setValue(question.key, value)}
                error={form.formState.errors[question.key]?.message as string}
                allAnswers={formValues}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>HR Contact Information</CardTitle>
              <CardDescription>
                Provide HR representative contact details (optional but recommended)
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const fakeHrContact = generateHrContactData()
                setHrContact(fakeHrContact)
                toast({
                  title: "HR Contact Generated",
                  description: "HR contact information has been populated. You can edit as needed.",
                })
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hr-name">Name</Label>
              <Input
                id="hr-name"
                value={hrContact.name}
                onChange={(e) => setHrContact({ ...hrContact, name: e.target.value })}
                placeholder="HR Representative Name"
              />
            </div>
            <div>
              <Label htmlFor="hr-email">Email</Label>
              <Input
                id="hr-email"
                type="email"
                value={hrContact.email}
                onChange={(e) => setHrContact({ ...hrContact, email: e.target.value })}
                placeholder="hr@company.com"
              />
            </div>
            <div>
              <Label htmlFor="hr-title">Title</Label>
              <Input
                id="hr-title"
                value={hrContact.title}
                onChange={(e) => setHrContact({ ...hrContact, title: e.target.value })}
                placeholder="HR Manager"
              />
            </div>
            <div>
              <Label htmlFor="hr-phone">Phone</Label>
              <Input
                id="hr-phone"
                value={hrContact.phone}
                onChange={(e) => setHrContact({ ...hrContact, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={handleSave}>
          Save Progress
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !allRequiredAnswered}
          className="flex-1"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
      </div>
    </FormProvider>
  )
}
