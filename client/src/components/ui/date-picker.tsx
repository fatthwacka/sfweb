import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false
}: DatePickerProps) {
  const [showCalendar, setShowCalendar] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDateClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker?.();
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      onDateChange?.(new Date(dateValue));
    } else {
      onDateChange?.(undefined);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground",
          className
        )}
        disabled={disabled}
        onClick={handleDateClick}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? date.toLocaleDateString() : <span>{placeholder}</span>}
      </Button>
      <Input
        ref={inputRef}
        type="date"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={handleDateChange}
        disabled={disabled}
        value={date ? date.toISOString().split('T')[0] : ''}
      />
    </div>
  )
}