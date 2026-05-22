"use client";

import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, glowOnHover = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={glowOnHover ? { y: -4, transition: { duration: 0.2 } } : undefined}
        className={cn(
          "glass-card rounded-2xl p-6",
          glowOnHover && "hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";

export { Card };
