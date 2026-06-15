import "react-day-picker/style.css";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Thin wrapper around react-day-picker. Uses the library's default stylesheet
 * and themes the accent via CSS variables so it follows the app palette.
 */
function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      style={
        {
          "--rdp-accent-color": "var(--primary)",
          "--rdp-accent-background-color": "var(--primary)",
          "--rdp-today-color": "var(--primary)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Calendar };
