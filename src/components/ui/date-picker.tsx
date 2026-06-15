import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Show a clear (x) button when a value is set. */
  clearable?: boolean;
  className?: string;
}

/** Single-date picker built from Popover + Calendar (shadcn pattern). */
export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  disabled,
  clearable = true,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-start gap-2 px-3 font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="flex-1 truncate text-left">
            {value ? format(value, "dd/MM/yyyy") : placeholder}
          </span>
          {clearable && value ? (
            <X
              className="size-4 shrink-0 opacity-60 hover:opacity-100"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(undefined);
              }}
            />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
