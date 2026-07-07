import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Sparkles } from 'lucide-react';

export const NyraFloatingButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Don't show if user is not logged in or if already on the ai-agent page
    if (!user || location.pathname === '/ai-agent') return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 select-none">
            <div className="relative group">
                {/* Soft gold glow */}
                <div className="absolute inset-0 rounded-full bg-[#C5A880]/20 blur-xl group-hover:bg-[#C5A880]/40 transition-all duration-500" />
                <Button
                    onClick={() => navigate('/ai-agent')}
                    variant="outline"
                    className="h-14 w-14 rounded-full border shadow-xl relative flex flex-col items-center justify-center gap-0.5 group-hover:scale-110 active:scale-95 transition-all duration-300 bg-[#FDFDFB] hover:bg-[#FAF9F5] hover:text-[#2C241B] p-0"
                    style={{
                        borderColor: '#E3DAC9',
                        boxShadow: '0 8px 32px rgba(197,168,128,0.22)',
                    }}
                    title="Ask Nyra"
                >
                    <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#8C7654]">Nyra</span>
                </Button>
            </div>
        </div>
    );
};
