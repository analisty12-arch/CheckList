import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
    value?: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

interface SelectProps {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
}

const Select = ({ children, value, onValueChange }: SelectProps) => {
    const [open, setOpen] = React.useState(false);

    const handleValueChange = (v: string) => {
        if (onValueChange) {
            onValueChange(v);
        }
        setOpen(false);
    };

    return (
        <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(({ className, children, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    return (
        <button
            ref={ref}
            type="button"
            onClick={() => ctx?.setOpen(!ctx.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <span className="h-4 w-4 opacity-50">▼</span>
        </button>
    )
})
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
    placeholder?: string;
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps & { children?: React.ReactNode }>(({ className, placeholder, children, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    return (
        <span ref={ref} className={className} {...props}>
            {children || ctx?.value || placeholder}
        </span>
    )
})
SelectValue.displayName = "SelectValue"

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
    position?: "popper" | "item-aligned";
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(({ className, children, position = "popper", ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    if (!ctx?.open) return null;
    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 w-full mt-1 bg-white dark:bg-zinc-900",
                className
            )}
            {...props}
        >
            <div className="p-1">{children}</div>
        </div>
    )
})
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
    children: React.ReactNode;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(({ className, children, value, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    return (
        <div
            ref={ref}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                if (ctx) ctx.onValueChange(value);
            }}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {ctx?.value === value && <span>✓</span>}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
