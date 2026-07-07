import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, Link as LinkIcon, Bookmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

interface QuickLink {
    id: string;
    title: string;
    url: string;
}

export const QuickLinks = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const panelRef = useRef<HTMLDivElement>(null);

    // Fetch quick links
    const { data: quickLinks = [] } = useQuery({
        queryKey: ['quick_links', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('quick_links')
                .select('id, title, url')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: true });
            return data as QuickLink[];
        },
        enabled: !!user,
    });

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    if (!user || quickLinks.length === 0) return null;

    return (
        <div className="fixed bottom-[6rem] right-6 z-50 select-none">
            {/* Floating Button / Hub Trigger */}
            {!isOpen ? (
                <div className="relative group">
                    <Button
                        onClick={() => setIsOpen(true)}
                        variant="outline"
                        className="h-14 w-14 rounded-full border shadow-xl relative flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all duration-300 bg-[#FDFDFB] hover:bg-[#FAF9F5] hover:text-[#2C241B]"
                        style={{ borderColor: '#E3DAC9', boxShadow: '0 8px 32px rgba(197,168,128,0.18)' }}
                        size="icon"
                    >
                        <Bookmark className="h-6 w-6 text-[#C5A880] group-hover:rotate-12 transition-transform duration-500" />
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-[#FDFDFB] border-2 border-[#FDFDFB] animate-in zoom-in duration-500"
                            style={{ background: '#C5A880' }}>
                            {quickLinks.length}
                        </span>
                    </Button>
                </div>
            ) : (
                /* Nexus Shortcuts Panel */
                <div ref={panelRef} className="animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <Card className="w-80 overflow-hidden rounded-[2rem] border" style={{ background: '#FDFDFB', borderColor: '#E3DAC9', boxShadow: '0 20px 60px rgba(197,168,128,0.18), 0 1px 0 #E3DAC9' }}>
                        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: '#E3DAC9', background: '#FAF9F5' }}>
                            <div className="flex items-center gap-3">
                                <Bookmark className="h-4 w-4 text-[#C5A880]" />
                                <div className="flex flex-col">
                                    <h1 className="font-sans font-bold text-sm tracking-[0.1em] uppercase text-[#2C241B]">Nexus Shortcuts</h1>
                                    <span className="text-[9px] font-bold text-[#8C7654] tracking-widest uppercase">
                                        Rapid Navigation Hub
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 rounded-full hover:bg-[#F3EEE3] text-[#8C7654] hover:text-[#2C241B] active:scale-90 transition-all"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="max-h-72 overflow-y-auto p-3 custom-scrollbar">
                            <div className="space-y-1">
                                {quickLinks.map((link) => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between rounded-xl p-3.5 hover:bg-[#FAF9F5] border border-transparent hover:border-[#E3DAC9] transition-all duration-200 cursor-pointer"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <div className="flex items-center gap-3 truncate">

                                            <span className="text-sm font-sans font-bold tracking-tight text-[#2C241B] truncate capitalize">
                                                {link.title.toLowerCase()}
                                            </span>
                                        </div>
                                        <ExternalLink className="h-3 w-3 text-[#A59582]/40 group-hover:text-[#C5A880] transition-colors flex-shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t" style={{ borderColor: '#E3DAC9', background: '#FAF9F5' }}>
                            <div className="flex items-center justify-center gap-2 py-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#C5A880] animate-pulse" />
                                <span className="text-[9px] font-sans font-bold tracking-[0.15em] uppercase text-[#8C7654]">
                                    {quickLinks.length} Operational Pathways
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};