"use client"

import { StoredApplication, ApplicationStatus } from "@/lib/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { Trash2, Edit, Mail } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
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

const statusColors: Record<ApplicationStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-secondary/30", text: "text-primary" },
  in_progress: { bg: "bg-secondary/50", text: "text-primary" },
  submitted: { bg: "bg-secondary/50", text: "text-primary" },
  quoted: { bg: "bg-counterpart-green-light/30", text: "text-counterpart-green-dark" },
  declined: { bg: "bg-counterpart-red-light/50", text: "text-counterpart-red-dark" },
  bound: { bg: "bg-counterpart-green-light/50", text: "text-counterpart-green-dark" },
}

const statusLabels: Record<ApplicationStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  submitted: "Submitted",
  quoted: "Quoted",
  declined: "Declined",
  bound: "Bound",
}

interface ApplicationCardProps {
  application: StoredApplication
  onDelete: (accountId: string) => void
}

export function ApplicationCard({ application, onDelete }: ApplicationCardProps) {
  const [emailAddress, setEmailAddress] = useState("")
  const [recipient, setRecipient] = useState<"retail_agent" | "insured">("retail_agent")
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)

  const answeredCount = application.answers?.length ?? 0
  const totalQuestions = application.questions?.length ?? 0
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  const statusColor = statusColors[application.status] || statusColors.draft
  const statusLabel = statusLabels[application.status] || application.status

  const handleEmailSubmit = () => {
    // TODO: Implement email sending logic
    console.log("Sending email to:", emailAddress, "Recipient type:", recipient)
    setIsEmailDialogOpen(false)
    setEmailAddress("")
    setRecipient("retail_agent")
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{application.company_name}</CardTitle>
            <CardDescription className="mt-1">
              Created {format(new Date(application.created_at), "MMM d, yyyy")}
            </CardDescription>
          </div>
          <Badge className={`${statusColor.bg} ${statusColor.text} border-0`}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-muted-foreground">
              {answeredCount} / {totalQuestions}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Coverages</p>
          <div className="flex flex-wrap gap-2">
            {application.coverages?.map((coverage) => (
              <Badge key={coverage} variant="outline" className="text-xs">
                {coverage.toUpperCase()}
              </Badge>
            )) ?? <span className="text-xs text-muted-foreground">No coverages</span>}
          </div>
        </div>

        {application.updated_at && (
          <p className="text-xs text-muted-foreground">
            Last updated {format(new Date(application.updated_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild variant="default" className="flex-1">
          <Link href={`/applications/${application.account_id}`}>
            <Edit className="mr-2 h-4 w-4" />
            {application.status === "draft" || application.status === "in_progress" ? "Continue" : "View"}
          </Link>
        </Button>
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Mail className="h-4 w-4" />
            </Button>
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Application</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this application? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => onDelete(application.account_id)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
