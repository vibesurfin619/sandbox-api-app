"use client"

import { useEffect } from "react"
import { Question, AnswerValue, QuestionOption } from "@/lib/types"
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
import { evaluateObjectExpression } from "@/lib/expression-evaluator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface QuestionFieldProps {
  question: Question
  value?: AnswerValue
  onChange: (value: AnswerValue) => void
  error?: string
  name: string
  allAnswers?: Record<string, AnswerValue>
}

// Default Yes/No options for boolean questions
const DEFAULT_BOOLEAN_OPTIONS: QuestionOption[] = [
  {
    id: "Yes",
    text: "Yes",
    disabled_expression: null,
  },
  {
    id: "No",
    text: "No",
    disabled_expression: null,
  },
]

/**
 * Gets the options for a question, automatically populating Yes/No options
 * for boolean questions when options_serializer is empty, and filters/processes
 * options based on disabled_expression
 */
function getQuestionOptions(
  question: Question,
  allAnswers: Record<string, AnswerValue> = {}
): { options: QuestionOption[]; disabledOptions: Set<string> } {
  let baseOptions: QuestionOption[] = []
  
  // For boolean questions with empty options_serializer, use default Yes/No options
  if (
    question.type === "boolean" &&
    (!question.options_serializer || question.options_serializer.length === 0)
  ) {
    baseOptions = DEFAULT_BOOLEAN_OPTIONS
  } else {
    baseOptions = question.options_serializer || []
  }
  
  // Filter and process options based on disabled_expression
  const visibleOptions: QuestionOption[] = []
  const disabledOptions = new Set<string>()
  
  for (const option of baseOptions) {
    if (!option.disabled_expression) {
      // No expression, always visible and enabled
      visibleOptions.push(option)
      continue
    }
    
    const { action, expression, autoSelect } = option.disabled_expression
    
    // Evaluate the expression
    const expressionResult = evaluateObjectExpression(expression, allAnswers)
    
    if (action === "hide") {
      // Only show if expression is false (i.e., don't hide)
      if (!expressionResult) {
        visibleOptions.push(option)
      }
    } else if (action === "disable") {
      // Always show, but disable if expression is true
      visibleOptions.push(option)
      if (expressionResult) {
        disabledOptions.add(option.id)
      }
    } else {
      // Default: show if expression is true
      if (expressionResult) {
        visibleOptions.push(option)
      }
    }
  }
  
  return { options: visibleOptions, disabledOptions }
}

export function QuestionField({
  question,
  value,
  onChange,
  error,
  name,
  allAnswers = {},
}: QuestionFieldProps) {
  // Handle autoSelect logic
  useEffect(() => {
    if (!question.options_serializer) return
    
    const { options } = getQuestionOptions(question, allAnswers)
    
    for (const option of options) {
      if (option.disabled_expression?.autoSelect) {
        const shouldAutoSelect = evaluateObjectExpression(
          option.disabled_expression.autoSelect,
          allAnswers
        )
        
        if (shouldAutoSelect && value !== option.id) {
          onChange(option.id)
        }
      }
    }
  }, [question, allAnswers, value, onChange])

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

      case "boolean":
      case "radio":
        const { options: radioOptions, disabledOptions: radioDisabled } = getQuestionOptions(question, allAnswers)
        return (
          <RadioGroup
            value={(value as string) || ""}
            onValueChange={onChange}
          >
            {radioOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option.id} 
                  id={option.id}
                  disabled={radioDisabled.has(option.id)}
                />
                <Label 
                  htmlFor={option.id} 
                  className={cn(
                    "font-normal",
                    radioDisabled.has(option.id) && "text-muted-foreground"
                  )}
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "select":
        const { options: selectOptions, disabledOptions: selectDisabled } = getQuestionOptions(question, allAnswers)
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={question.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                  disabled={selectDisabled.has(option.id)}
                >
                  {option.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        const checkboxValues = (value as string[]) || []
        const { options: checkboxOptions, disabledOptions: checkboxDisabled } = getQuestionOptions(question, allAnswers)
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={checkboxValues.includes(option.id)}
                  disabled={checkboxDisabled.has(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...checkboxValues, option.id])
                    } else {
                      onChange(checkboxValues.filter((v) => v !== option.id))
                    }
                  }}
                />
                <Label 
                  htmlFor={option.id} 
                  className={cn(
                    "font-normal",
                    checkboxDisabled.has(option.id) && "text-muted-foreground"
                  )}
                >
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
