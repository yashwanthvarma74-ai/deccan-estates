import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "label inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-white bg-white text-bg hover:bg-white/90",
        outline: "border-white/40 bg-transparent text-white hover:bg-white hover:text-bg",
        quiet: "border-line bg-card text-ink hover:border-white/50",
        ghost: "border-transparent text-white hover:underline",
      },
      size: { default: "h-12 px-6", sm: "h-10 px-4", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
export { buttonVariants };
