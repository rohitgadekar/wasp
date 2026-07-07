
import { X, Sparkles, PartyPopper, Trophy, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FarewellBannerProps {
    onClose: () => void;
    className?: string;
}

export const FarewellBanner = ({ onClose, className }: FarewellBannerProps) => {
    return (
        <div className="fixed top-24 left-0 right-0 z-40 flex justify-center px-4 animate-in slide-in-from-top-4 duration-700 ease-out">
            <div className={cn(
                "relative group flex items-center gap-4 px-6 py-2.5 rounded-full",
                "bg-slate-950/80 backdrop-blur-xl",
                "border border-amber-500/30",
                "shadow-[0_0_40px_-10px_rgba(251,191,36,0.2)]",
                "hover:shadow-[0_0_50px_-10px_rgba(251,191,36,0.3)] transition-all duration-500",
                className
            )}>
                {/* Animated Gradient Border Effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-amber-200/10 to-transparent translate-x-[-100%] animate-[shimmer_4s_infinite] pointer-events-none" />

                {/* Left Icon with Glow */}
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-lg rounded-full animate-pulse" />
                    <div className="relative -ml-3 h-9 w-9 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Crown className="w-4 h-4 text-amber-950" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <span className="font-serif italic text-amber-200 text-base sm:text-lg whitespace-nowrap">
                        Welcome back, Akanksha!
                    </span>
                    <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-600" />
                    <span className="text-xs sm:text-sm font-light text-slate-300 tracking-wide flex items-center gap-2">
                        And a warm welcome to Namrata.
                        <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                    </span>
                </div>

                {/* Action / Close */}
                <div className="pl-4 border-l border-white/10 ml-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-6 w-6 rounded-full hover:bg-white/10 hover:text-white text-slate-400 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
