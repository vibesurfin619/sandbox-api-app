"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StartApplicationRequest, CoverageType } from "@/lib/types"
import { startApplication } from "@/lib/api/counterpart"
import { useApiCallContext } from "@/context/ApiCallContext"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { saveApplication } from "@/lib/storage"
import { StoredApplication } from "@/lib/types"
import { generateStartApplicationData } from "@/lib/faker-utils"
import { 
  Sparkles, 
  Briefcase, 
  Users, 
  Shield, 
  Lock, 
  FileText, 
  Building2, 
  Heart, 
  Ruler,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

const coverageOptions: { 
  value: CoverageType; 
  label: string; 
  shortLabel: string;
  icon: LucideIcon;
  description: string;
}[] = [
  { 
    value: "do", 
    label: "Directors & Officers (DO)",
    shortLabel: "D&O",
    icon: Briefcase,
    description: "Protects company leadership"
  },
  { 
    value: "epli", 
    label: "Employment Practices Liability (EPLI)",
    shortLabel: "EPLI",
    icon: Users,
    description: "Employment-related claims"
  },
  { 
    value: "fid", 
    label: "Fiduciary (FID)",
    shortLabel: "Fiduciary",
    icon: Shield,
    description: "Fiduciary responsibility protection"
  },
  { 
    value: "crm", 
    label: "Crime (CRM)",
    shortLabel: "Crime",
    icon: Lock,
    description: "Crime and fraud protection"
  },
  { 
    value: "mpl", 
    label: "Miscellaneous Professional Liability (MPL)",
    shortLabel: "MPL",
    icon: FileText,
    description: "Professional liability coverage"
  },
  { 
    value: "gl", 
    label: "General Liability (GL)",
    shortLabel: "General Liability",
    icon: Building2,
    description: "General business liability"
  },
  { 
    value: "ah", 
    label: "Allied Healthcare (AH)",
    shortLabel: "Allied Healthcare",
    icon: Heart,
    description: "Healthcare professional coverage"
  },
  { 
    value: "ae", 
    label: "Architects, Engineers, & Contractors Professional (AE)",
    shortLabel: "Architects & Engineers",
    icon: Ruler,
    description: "Design and construction professionals"
  },
  { 
    value: "isogl", 
    label: "General Liability - ISO (ISOGL)",
    shortLabel: "ISO GL",
    icon: Building2,
    description: "ISO standard general liability"
  },
]

const formSchema = z.object({
  legal_name: z.string().min(1, "Legal name is required"),
  dba_name: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  industry: z.string().optional(),
  address_1: z.string().optional(),
  address_2: z.string().optional().nullable(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zipcode: z.string().optional(),
  broker_first_name: z.string().optional(),
  broker_last_name: z.string().optional(),
  broker_email: z.string().email("Invalid email").optional().or(z.literal("")),
  brokerage_office_city: z.string().optional().nullable(),
  brokerage_office_state: z.string().optional().nullable(),
  coverages: z.array(z.enum(["do", "epli", "fid", "crm", "mpl", "gl", "ah", "ae", "isogl"])).min(1, "Select at least one coverage"),
})

interface StartApplicationFormProps {
  initialData?: Partial<StartApplicationRequest>
  onSuccess: (accountId: string) => void
}

export function StartApplicationForm({
  initialData,
  onSuccess,
}: StartApplicationFormProps) {
  const { addApiCall } = useApiCallContext()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      legal_name: initialData?.legal_name || "",
      dba_name: initialData?.dba_name || null,
      website: initialData?.website || "",
      industry: initialData?.industry || "",
      address_1: initialData?.address_1 || "",
      address_2: initialData?.address_2 || null,
      address_city: initialData?.address_city || "",
      address_state: initialData?.address_state || "",
      address_zipcode: initialData?.address_zipcode || "",
      broker_first_name: initialData?.broker_first_name || "",
      broker_last_name: initialData?.broker_last_name || "",
      broker_email: initialData?.broker_email || "marc+broker@yourcounterpart.com",
      brokerage_office_city: initialData?.brokerage_office_city || null,
      brokerage_office_state: initialData?.brokerage_office_state || null,
      coverages: (initialData?.coverages as CoverageType[]) || [],
    },
  })

  // Ensure broker_email is always set to default if empty
  useEffect(() => {
    const currentValue = form.getValues("broker_email")
    if (!currentValue || currentValue.trim() === "") {
      form.setValue("broker_email", "marc+broker@yourcounterpart.com")
    }
  }, [form])

  const handleGenerateData = async () => {
    const fakeData = await generateStartApplicationData()
    // Set all form values with the generated data
    if (fakeData.legal_name) form.setValue("legal_name", fakeData.legal_name)
    if (fakeData.dba_name !== undefined) form.setValue("dba_name", fakeData.dba_name)
    if (fakeData.website) form.setValue("website", fakeData.website)
    if (fakeData.industry) form.setValue("industry", fakeData.industry)
    if (fakeData.address_1) form.setValue("address_1", fakeData.address_1)
    if (fakeData.address_2 !== undefined) form.setValue("address_2", fakeData.address_2)
    if (fakeData.address_city) form.setValue("address_city", fakeData.address_city)
    if (fakeData.address_state) form.setValue("address_state", fakeData.address_state)
    if (fakeData.address_zipcode) form.setValue("address_zipcode", fakeData.address_zipcode)
    if (fakeData.broker_first_name) form.setValue("broker_first_name", fakeData.broker_first_name)
    if (fakeData.broker_last_name) form.setValue("broker_last_name", fakeData.broker_last_name)
    if (fakeData.broker_email) form.setValue("broker_email", fakeData.broker_email)
    if (fakeData.brokerage_office_city !== undefined) form.setValue("brokerage_office_city", fakeData.brokerage_office_city)
    if (fakeData.brokerage_office_state !== undefined) form.setValue("brokerage_office_state", fakeData.brokerage_office_state)
    if (fakeData.coverages) form.setValue("coverages", fakeData.coverages)
    toast({
      title: "Data Generated",
      description: "Form has been populated with fake data. You can edit any fields as needed.",
    })
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Ensure broker_email is set to default if empty
      const brokerEmail = values.broker_email?.trim() || "marc+broker@yourcounterpart.com"
      
      // Build request payload, ensuring broker_email is included when it has a value
      const requestData: StartApplicationRequest = {
        app_source: "counterpart",
        application_version: "1000",
        legal_name: values.legal_name,
        coverages: values.coverages,
        ...(values.dba_name && { dba_name: values.dba_name }),
        ...(values.website && values.website.trim() !== "" && { website: values.website }),
        ...(values.industry && { industry: values.industry }),
        ...(values.address_1 && { address_1: values.address_1 }),
        ...(values.address_2 && { address_2: values.address_2 }),
        ...(values.address_city && { address_city: values.address_city }),
        ...(values.address_state && { address_state: values.address_state }),
        ...(values.address_zipcode && { address_zipcode: values.address_zipcode }),
        ...(values.broker_first_name && { broker_first_name: values.broker_first_name }),
        ...(values.broker_last_name && { broker_last_name: values.broker_last_name }),
        ...(brokerEmail && brokerEmail.trim() !== "" && { broker_email: brokerEmail }),
        ...(values.brokerage_office_city && { brokerage_office_city: values.brokerage_office_city }),
        ...(values.brokerage_office_state && { brokerage_office_state: values.brokerage_office_state }),
      }
      
      const response = await startApplication(
        requestData,
        addApiCall
      )

      // Save to localStorage
      const newApplication: StoredApplication = {
        account_id: response.account_id,
        status: "in_progress",
        company_name: values.legal_name,
        coverages: values.coverages,
        answers: [],
        questions: response.questions,
        startApplicationData: {
          ...values,
          app_source: "counterpart",
          application_version: "1000",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await saveApplication(newApplication)

      toast({
        title: "Application started",
        description: "Your application has been created successfully.",
      })

      onSuccess(response.account_id)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start application",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Start New Application</CardTitle>
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
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Information</h3>
              
              <FormField
                control={form.control}
                name="legal_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Legal Name Of Company goes here" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dba_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DBA Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Doing business as name (optional)"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://websitetest.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry (NAICS Code)</FormLabel>
                    <FormControl>
                      <Input placeholder="541219" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address_1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Suite 100" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="address_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="California" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address_zipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Broker Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="broker_first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broker First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="broker_last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broker Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="broker_email"
                render={({ field }) => {
                  const defaultValue = "marc+broker@yourcounterpart.com"
                  const currentValue = field.value || defaultValue
                  
                  return (
                    <FormItem>
                      <FormLabel>Broker Email</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value)} 
                        value={currentValue}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select broker email" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="marc+broker@yourcounterpart.com">marc+broker@yourcounterpart.com</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="brokerage_office_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brokerage Office City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brokerage_office_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brokerage Office State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Application Settings</h3>

              <FormField
                control={form.control}
                name="coverages"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Coverages *</FormLabel>
                      <FormDescription>
                        Select at least one coverage type. Note: MPL cannot be combined with other coverages.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {coverageOptions.map((item) => {
                        const Icon = item.icon
                        const isSelected = field.value?.includes(item.value) || false
                        
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              const current = field.value || []
                              if (isSelected) {
                                field.onChange(
                                  current.filter((value) => value !== item.value)
                                )
                              } else {
                                // If MPL is selected, clear others
                                if (item.value === "mpl") {
                                  field.onChange([item.value])
                                } else {
                                  // If other is selected and MPL is in list, remove MPL
                                  const filtered = current.filter((v) => v !== "mpl")
                                  field.onChange([...filtered, item.value])
                                }
                              }
                            }}
                            className={cn(
                              "relative p-6 rounded-lg border-2 transition-all duration-200",
                              "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                              "text-left group",
                              isSelected
                                ? "border-counterpart-primary bg-counterpart-primary/5 shadow-md"
                                : "border-counterpart-secondary/30 bg-white hover:border-counterpart-secondary/50"
                            )}
                            aria-pressed={isSelected}
                          >
                            <div className="flex flex-col items-start space-y-3">
                              <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                isSelected
                                  ? "bg-counterpart-primary text-white"
                                  : "bg-counterpart-secondary/30 text-counterpart-primary"
                              )}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <div className="flex-1 w-full">
                                <h4 className={cn(
                                  "font-semibold text-sm mb-1",
                                  isSelected ? "text-counterpart-primary" : "text-foreground"
                                )}>
                                  {item.shortLabel}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className="rounded-full bg-counterpart-primary text-white p-1">
                                    <Check className="h-3 w-3" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Starting..." : "Start Application"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
