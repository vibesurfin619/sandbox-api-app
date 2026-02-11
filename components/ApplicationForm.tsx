"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { Question, Answer, AnswerValue, StoredApplication, SubmitApplicationRequest } from "@/lib/types"
import { QuestionField } from "./QuestionField"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { submitApplication } from "@/lib/api/counterpart"
import { useApiCallContext } from "@/context/ApiCallContext"
import { useToast } from "@/components/ui/use-toast"
import { saveApplication, updateApplicationStatus } from "@/lib/storage"
import { useDebouncedCallback } from "use-debounce"
import { generateAnswersForQuestions, generateHrContactData } from "@/lib/faker-utils"
import { 
  Sparkles, 
  Book, 
  Building2, 
  Users, 
  Shield, 
  FileText, 
  DollarSign, 
  Briefcase,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  TrendingUp,
  FileCheck,
  ClipboardList,
  LucideIcon
} from "lucide-react"
import { evaluateDependantOn } from "@/lib/expression-evaluator"
import { cn } from "@/lib/utils"

// Helper function to convert text to title case
const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Map section names to appropriate icons
const getSectionIcon = (section: string): LucideIcon => {
  const sectionLower = section.toLowerCase()
  
  // Company/Business related
  if (sectionLower.includes('company') || sectionLower.includes('business') || sectionLower.includes('organization')) {
    return Building2
  }
  
  // Contact/People related
  if (sectionLower.includes('contact') || sectionLower.includes('people') || sectionLower.includes('personnel')) {
    return Users
  }
  
  // Coverage/Insurance related
  if (sectionLower.includes('coverage') || sectionLower.includes('insurance') || sectionLower.includes('policy')) {
    return Shield
  }
  
  // Claims related
  if (sectionLower.includes('claim') || sectionLower.includes('loss')) {
    return AlertCircle
  }
  
  // Financial related
  if (sectionLower.includes('financial') || sectionLower.includes('revenue') || sectionLower.includes('income') || sectionLower.includes('budget')) {
    return DollarSign
  }
  
  // Employment/HR related
  if (sectionLower.includes('employment') || sectionLower.includes('hr') || sectionLower.includes('employee') || sectionLower.includes('staff')) {
    return Briefcase
  }
  
  // Location/Address related
  if (sectionLower.includes('location') || sectionLower.includes('address') || sectionLower.includes('office')) {
    return MapPin
  }
  
  // Communication related
  if (sectionLower.includes('phone') || sectionLower.includes('telephone')) {
    return Phone
  }
  if (sectionLower.includes('email') || sectionLower.includes('mail')) {
    return Mail
  }
  
  // Payment/Billing related
  if (sectionLower.includes('payment') || sectionLower.includes('billing') || sectionLower.includes('invoice')) {
    return CreditCard
  }
  
  // Growth/Expansion related
  if (sectionLower.includes('growth') || sectionLower.includes('expansion') || sectionLower.includes('future')) {
    return TrendingUp
  }
  
  // Documents/Files related
  if (sectionLower.includes('document') || sectionLower.includes('file') || sectionLower.includes('attachment')) {
    return FileText
  }
  
  // Application/Form related
  if (sectionLower.includes('application') || sectionLower.includes('form')) {
    return FileCheck
  }
  
  // General/Other - default to Book
  if (sectionLower.includes('general') || sectionLower.includes('other') || sectionLower.includes('additional')) {
    return Book
  }
  
  // Default fallback
  return ClipboardList
}

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
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
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

  // Group questions by section
  const questionsBySection = visibleQuestions.reduce((acc, question) => {
    const section = question.section || "General"
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(question)
    return acc
  }, {} as Record<string, Question[]>)

  // Get sections in order (preserve order from questions array)
  const sections = Array.from(
    new Set(
      visibleQuestions.map((q) => q.section || "General")
    )
  )

  // Set initial active section
  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0])
    }
  }, [sections, activeSection])

  // Track active section on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute("data-section")
          if (sectionId) {
            setActiveSection(sectionId)
          }
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Observe all section elements
    sections.forEach((section) => {
      const element = sectionRefs.current[section]
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [sections])

  // Scroll to section handler
  const scrollToSection = (section: string) => {
    const element = sectionRefs.current[section]
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

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
      <div className="flex gap-6">
        {/* Section Tracker Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-6">
            <div className="pr-4 mb-4">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-sm">Sections</CardTitle>
                </CardHeader>
              </Card>
            </div>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-3 pr-4">
                {sections.map((section) => {
                  const sectionQuestions = questionsBySection[section] || []
                  const sectionAnsweredCount = sectionQuestions.filter((q) => {
                    const value = formValues[q.key]
                    if (q.required) {
                      if (Array.isArray(value)) return value.length > 0
                      return value !== "" && value !== null && value !== undefined
                    }
                    return true
                  }).length
                  const sectionProgress = sectionQuestions.length > 0
                    ? (sectionAnsweredCount / sectionQuestions.length) * 100
                    : 0
                  const isActive = activeSection === section

                  return (
                    <Card
                      key={section}
                      onClick={() => scrollToSection(section)}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isActive && "border-2 border-primary shadow-md bg-green-50"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {(() => {
                            const IconComponent = getSectionIcon(section)
                            return (
                              <IconComponent className={cn(
                                "h-4 w-4 flex-shrink-0 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                              )} />
                            )
                          })()}
                          <span className={cn(
                            "font-medium text-sm truncate",
                            isActive && "text-primary"
                          )}>
                            {toTitleCase(section)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2 ml-6">
                          {sectionAnsweredCount}/{sectionQuestions.length} answered
                        </div>
                        <div className="ml-6">
                          <Progress value={sectionProgress} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Application Questions</CardTitle>
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

              <div className="space-y-8">
                {sections.map((section) => (
                  <div
                    key={section}
                    ref={(el) => {
                      sectionRefs.current[section] = el
                    }}
                    data-section={section}
                    className="space-y-6"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {(() => {
                          const IconComponent = getSectionIcon(section)
                          return <IconComponent className="h-5 w-5 text-muted-foreground" />
                        })()}
                        <h3 className="text-lg font-semibold">{toTitleCase(section)}</h3>
                      </div>
                      <Separator className="mt-2" />
                    </div>
                    <div className="space-y-6">
                      {questionsBySection[section].map((question) => (
                        <QuestionField
                          key={question.key}
                          name={question.key}
                          question={question}
                          value={formValues[question.key]}
                          onChange={(value) => form.setValue(question.key, value)}
                          error={form.formState.errors[question.key]?.message as string}
                          allAnswers={formValues}
                          allQuestions={questions}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HR Contact Information</CardTitle>
              <CardDescription>
                Provide HR representative contact details (optional but recommended)
              </CardDescription>
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
      </div>
    </FormProvider>
  )
}
