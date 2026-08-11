import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface NotFoundProps {
  title?: string;
  description?: string;
  cta?: string;
  href?: string;
  className?: string;
}

const NotFound = ({
  title = "This blueprint was never drawn.",
  description = "The page you're looking for isn't in the archive. It may have been moved, renamed, or it never existed at all.",
  cta = "Return to the Archive",
  href = "/",
  className = "",
}: NotFoundProps) => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);


  return (
    <div
      className={`relative grid min-h-screen w-full place-items-center px-4 py-16 ${className}`}

    >
      <div className="relative w-full max-w-lg motion-safe:animate-[fadeIn_0.6s_ease-out]">

        <div className="border border-[#B08D57]/30 bg-[#101315]/90 px-8 py-12 text-center backdrop-blur-sm sm:px-14 sm:py-16 rounded-[2em]">
          {/* diamond mark */}
          <div className="mx-auto mb-8 h-3 w-3 rotate-45 border border-[#B08D57]" />

          <p
            className="mb-3 text-[11px] font-medium uppercase tracking-[0.35em] text-[#B08D57]"
            style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}
          >
            Drawing Not On File
          </p>

          <div
            className="mb-6 text-7xl font-medium tracking-tight text-[#EDE7DC] sm:text-8xl"
            style={{ fontFamily: "'Cormorant Garamond', ui-serif, Georgia, serif" }}
          >
            404
          </div>

          <h1
            className="mb-4 text-2xl italic text-[#EDE7DC] sm:text-3xl"
            style={{ fontFamily: "'Cormorant Garamond', ui-serif, Georgia, serif" }}
          >
            {title}
          </h1>

          <p
            className="mx-auto mb-10 max-w-sm text-sm leading-relaxed text-[#8B8F92]"
            style={{ fontFamily: "'Inter', ui-sans-serif, system-ui" }}
          >
            {description}
          </p>

          <a href={href} className="inline-block">
            <Button
              variant="default"
              className=" border-[#B08D57] bg-transparent px-8 py-5 text-xs font-medium uppercase tracking-[0.2em] text-[#EDE7DC] transition-colors duration-300 hover:bg-[#B08D57] hover:text-[#0B0D0C] focus-visible:ring-2 focus-visible:ring-[#B08D57] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D0C] motion-reduce:transition-none"
              style={{ fontFamily: "'Inter', ui-sans-serif, system-ui" }}
            >
              {cta}
            </Button>
          </a>

          {/* title block footer */}
          <div
            className="mt-12 grid grid-cols-2 gap-y-4 border-t border-[#B08D57]/20 pt-5 text-left text-[10px] uppercase tracking-wider sm:grid-cols-4"
            style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}
          >
            <div>
              <div className="text-[#5C5F61]">Sheet</div>
              <div className="text-[#B08D57]">A-404</div>
            </div>
            <div>
              <div className="text-[#5C5F61]">Status</div>
              <div className="text-[#B08D57]">Not Found</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[#5C5F61]">Requested</div>
              <div className="truncate text-[#B08D57]" title={location.pathname}>
                {location.pathname}
              </div>
            </div>
            <div>
              <div className="text-[#5C5F61]">Scale</div>
              <div className="text-[#B08D57]">N/A</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;