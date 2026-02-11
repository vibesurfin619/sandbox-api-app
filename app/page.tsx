"use client"

import { useState, useEffect, useRef } from "react"
import { getAllApplications } from "@/lib/storage"
import { StoredApplication } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ApiCallSidebar } from "@/components/ApiCallSidebar"
import Link from "next/link"
import { Plus, FileText, DollarSign, CheckCircle, Upload, Mail, UserPlus, Download, Shield, Stethoscope, Ruler, Briefcase, TrendingUp, Target, Lightbulb, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"

export default function HomePage() {
  const [applications, setApplications] = useState<StoredApplication[]>([])
  const [emailAddress, setEmailAddress] = useState("")
  const [recipient, setRecipient] = useState<"retail_agent" | "insured">("retail_agent")
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  
  // Invite Retail Agent state
  const [isInviteAgentDialogOpen, setIsInviteAgentDialogOpen] = useState(false)
  const [agentName, setAgentName] = useState("")
  const [agentEmail, setAgentEmail] = useState("")
  const [agentPhone, setAgentPhone] = useState("")
  const [agentActive, setAgentActive] = useState(true)
  const [agentOptOutEmail, setAgentOptOutEmail] = useState(false)
  const [agentAgencyName, setAgentAgencyName] = useState("")
  const [agentEffectiveDate, setAgentEffectiveDate] = useState("")
  const [agentAddress, setAgentAddress] = useState("")
  const [agentCity, setAgentCity] = useState("")
  const [agentState, setAgentState] = useState("")
  const [agentZip, setAgentZip] = useState("")

  // Download Appetite Guide state
  const [isAppetiteGuideDialogOpen, setIsAppetiteGuideDialogOpen] = useState(false)

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

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

  const handleEmailSubmit = () => {
    // TODO: Implement email sending logic
    console.log("Sending email to:", emailAddress, "Recipient type:", recipient)
    setIsEmailDialogOpen(false)
    setEmailAddress("")
    setRecipient("retail_agent")
  }

  const handleInviteAgentSubmit = () => {
    // TODO: Implement retail agent invitation logic
    console.log("Inviting retail agent:", {
      name: agentName,
      email: agentEmail,
      phone: agentPhone,
      active: agentActive,
      optOutEmail: agentOptOutEmail,
      agencyName: agentAgencyName,
      effectiveDate: agentEffectiveDate,
      address: {
        street: agentAddress,
        city: agentCity,
        state: agentState,
        zip: agentZip,
      }
    })
    setIsInviteAgentDialogOpen(false)
    setAgentName("")
    setAgentEmail("")
    setAgentPhone("")
    setAgentActive(true)
    setAgentOptOutEmail(false)
    setAgentAgencyName("")
    setAgentEffectiveDate("")
    setAgentAddress("")
    setAgentCity("")
    setAgentState("")
    setAgentZip("")
  }

  // Calculate metrics
  const totalApps = applications.length
  const boundApps = applications.filter(app => app.status === 'bound')
  const totalPremiumBound = 0 // TODO: Add premium calculation when quote data is available
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

        {/* Opportunities */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-counterpart-primary mb-4">Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* New Product Launch - Architects and Engineers */}
            <div className="bg-counterpart-secondary/50 border border-counterpart-secondary rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-counterpart-primary shadow-sm">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-counterpart-primary">New Product Launch</h3>
                </div>
              </div>
              <p className="text-sm text-counterpart-primary mb-4">
                We've launched Architects and Engineers professional liability coverage. Target your A&E clients with our competitive rates and comprehensive coverage.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-counterpart-secondary">
                <span className="text-xs text-counterpart-primary/70 font-medium">Action Recommended</span>
                <Link 
                  href="/applications/new"
                  className="flex items-center gap-1 text-sm font-medium text-counterpart-primary hover:opacity-70 transition-opacity"
                >
                  Start Application
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Cross-Sell Opportunity */}
            <div className="bg-counterpart-green-light/30 border border-counterpart-green-light rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-counterpart-green-light shadow-sm">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-counterpart-green-dark">Cross-Sell Opportunity</h3>
                </div>
              </div>
              <p className="text-sm text-counterpart-green-dark mb-4">
                <strong>8 accounts</strong> currently have Management Liability with us but could benefit from our Professional Liability or General Liability products.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-counterpart-green-light">
                <span className="text-xs text-counterpart-green-dark font-medium">High Conversion Potential</span>
                <Link 
                  href="/applications"
                  className="flex items-center gap-1 text-sm font-medium text-counterpart-green-dark hover:opacity-70 transition-opacity"
                >
                  View Accounts
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Expanded Appetite */}
            <div className="bg-counterpart-yellow-light/30 border border-counterpart-yellow-light rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-counterpart-yellow-light shadow-sm">
                  <TrendingUp className="h-5 w-5 text-counterpart-yellow-dark" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-counterpart-yellow-dark">Expanded Appetite</h3>
                </div>
              </div>
              <p className="text-sm text-counterpart-yellow-dark mb-4">
                We've expanded Professional Liability appetite to <strong>200 employees</strong>. You have <strong>12 past submissions</strong> that now fall within appetite.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-counterpart-yellow-light">
                <span className="text-xs text-counterpart-yellow-dark font-medium">Re-submit Eligible</span>
                <Link 
                  href="/applications"
                  className="flex items-center gap-1 text-sm font-medium text-counterpart-yellow-dark hover:opacity-70 transition-opacity"
                >
                  View Applications
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-counterpart-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button 
              onClick={handleUploadClick}
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
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.json,.csv"
            />

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

            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <button 
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
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Email Application</DialogTitle>
                  <DialogDescription>
                    To be filled out by another party
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Recipient</Label>
                    <RadioGroup value={recipient} onValueChange={(value) => setRecipient(value as "retail_agent" | "insured")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="retail_agent" id="retail_agent" />
                        <Label htmlFor="retail_agent" className="font-normal cursor-pointer">
                          Retail Agent
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="insured" id="insured" />
                        <Label htmlFor="insured" className="font-normal cursor-pointer">
                          Insured
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEmailSubmit} disabled={!emailAddress}>
                    Send
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isInviteAgentDialogOpen} onOpenChange={setIsInviteAgentDialogOpen}>
              <DialogTrigger asChild>
                <button 
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
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Invite Retail Agent</DialogTitle>
                  <DialogDescription>
                    Invite a retail agent to submit applications on your behalf
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-counterpart-primary">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="agent-name">Name *</Label>
                        <Input
                          id="agent-name"
                          type="text"
                          placeholder="Enter agent name"
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agent-email">Email Address *</Label>
                        <Input
                          id="agent-email"
                          type="email"
                          placeholder="Enter agent email"
                          value={agentEmail}
                          onChange={(e) => setAgentEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agent-phone">Phone</Label>
                        <Input
                          id="agent-phone"
                          type="tel"
                          placeholder="(555) 555-5555"
                          value={agentPhone}
                          onChange={(e) => setAgentPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agency Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-counterpart-primary">Agency Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="agent-agency-name">Agency Name</Label>
                        <Input
                          id="agent-agency-name"
                          type="text"
                          placeholder="Enter agency name"
                          value={agentAgencyName}
                          onChange={(e) => setAgentAgencyName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agent-effective-date">Effective Date</Label>
                        <Input
                          id="agent-effective-date"
                          type="date"
                          value={agentEffectiveDate}
                          onChange={(e) => setAgentEffectiveDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-counterpart-primary">Address Information</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="agent-address">Street Address</Label>
                        <Input
                          id="agent-address"
                          type="text"
                          placeholder="Enter street address"
                          value={agentAddress}
                          onChange={(e) => setAgentAddress(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="agent-city">City</Label>
                          <Input
                            id="agent-city"
                            type="text"
                            placeholder="City"
                            value={agentCity}
                            onChange={(e) => setAgentCity(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agent-state">State</Label>
                          <Input
                            id="agent-state"
                            type="text"
                            placeholder="State"
                            value={agentState}
                            onChange={(e) => setAgentState(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agent-zip">Zip Code</Label>
                          <Input
                            id="agent-zip"
                            type="text"
                            placeholder="Zip"
                            value={agentZip}
                            onChange={(e) => setAgentZip(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-counterpart-primary">Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="agent-active">Active</Label>
                          <p className="text-sm text-muted-foreground">
                            Agent can submit applications
                          </p>
                        </div>
                        <Switch
                          id="agent-active"
                          checked={agentActive}
                          onCheckedChange={setAgentActive}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="agent-opt-out">Opt Out of Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Agent will not receive email notifications
                          </p>
                        </div>
                        <Switch
                          id="agent-opt-out"
                          checked={agentOptOutEmail}
                          onCheckedChange={setAgentOptOutEmail}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteAgentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteAgentSubmit} disabled={!agentName || !agentEmail}>
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAppetiteGuideDialogOpen} onOpenChange={setIsAppetiteGuideDialogOpen}>
              <DialogTrigger asChild>
                <button 
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
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-counterpart-primary to-counterpart-primary/70">
                      <Download className="h-5 w-5 text-white" />
                    </div>
                    <DialogTitle className="text-2xl">Appetite Guides</DialogTitle>
                  </div>
                  <DialogDescription>
                    Explore our comprehensive coverage guides and underwriting criteria
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 overflow-y-auto">
                  {/* Management Liability */}
                  <div className="group relative overflow-hidden rounded-xl border border-counterpart-secondary/20 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-counterpart-primary/10 to-counterpart-secondary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative p-6 flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-counterpart-primary shadow-md group-hover:shadow-lg transition-shadow">
                          <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-counterpart-primary mb-1">
                            Management Liability
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            D&O, EPLI, Fiduciary & Crime coverage for private companies
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">D&O</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">EPLI</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Fiduciary</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Crime</span>
                      </div>
                      <Button 
                        asChild
                        className="mt-auto w-full shadow-md"
                      >
                        <a 
                          href="/Management-Liability-Appetite-Guide-2024.pdf" 
                          download="Management-Liability-Appetite-Guide-2024.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Guide
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Architects and Engineers */}
                  <div className="group relative overflow-hidden rounded-xl border border-counterpart-secondary/20 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-counterpart-primary/10 to-counterpart-secondary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative p-6 flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-counterpart-primary shadow-md group-hover:shadow-lg transition-shadow">
                          <Ruler className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-counterpart-primary mb-1">
                            Architects & Engineers
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Specialized underwriting for A&E professional liability
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Professional Liability</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">A&E</span>
                      </div>
                      <Button 
                        asChild
                        className="mt-auto w-full shadow-md"
                      >
                        <a 
                          href="/Architects-and-Engineers-Agentic-Underwriting.pdf" 
                          download="Architects-and-Engineers-Agentic-Underwriting.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Guide
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Allied Health */}
                  <div className="group relative overflow-hidden rounded-xl border border-counterpart-secondary/20 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-counterpart-primary/10 to-counterpart-secondary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative p-6 flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-counterpart-primary shadow-md group-hover:shadow-lg transition-shadow">
                          <Stethoscope className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-counterpart-primary mb-1">
                            Allied Health
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Healthcare professionals & medical malpractice coverage
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Healthcare</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Medical Malpractice</span>
                      </div>
                      <Button 
                        asChild
                        className="mt-auto w-full shadow-md"
                      >
                        <a 
                          href="/Allied-Health-Agentic-Underwriting.pdf" 
                          download="Allied-Health-Agentic-Underwriting.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Guide
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Miscellaneous Professional Liability and General Liability */}
                  <div className="group relative overflow-hidden rounded-xl border border-counterpart-secondary/20 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-counterpart-primary/10 to-counterpart-secondary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative p-6 flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-counterpart-primary shadow-md group-hover:shadow-lg transition-shadow">
                          <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-counterpart-primary mb-1">
                            Misc. Pro & General Liability
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Multi-industry professional & general liability coverage
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Professional Liability</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">General Liability</span>
                      </div>
                      <Button 
                        asChild
                        className="mt-auto w-full shadow-md"
                      >
                        <a 
                          href="/Miscellaneous-Professional-Liability-and-General-Liability-Appetite-Guide.pdf" 
                          download="Miscellaneous-Professional-Liability-and-General-Liability-Appetite-Guide.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Guide
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ApiCallSidebar />
    </div>
  )
}
