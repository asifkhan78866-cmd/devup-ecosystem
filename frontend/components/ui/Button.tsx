import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost" | "glass" }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-50 disabled:pointer-events-none px-6 py-3",
        {
          "bg-white text-black hover:bg-white/90 hover:scale-105 active:scale-95": variant === "default",
          "border border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20": variant === "outline",
          "hover:bg-white/10 hover:text-white": variant === "ghost",
          "glass hover:bg-white/5": variant === "glass",
        },
        className
      )}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
