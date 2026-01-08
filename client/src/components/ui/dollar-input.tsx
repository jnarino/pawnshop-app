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
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(value.toString())

  const formatDisplay = (val: string) => {
    if (!val || val === '-') return val

    const isNegative = val.startsWith('-')
    const clean = val.replace(/[^\d.]/g, "")
    const parts = clean.split(".")

    const integer = parts[0]
    const decimal = parts[1]

    const withCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    const result = parts.length > 1 ? `${withCommas}.${decimal}` : withCommas

    return isNegative ? `-${result}` : result
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    const isNegative = inputValue.startsWith('-')
    inputValue = inputValue.replace(/[^\d.]/g, "")

    if (isNegative) {
      inputValue = '-' + inputValue
    }

    if ((inputValue.match(/\./g) || []).length > 1) {
      const firstDotIndex = inputValue.indexOf('.')
      const before = inputValue.slice(0, firstDotIndex + 1)
      const after = inputValue.slice(firstDotIndex + 1).replace(/\./g, '')
      inputValue = before + after
    }

    if (inputValue.includes(".")) {
      const [parts0, parts1] = inputValue.split(".")
      inputValue = parts0 + "." + parts1.substring(0, 2)
    }

    setInternalValue(inputValue)

    const displayValue = formatDisplay(inputValue)
    if (inputRef.current && inputRef.current.value !== displayValue) {
      inputRef.current.value = displayValue
    }

    onChange?.(inputValue)
  }

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
      if (stringVal !== internalValue) {
        setInternalValue(stringVal)
        if (inputRef.current) {
          inputRef.current.value = formatDisplay(stringVal)
        }
      }
    } else if (!value) {
      if (inputRef.current) {
        inputRef.current.value = ""
      }
      setInternalValue("")
    }
  }, [value, internalValue])

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          defaultValue={formatDisplay(value.toString())}
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
