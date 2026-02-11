"use client"

import { useEffect, useState } from "react"
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
import { CalendarIcon, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { evaluateObjectExpression } from "@/lib/expression-evaluator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface QuestionFieldProps {
  question: Question
  value?: AnswerValue
  onChange: (value: AnswerValue) => void
  error?: string
  name: string
  allAnswers?: Record<string, AnswerValue>
  allQuestions?: Question[]
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
 * Extracts question keys from a dependant_on expression
 */
function extractDependentQuestionKeys(
  dependantOn: string | null | undefined,
  allQuestions: Question[] = []
): string[] {
  if (!dependantOn) {
    return []
  }

  const keys: Set<string> = new Set()

  // If it's a string expression, extract $variable references
  if (typeof dependantOn === "string") {
    // Match patterns like $variable_name or ($variable_name == 'value')
    const variableMatches = dependantOn.match(/\$(\w+)/g)
    if (variableMatches) {
      variableMatches.forEach((match) => {
        const key = match.slice(1) // Remove $ prefix
        keys.add(key)
      })
    }
  } else if (typeof dependantOn === "object" && dependantOn !== null) {
    // If it's an object expression, recursively extract keys
    const extractFromObject = (obj: any) => {
      if (typeof obj === "string" && obj.startsWith("$")) {
        keys.add(obj.slice(1))
      } else if (Array.isArray(obj)) {
        obj.forEach((item) => extractFromObject(item))
      } else if (typeof obj === "object" && obj !== null) {
        Object.values(obj).forEach((value) => extractFromObject(value))
      }
    }
    extractFromObject(dependantOn)
  }

  return Array.from(keys)
}

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
  allQuestions = [],
}: QuestionFieldProps) {
  // Check if this question is conditional
  const isConditional = !!question.dependant_on
  
  // Get dependent question keys and titles
  const dependentKeys = extractDependentQuestionKeys(question.dependant_on, allQuestions)
  const dependentQuestions = dependentKeys
    .map((key) => allQuestions.find((q) => q.key === key))
    .filter((q): q is Question => q !== undefined)
  
  const dependentTitles = dependentQuestions.map((q) => q.title)
  
  // State for currency input focus
  const [isCurrencyFocused, setIsCurrencyFocused] = useState(false)
  // State for percentage input focus
  const [isPercentageFocused, setIsPercentageFocused] = useState(false)
  
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

      case "currency":
        // Format currency value for display
        const formatCurrency = (val: number | string | undefined): string => {
          if (!val && val !== 0) return ""
          const numVal = typeof val === "string" ? parseFloat(val.replace(/[^0-9.-]/g, "")) : val
          if (isNaN(numVal)) return ""
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(numVal)
        }

        // Parse currency string to number
        const parseCurrency = (str: string): number => {
          const cleaned = str.replace(/[^0-9.-]/g, "")
          const parsed = parseFloat(cleaned)
          return isNaN(parsed) ? 0 : parsed
        }

        const currencyDisplayValue = value ? formatCurrency(value as number) : ""

        return (
          <div className="relative">
            <Input
              type="text"
              placeholder={question.placeholder || "$0.00"}
              value={isCurrencyFocused ? (value !== undefined && value !== null ? String(value as number) : "") : currencyDisplayValue}
              onChange={(e) => {
                const parsed = parseCurrency(e.target.value)
                onChange(parsed)
              }}
              onFocus={() => setIsCurrencyFocused(true)}
              onBlur={() => setIsCurrencyFocused(false)}
              className="pl-7"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          </div>
        )

      case "percentage":
        // Format percentage value for display
        const formatPercentage = (val: number | string | undefined): string => {
          if (val === undefined || val === null) return ""
          const numVal = typeof val === "string" ? parseFloat(val.replace(/[^0-9.-]/g, "")) : val
          if (isNaN(numVal)) return ""
          return `${numVal.toFixed(2)}%`
        }

        // Parse percentage string to number
        const parsePercentage = (str: string): number => {
          const cleaned = str.replace(/[^0-9.-]/g, "")
          const parsed = parseFloat(cleaned)
          return isNaN(parsed) ? 0 : parsed
        }

        const percentageDisplayValue = value !== undefined && value !== null ? formatPercentage(value as number) : ""

        return (
          <div className="relative">
            <Input
              type="text"
              placeholder={question.placeholder || "0.00%"}
              value={isPercentageFocused ? (value !== undefined && value !== null ? String(value as number) : "") : percentageDisplayValue}
              onChange={(e) => {
                const parsed = parsePercentage(e.target.value)
                onChange(parsed)
              }}
              onFocus={() => setIsPercentageFocused(true)}
              onBlur={() => setIsPercentageFocused(false)}
              className="pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
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
    <Card className={cn(
      "p-4 transition-all",
      isConditional && "border-l-4 border-l-counterpart-secondary bg-counterpart-secondary/30"
    )}>
      <FormItem>
        <div className="flex items-start justify-between gap-2 mb-2">
          <FormLabel className="flex-1">
            {question.title}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          {isConditional && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs border-counterpart-secondary text-counterpart-primary">
              <Link2 className="h-3 w-3" />
              Conditional
            </Badge>
          )}
        </div>
        {isConditional && dependentTitles.length > 0 && (
          <div className="mb-3 text-xs text-counterpart-primary/80 bg-counterpart-secondary/50 p-2 rounded border border-counterpart-secondary/50">
            <span className="font-medium">Depends on: </span>
            {dependentTitles.map((title, idx) => (
              <span key={idx}>
                {idx > 0 && ", "}
                <span className="italic">&quot;{title}&quot;</span>
              </span>
            ))}
          </div>
        )}
        <FormControl>{renderInput()}</FormControl>
        {question.help_text && (
          <FormDescription>{question.help_text}</FormDescription>
        )}
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    </Card>
  )
}
