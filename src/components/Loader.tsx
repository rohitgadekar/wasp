import { Loader2 } from "lucide-react";


export default function Loader() {
    return (
        <div className="flex h-[calc(100dvh-9rem)] items-center justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center">

                {/* Recessed circular track */}
                <div
                    className="
        absolute inset-0 rounded-full
        shadow-[
          inset_0_2px_3px_rgba(0,0,0,0.10),
          inset_0_-2px_3px_rgba(255,255,255,0.75),
          0_1px_2px_rgba(255,255,255,0.6)
        ]
      "
                />

                {/* Soft gold depth */}
                <div
                    className="
        absolute inset-[5px] rounded-full
        bg-[#C9A66B]/10
        blur-[4px]
      "
                />

                {/* Main embossed loader */}
                <Loader2
                    className="relative z-10 h-10 w-10 animate-spin"
                    style={{
                        color: '#C9A66B',
                        strokeWidth: 2.5,
                        filter: `
          drop-shadow(0 1px 1px rgba(120,90,45,0.28))
          drop-shadow(0 -1px 0 rgba(255,255,255,0.65))
        `,
                    }}
                />

                {/* Metallic highlight */}
                <div
                    className="
        pointer-events-none absolute inset-[11px]
        rounded-full
        bg-gradient-to-br
        from-white/35
        via-transparent
        to-[#9D7845]/10
      "
                />
            </div>
        </div>
    );
}