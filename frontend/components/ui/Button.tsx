"use client";

import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  withShimmer?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", children, className, withShimmer = false, ...props },
    ref
  ) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 overflow-hidden outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-[var(--accent-primary)] text-white hover:bg-[#4f46e5] shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]",
      secondary: "bg-[var(--surface)] text-white border border-[var(--border)] hover:bg-[var(--card)] hover:border-[rgba(255,255,255,0.1)]",
      outline: "bg-transparent text-white border border-white/20 hover:bg-white/5",
      ghost: "bg-transparent text-[var(--text-muted)] hover:text-white hover:bg-white/5",
      glass: "glass hover:bg-white/10 text-white",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm rounded-full",
      md: "h-11 px-6 text-base rounded-full",
      lg: "h-14 px-8 text-lg rounded-full",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        
        {withShimmer && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-shimmer z-0" />
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button };
