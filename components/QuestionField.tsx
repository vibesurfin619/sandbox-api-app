"use client"

import { Question, AnswerValue } from "@/lib/types"
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestionFieldProps {
  question: Question
  value?: AnswerValue
  onChange: (value: AnswerValue) => void
  error?: string
  name: string
}

export function QuestionField({
  question,
  value,
  onChange,
  error,
  name,
}: QuestionFieldProps) {
  const renderInput = () => {
    switch (question.type) {
      case "text":
        return (
          <Input
            placeholder={question.placeholder}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            placeholder={question.placeholder}
            value={(value as number) || ""}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        )

      case "radio":
        return (
          <RadioGroup
            value={(value as string) || ""}
            onValueChange={onChange}
          >
            {question.options_serializer?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="font-normal">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "checkbox":
        const checkboxValues = (value as string[]) || []
        return (
          <div className="space-y-2">
            {question.options_serializer?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={checkboxValues.includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...checkboxValues, option.id])
                    } else {
                      onChange(checkboxValues.filter((v) => v !== option.id))
                    }
                  }}
                />
                <Label htmlFor={option.id} className="font-normal">
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        )

      case "date":
        const dateValue = value ? new Date(value as string) : undefined
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => {
                  if (date) {
                    onChange(format(date, "yyyy-MM-dd"))
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )

      case "file":
        return (
          <Input
            type="file"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                // Convert to base64
                const reader = new FileReader()
                reader.onloadend = () => {
                  const base64 = reader.result as string
                  // Remove data URL prefix if present
                  const base64Data = base64.split(",")[1] || base64
                  onChange(base64Data)
                }
                reader.readAsDataURL(file)
              }
            }}
          />
        )

      default:
        return <Input placeholder="Unknown question type" />
    }
  }

  return (
    <Card className="p-4">
      <FormItem>
        <FormLabel>
          {question.title}
          {question.required && <span className="text-destructive ml-1">*</span>}
        </FormLabel>
        <FormControl>{renderInput()}</FormControl>
        {question.help_text && (
          <FormDescription>{question.help_text}</FormDescription>
        )}
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    </Card>
  )
}
