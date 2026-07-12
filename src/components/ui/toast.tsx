import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-6 left-6 z-[100] flex max-h-screen w-full flex-col-reverse gap-3 sm:max-w-[380px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  [
    // base structure
    "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden",
    "rounded-2xl border px-4 py-3.5 pr-10",
    // transparent luxury glass
    "bg-white/[0.06] dark:bg-white/[0.04]",
    "backdrop-blur-2xl backdrop-saturate-150",
    "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.08)_inset]",
    // animation
    "transition-all duration-500 ease-out will-change-transform",
    "data-[state=open]:animate-toast-in",
    "data-[state=closed]:animate-toast-out",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease]",
    "data-[swipe=end]:animate-toast-out",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
  ],
  {
    variants: {
      variant: {
        default: "border-white/10 dark:border-white/[0.07] text-foreground",
        destructive: "border-rose-500/20 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// Status dot colors per variant
const dotVariants: Record<string, string> = {
  default: "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]",
  destructive: "bg-rose-400 shadow-[0_0_8px_2px_rgba(251,113,133,0.6)]",
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant = "default", children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {/* Status dot */}
      <span
        className={cn(
          "mt-[3px] h-2 w-2 shrink-0 rounded-full",
          dotVariants[variant ?? "default"],
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">{children}</div>

      {/* Thin progress bar at the bottom */}
      <span className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden rounded-b-2xl">
        <span
          className={cn(
            "block h-full origin-left animate-toast-progress",
            variant === "destructive"
              ? "bg-gradient-to-r from-rose-400/60 to-rose-300/20"
              : "bg-gradient-to-r from-primary/60 to-primary/10",
          )}
        />
      </span>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-transparent px-3 text-[10px] font-heading uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95 focus:outline-none disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-full p-1 text-foreground/30 opacity-0 transition-all hover:text-foreground hover:bg-white/10 active:scale-90 group-hover:opacity-100 focus:opacity-100",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-[13px] font-heading font-semibold tracking-tight leading-snug",
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "mt-0.5 text-[11px] font-medium text-muted-foreground/60 leading-relaxed tracking-wide",
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
