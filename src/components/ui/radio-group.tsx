import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
} | null>(null);

const RadioGroup = React.forwardRef<HTMLDivElement, any>(({ className, value, onValueChange, children, ...props }, ref) => {
    return (
        <RadioGroupContext.Provider value={{ value, onValueChange }}>
            <div className={cn("grid gap-2", className)} ref={ref} {...props}>
                {children}
            </div>
        </RadioGroupContext.Provider>
    )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLDivElement, any>(({ className, value, disabled, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext);
    const checked = ctx?.value === value;

    return (
        <div
            ref={ref}
            role="radio"
            aria-checked={checked}
            className={cn(
                "aspect-square h-4 w-4 rounded-full border border-primary flex items-center justify-center transition-all",
                checked ? "bg-primary border-primary" : "border-gray-400 bg-transparent",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled && ctx) ctx.onValueChange(value);
            }}
            {...props}
        >
            {checked && (
                <span className="h-1.5 w-1.5 bg-white dark:bg-zinc-900 rounded-full" />
            )}
        </div>
    )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
