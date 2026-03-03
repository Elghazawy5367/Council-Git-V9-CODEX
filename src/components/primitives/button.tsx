import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/variants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  intent?: string; // 2026: AI-generated intent explanation
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, intent, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Auto-generate ARIA label if not provided, using intent if available
    const ariaLabel = props["aria-label"] || (intent ? `Action: ${intent}` : undefined);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        aria-label={ariaLabel}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
