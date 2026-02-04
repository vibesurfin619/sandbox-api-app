"use client"

import { StoredApplication, ApplicationStatus } from "@/lib/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { Trash2, Edit } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const statusColors: Record<ApplicationStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-secondary/30", text: "text-primary" },
  in_progress: { bg: "bg-secondary/50", text: "text-primary" },
  submitted: { bg: "bg-secondary/50", text: "text-primary" },
  quoted: { bg: "bg-counterpart-green-light/30", text: "text-counterpart-green-dark" },
  review: { bg: "bg-counterpart-yellow-light/50", text: "text-counterpart-yellow-dark" },
  declined: { bg: "bg-counterpart-red-light/50", text: "text-counterpart-red-dark" },
  bound: { bg: "bg-counterpart-green-light/50", text: "text-counterpart-green-dark" },
}

const statusLabels: Record<ApplicationStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  submitted: "Submitted",
  quoted: "Quoted",
  review: "Under Review",
  declined: "Declined",
  bound: "Bound",
}

interface ApplicationCardProps {
  application: StoredApplication
  onDelete: (accountId: string) => void
}

export function ApplicationCard({ application, onDelete }: ApplicationCardProps) {
  const answeredCount = application.answers.length
  const totalQuestions = application.questions.length
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  const statusColor = statusColors[application.status] || statusColors.draft
  const statusLabel = statusLabels[application.status] || application.status

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
            {application.coverages.map((coverage) => (
              <Badge key={coverage} variant="outline" className="text-xs">
                {coverage.toUpperCase()}
              </Badge>
            ))}
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
