import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
        <button
            ref={ref}
            type="button" // Prevent form submission
            role="checkbox"
            aria-checked={checked}
            className={cn(
                "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                checked ? "bg-primary text-primary-foreground" : "border-gray-400 bg-transparent",
                className
            )}
            onClick={() => onCheckedChange?.(!checked)}
            {...props}
        >
            {checked && (
                <span className="flex items-center justify-center text-current text-xs font-bold">
                    ✓
                </span>
            )}
        </button>
    )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
