import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AppSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AppSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  triggerId?: string;
}

/**
 * Thin convenience wrapper over the shadcn Select for the common
 * "value + options" case used by filters and forms.
 *
 * Note: Radix Select forbids an item with value="". For "all"/"none" options
 * use a sentinel value (e.g. "ALL") and map it back at the call site.
 */
export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  size = "default",
  className,
  triggerId,
}: AppSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={triggerId} size={size} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
