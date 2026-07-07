import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-left"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:glass-card group-[.toaster]:rounded-[2rem] group-[.toaster]:border-white/20 group-[.toaster]:dark:border-white/10 group-[.toaster]:text-foreground group-[.toaster]:shadow-3xl group-[.toaster]:backdrop-blur-3xl group-[.toaster]:p-6",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:font-bold group-[.toast]:text-xs group-[.toast]:uppercase group-[.toast]:tracking-widest",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-full group-[.toast]:font-black group-[.toast]:px-6",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-full",
          title: "group-[.toast]:font-black group-[.toast]:text-base group-[.toast]:tracking-tight",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
