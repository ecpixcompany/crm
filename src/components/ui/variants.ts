import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30 shadow-sm",
        outline:
          "border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white [a&]:hover:bg-slate-800",
        primary:
          "bg-unimeta-red text-white [a&]:hover:bg-unimeta-red-dark",
        secondary:
          "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/70 [a&]:hover:bg-slate-200/60",
        destructive:
          "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15 [a&]:hover:bg-rose-100",
        success:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15 [a&]:hover:bg-emerald-100",
        warning:
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15 [a&]:hover:bg-amber-100",
        info:
          "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10 [a&]:hover:bg-blue-100",
        violet:
          "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/15 [a&]:hover:bg-violet-100",
        outline:
          "border-slate-300 text-foreground [a&]:hover:bg-slate-50",
        ghost: "[a&]:hover:bg-slate-100 [a&]:hover:text-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
