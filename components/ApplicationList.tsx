"use client"

import { useState, useMemo } from "react"
import { StoredApplication, ApplicationStatus } from "@/lib/types"
import { ApplicationCard } from "./ApplicationCard"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LayoutGrid, List, Edit, Eye, DollarSign, Trash2 } from "lucide-react"
import { format } from "date-fns"
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

type ViewMode = "cards" | "table"

const statusColors: Record<ApplicationStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-secondary/30", text: "text-primary" },
  in_progress: { bg: "bg-secondary/50", text: "text-primary" },
  submitted: { bg: "bg-secondary/50", text: "text-primary" },
  quoted: { bg: "bg-counterpart-green-light/30", text: "text-counterpart-green-dark" },
  declined: { bg: "bg-counterpart-red-light/50", text: "text-counterpart-red-dark" },
  bound: { bg: "bg-counterpart-secondary/50", text: "text-counterpart-primary" },
}

const statusLabels: Record<ApplicationStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  submitted: "Submitted",
  quoted: "Quoted",
  declined: "Declined",
  bound: "Bound",
}

interface ApplicationListProps {
  applications: StoredApplication[]
  onDelete: (accountId: string) => void
}

export function ApplicationList({ applications, onDelete }: ApplicationListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest")
  const [viewMode, setViewMode] = useState<ViewMode>("cards")

  const filteredAndSorted = useMemo(() => {
    let filtered = applications

    if (searchQuery) {
      filtered = filtered.filter((app) =>
        app.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortBy === "newest" ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [applications, searchQuery, statusFilter, sortBy])

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No applications yet.</p>
          <p className="text-sm text-muted-foreground">
            Start a new application to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by company name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="bound">Bound</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-md border border-input overflow-hidden">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center justify-center h-10 w-10 transition-colors ${
              viewMode === "cards"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
            title="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center justify-center h-10 w-10 border-l border-input transition-colors ${
              viewMode === "table"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No applications match your filters.</p>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((application) => (
            <ApplicationCard
              key={application.account_id}
              application={application}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Coverages</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((application) => {
                const answeredCount = application.answers?.length ?? 0
                const totalQuestions = application.questions?.length ?? 0
                const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
                const statusColor = statusColors[application.status] || statusColors.draft
                const statusLabel = statusLabels[application.status] || application.status

                return (
                  <TableRow key={application.account_id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/applications/${application.account_id}`}
                        className="hover:underline"
                      >
                        {application.company_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColor.bg} ${statusColor.text} border-0`}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {application.coverages?.map((coverage) => (
                          <Badge key={coverage} variant="outline" className="text-xs">
                            {coverage.toUpperCase()}
                          </Badge>
                        )) ?? (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {answeredCount}/{totalQuestions}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(application.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {application.updated_at
                        ? format(new Date(application.updated_at), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                          <Link href={`/applications/${application.account_id}`}>
                            {application.status === "quoted" ? (
                              <DollarSign className="h-4 w-4" />
                            ) : application.status === "draft" || application.status === "in_progress" ? (
                              <Edit className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Link>
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
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
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
