import { AnswerValue, ExpressionObject } from "./types"

/**
 * Converts Python-style boolean strings to JavaScript booleans
 */
function normalizeValue(value: any): any {
  if (typeof value === "string") {
    if (value === "True") return true
    if (value === "False") return false
    // Remove quotes if present
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      return value.slice(1, -1)
    }
  }
  return value
}

/**
 * Resolves a variable reference (e.g., "$is_not_for_profit_org") to its value from answers
 */
function resolveVariable(variable: string, answers: Record<string, AnswerValue>): any {
  if (!variable.startsWith("$")) {
    return normalizeValue(variable)
  }
  
  const key = variable.slice(1) // Remove $ prefix
  const value = answers[key]
  
  if (value === undefined || value === null) {
    return null
  }
  
  return normalizeValue(value)
}

/**
 * Evaluates an object expression (e.g., { "$eq": ["$is_not_for_profit_org", "Yes"] })
 */
export function evaluateObjectExpression(
  expression: ExpressionObject,
  answers: Record<string, AnswerValue>
): boolean {
  if (typeof expression === "string") {
    const resolved = resolveVariable(expression, answers)
    return Boolean(resolved)
  }
  
  if (typeof expression === "boolean") {
    return expression
  }
  
  if (typeof expression === "number") {
    return Boolean(expression)
  }
  
  if (Array.isArray(expression)) {
    return expression.length > 0
  }
  
  if (typeof expression !== "object" || expression === null) {
    return false
  }
  
  // Handle $eq operator
  if ("$eq" in expression) {
    const [left, right] = expression.$eq
    const leftValue = typeof left === "object" && left !== null && !Array.isArray(left)
      ? evaluateObjectExpression(left, answers)
      : resolveVariable(left as string, answers)
    const rightValue = normalizeValue(right)
    return leftValue === rightValue
  }
  
  // Handle $ne operator
  if ("$ne" in expression) {
    const [left, right] = expression.$ne
    const leftValue = typeof left === "object" && left !== null && !Array.isArray(left)
      ? evaluateObjectExpression(left, answers)
      : resolveVariable(left as string, answers)
    const rightValue = normalizeValue(right)
    return leftValue !== rightValue
  }
  
  // Handle $and operator
  if ("$and" in expression) {
    return expression.$and.every((expr) => evaluateObjectExpression(expr, answers))
  }
  
  // Handle $or operator
  if ("$or" in expression) {
    return expression.$or.some((expr) => evaluateObjectExpression(expr, answers))
  }
  
  // Handle $not operator
  if ("$not" in expression) {
    return !evaluateObjectExpression(expression.$not, answers)
  }
  
  // Empty object evaluates to false
  if (Object.keys(expression).length === 0) {
    return false
  }
  
  return false
}

/**
 * Tokenizes a string expression for parsing
 */
function tokenizeExpression(expression: string): string[] {
  const tokens: string[] = []
  let current = ""
  let inQuotes = false
  let quoteChar = ""
  
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i]
    
    if ((char === "'" || char === '"') && !inQuotes) {
      inQuotes = true
      quoteChar = char
      if (current.trim()) {
        tokens.push(current.trim())
        current = ""
      }
      current += char
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false
      current += char
      tokens.push(current)
      current = ""
      quoteChar = ""
    } else if (!inQuotes && (char === "(" || char === ")" || char === " ")) {
      if (current.trim()) {
        tokens.push(current.trim())
        current = ""
      }
      if (char === "(" || char === ")") {
        tokens.push(char)
      }
    } else {
      current += char
    }
  }
  
  if (current.trim()) {
    tokens.push(current.trim())
  }
  
  return tokens.filter((t) => t.length > 0)
}

/**
 * Evaluates a string expression (e.g., "($is_not_for_profit_org == 'Yes')")
 */
export function evaluateStringExpression(
  expression: string,
  answers: Record<string, AnswerValue>
): boolean {
  if (!expression || expression.trim() === "") {
    return true
  }
  
  // Remove outer parentheses if present
  let expr = expression.trim()
  while (expr.startsWith("(") && expr.endsWith(")") && 
         (expr.match(/\(/g) || []).length === (expr.match(/\)/g) || []).length) {
    expr = expr.slice(1, -1).trim()
  }
  
  const tokens = tokenizeExpression(expr)
  
  // Handle simple comparisons: $var == 'value' or $var != 'value'
  if (tokens.length === 3) {
    const [left, op, right] = tokens
    if (op === "==" || op === "!=") {
      const leftValue = resolveVariable(left, answers)
      const rightValue = normalizeValue(right.replace(/^['"]|['"]$/g, ""))
      
      if (op === "==") {
        return leftValue === rightValue
      } else {
        return leftValue !== rightValue
      }
    }
  }
  
  // Handle or/and operators
  const orIndex = tokens.indexOf("or")
  if (orIndex !== -1) {
    const left = tokens.slice(0, orIndex).join(" ")
    const right = tokens.slice(orIndex + 1).join(" ")
    return (
      evaluateStringExpression(left, answers) ||
      evaluateStringExpression(right, answers)
    )
  }
  
  const andIndex = tokens.indexOf("and")
  if (andIndex !== -1) {
    const left = tokens.slice(0, andIndex).join(" ")
    const right = tokens.slice(andIndex + 1).join(" ")
    return (
      evaluateStringExpression(left, answers) &&
      evaluateStringExpression(right, answers)
    )
  }
  
  // Handle parenthesized expressions
  let parenStart = -1
  let parenDepth = 0
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === "(") {
      if (parenDepth === 0) parenStart = i
      parenDepth++
    } else if (tokens[i] === ")") {
      parenDepth--
      if (parenDepth === 0 && parenStart !== -1) {
        const innerExpr = tokens.slice(parenStart + 1, i).join(" ")
        const innerResult = evaluateStringExpression(innerExpr, answers)
        const newTokens = [
          ...tokens.slice(0, parenStart),
          innerResult ? "True" : "False",
          ...tokens.slice(i + 1),
        ]
        return evaluateStringExpression(newTokens.join(" "), answers)
      }
    }
  }
  
  // Handle single variable or value
  if (tokens.length === 1) {
    const value = resolveVariable(tokens[0], answers)
    return Boolean(value)
  }
  
  // Default: try to evaluate as a simple comparison
  if (tokens.length >= 3) {
    // Try to find operator
    for (let i = 1; i < tokens.length - 1; i++) {
      if (tokens[i] === "==" || tokens[i] === "!=") {
        const left = tokens.slice(0, i).join(" ")
        const right = tokens.slice(i + 1).join(" ")
        const leftValue = resolveVariable(left, answers)
        const rightValue = normalizeValue(right.replace(/^['"]|['"]$/g, ""))
        
        if (tokens[i] === "==") {
          return leftValue === rightValue
        } else {
          return leftValue !== rightValue
        }
      }
    }
  }
  
  return false
}

/**
 * Evaluates a dependant_on expression (can be string or object)
 */
export function evaluateDependantOn(
  dependantOn: string | null | undefined,
  answers: Record<string, AnswerValue>
): boolean {
  if (!dependantOn) {
    return true
  }
  
  // If it's a string, use string evaluator
  if (typeof dependantOn === "string") {
    return evaluateStringExpression(dependantOn, answers)
  }
  
  // If it's an object, use object evaluator
  return evaluateObjectExpression(dependantOn as ExpressionObject, answers)
}
