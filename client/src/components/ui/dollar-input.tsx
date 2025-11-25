"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface DollarInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value?: string | number
  onChange?: (value: string) => void
  label?: string
  error?: string
}

export function DollarInput({ value = "", onChange, label, error, className, disabled, ...props }: DollarInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [internalValue, setInternalValue] = useState(value.toString())

  // Format display: add commas to integers, show decimals
  const formatDisplay = (val: string) => {
    if (!val) return ""

    // Extract only numbers and one dot
    const clean = val.replace(/[^\d.]/g, "")
    const parts = clean.split(".")

    // Handle integer part
    const integer = parts[0]
    const decimal = parts[1]

    // Add thousands separator to integer part
    const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    // Reconstruct with decimal if it exists (even if empty)
    if (parts.length > 1) {
      return `${withCommas}.${decimal}`
    }

    return withCommas
  }

  // Handle input change - format as user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    // Only allow numbers and dots
    inputValue = inputValue.replace(/[^\d.]/g, "")

    // Prevent multiple dots
    if (inputValue.includes(".")) {
      const dotIndex = inputValue.indexOf(".")
      const beforeDot = inputValue.substring(0, dotIndex)
      const afterDot = inputValue.substring(dotIndex + 1).replace(/\./g, "")
      inputValue = beforeDot + "." + afterDot
    }

    // Limit to 2 decimal places
    if (inputValue.includes(".")) {
      const [integer, decimal] = inputValue.split(".")
      inputValue = integer + "." + decimal.substring(0, 2)
    }

    setInternalValue(inputValue)

    // Only update the display value directly if it's different (avoids cursor jumping usually, but here we want to format)
    const displayValue = formatDisplay(inputValue)
    if (inputRef.current && inputRef.current.value !== displayValue) {
      // We need to be careful about cursor position, but for this simple case replacing value works
      // However, to support typing '.', we must ensure formatDisplay returns it with the dot
      inputRef.current.value = displayValue
    }

    onChange?.(inputValue)
  }

  // Format on blur - ensure .00 if no decimals were entered
  const handleBlur = () => {
    if (internalValue && !internalValue.includes(".")) {
      const formatted = internalValue + ".00"
      setInternalValue(formatted)
      if (inputRef.current) {
        inputRef.current.value = formatDisplay(formatted)
      }
      onChange?.(formatted)
    } else if (internalValue && internalValue.includes(".")) {
      const [integer, decimal] = internalValue.split(".")
      const paddedDecimal = (decimal || "").padEnd(2, "0").substring(0, 2)
      const formatted = integer + "." + paddedDecimal
      setInternalValue(formatted)
      if (inputRef.current) {
        inputRef.current.value = formatDisplay(formatted)
      }
      onChange?.(formatted)
    }
    props.onBlur?.({} as React.FocusEvent<HTMLInputElement>)
  }

  useEffect(() => {
    if (value !== undefined && value !== null) {
      const stringVal = value.toString()
      // Only update if the value is different from internal state to avoid cursor jumps during typing
      // But we need to handle external updates
      if (stringVal !== internalValue) {
        setInternalValue(stringVal)
        if (inputRef.current) {
          inputRef.current.value = formatDisplay(stringVal)
        }
      }
    } else if (inputRef.current && !value) {
      inputRef.current.value = ""
      setInternalValue("")
    }
  }, [value])

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="1,000.00"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive/50",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}
