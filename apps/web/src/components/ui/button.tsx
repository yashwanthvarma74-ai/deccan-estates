import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Marketing CTAs are pills; utility buttons (nav, filters) use an 8px radius with a hairline. */
const buttonVariants = cva(
  "label inline-flex cursor-pointer items-center justify-center gap-2 transition-[background-color,transform,border-color] active:scale-95 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-full bg-primary text-white hover:bg-primary-active",
        secondary: "rounded-full bg-white text-ink shadow-soft hover:bg-canvas-soft",
        outline: "rounded-lg border border-hairline bg-white text-ink hover:bg-canvas-soft",
        quiet: "rounded-lg border border-hairline bg-white text-ink hover:bg-canvas-soft",
        ghost: "text-primary hover:underline",
      },
      size: { default: "h-11 px-6", sm: "h-9 px-4", icon: "h-10 w-10 rounded-full" },
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
