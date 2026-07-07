import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Code2, BookOpen, Medal, Award, TrendingUp, Terminal, Crown } from 'lucide-react';
import { SiJira as JiraIcon } from 'react-icons/si';
import { Loader2 } from 'lucide-react';
import { useTitle } from '@/hooks/use-title';
import { useQuery } from '@tanstack/react-query';

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    email: string;
    avatar?: string | null;
    code_count: number;
    wiki_count: number;
    maps_count: number;
    scripts_count: number;
    total: number;
}

// ── Palette tokens ──────────────────────────────────────────
const GOLD = { bg: 'rgba(197,168,128,0.12)', border: 'rgba(197,168,128,0.35)', text: '#8C7654', glow: 'rgba(197,168,128,0.25)', badge: '#C5A880', badgeText: '#2C241B' };
const SILVER = { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', text: '#64748B', glow: 'rgba(148,163,184,0.15)', badge: '#94A3B8', badgeText: '#fff' };
const BRONZE = { bg: 'rgba(180,120,60,0.08)', border: 'rgba(180,120,60,0.25)', text: '#92622A', glow: 'rgba(180,120,60,0.15)', badge: '#B4783C', badgeText: '#fff' };

const StatPill = ({ icon: Icon, value, label, color }: { icon: any; value: number; label: string; color: string }) => (
    <div className="flex flex-col items-center gap-0.5">
        <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
        >
            <Icon className="w-2.5 h-2.5" />
            {value}
        </div>
        <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: '#A59582' }}>{label}</span>
    </div>
);

const Leaderboard = () => {
    useTitle('Leaderboard');

    const EXCLUDED_EMAILS = [
        'rohit@apex.com',
        'pankaj@apex.com',
        'tschellenberg@spscommerce.com',
        'amit.gilda@bristlecone.com',
        'pankaj.patil@bristlecone.com',
        'aditya.sanjay.dahe@bristlecone.com'
    ].map(e => e.toLowerCase());

    const { data: leaderboard = [], isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar');
            if (!profiles) return [];

            const filteredProfiles = profiles.filter(profile =>
                !profile.email || !EXCLUDED_EMAILS.includes(profile.email.toLowerCase())
            );

            const { data: codeSnippets } = await supabase.from('code_snippets').select('author_id');
            const { data: wikiPages } = await supabase.from('wiki_pages').select('user_id');
            const { data: tickets } = await supabase.from('tickets').select('user_id');
            const { data: scripts } = await supabase.from('scripts').select('user_id');

            const leaderboardData: LeaderboardEntry[] = filteredProfiles.map(profile => {
                const codeCount = codeSnippets?.filter(s => s.author_id === profile.id).length || 0;
                const wikiCount = wikiPages?.filter(w => w.user_id === profile.id).length || 0;
                const mapsCount = tickets?.filter(t => t.user_id === profile.id).length || 0;
                const scriptsCount = scripts?.filter(s => s.user_id === profile.id).length || 0;

                return {
                    user_id: profile.id,
                    full_name: profile.full_name || 'Unknown',
                    email: profile.email || '',
                    avatar: profile.avatar,
                    code_count: codeCount,
                    wiki_count: wikiCount,
                    maps_count: mapsCount,
                    scripts_count: scriptsCount,
                    total: codeCount + wikiCount + mapsCount + scriptsCount,
                };
            });

            leaderboardData.sort((a, b) => b.total - a.total);
            return leaderboardData;
        },
    });

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin relative z-10" style={{ color: '#C5A880' }} />
                    <div className="absolute inset-0 blur-2xl animate-pulse rounded-full" style={{ background: 'rgba(197,168,128,0.2)' }} />
                </div>
            </div>
        );
    }

    // ── Podium card component ────────────────────────────────
    const PodiumCard = ({
        entry, rank, palette, size = 'md'
    }: {
        entry: LeaderboardEntry;
        rank: number;
        palette: typeof GOLD;
        size?: 'sm' | 'md' | 'lg';
    }) => {
        const isLg = size === 'lg';
        const avatarSize = isLg ? 'h-24 w-24' : 'h-20 w-20';
        const nameSize = isLg ? 'text-xl' : 'text-lg';
        const scoreSize = isLg ? 'text-5xl' : 'text-4xl';
        const rankLabels = ['GOLDEN APEX', 'SILVER VANGUARD', 'BRONZE PRODIGY'];

        const RankIcon = rank === 1 ? Crown : rank === 2 ? TrendingUp : Medal;

        return (
            <div
                className="rounded-2xl border overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                style={{
                    background: `linear-gradient(160deg, #FDFDFB 0%, ${palette.bg} 100%)`,
                    borderColor: palette.border,
                    boxShadow: `0 4px 24px ${palette.glow}`,
                }}
            >
                {/* Thin top accent */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(to right, transparent, ${palette.badge}, transparent)` }} />

                <div className="p-6 flex flex-col items-center gap-4 text-center">
                    {/* Rank badge */}
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: palette.badge }}
                    >
                        <RankIcon className="w-4 h-4" style={{ color: palette.badgeText }} />
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                        <Avatar className={`${avatarSize} border-2 shadow-lg`} style={{ borderColor: palette.border }}>
                            {entry.avatar ? (
                                <img src={entry.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <AvatarFallback
                                    className={`font-bold text-xl`}
                                    style={{ background: `${palette.badge}22`, color: palette.text }}
                                >
                                    {getInitials(entry.full_name)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        {/* Glow ring */}
                        <div
                            className="absolute inset-0 rounded-full blur-xl -z-10 scale-150"
                            style={{ background: palette.glow }}
                        />
                    </div>

                    {/* Name & email */}
                    <div className="space-y-0.5">
                        <h3 className={`font-bold ${nameSize} leading-tight`} style={{ color: '#2C241B' }}>
                            {entry.full_name}
                        </h3>
                        <p className="text-[10px] font-medium uppercase tracking-widest truncate max-w-[180px]" style={{ color: '#A59582' }}>
                            {entry.email}
                        </p>
                    </div>

                    {/* Stat pills */}
                    <div className="flex items-center gap-2 py-3 border-y w-full justify-center" style={{ borderColor: palette.border }}>
                        <StatPill icon={Code2} value={entry.code_count} label="Code" color="#8C7654" />
                        <StatPill icon={BookOpen} value={entry.wiki_count} label="Wiki" color="#5B7FA6" />
                        <StatPill icon={Terminal} value={entry.scripts_count} label="Scripts" color="#5A8A6A" />
                        <StatPill icon={JiraIcon} value={entry.maps_count} label="Jira" color="#7A5FA6" />
                    </div>

                    {/* Score */}
                    <div className="space-y-2">
                        <span className={`${scoreSize} font-bold leading-none block`} style={{ color: palette.text }}>
                            {entry.total}
                        </span>
                        <span
                            className="text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1 rounded-full"
                            style={{ background: `${palette.badge}22`, color: palette.text, border: `1px solid ${palette.border}` }}
                        >
                            {rankLabels[rank - 1]}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen">
            <div className="relative space-y-16 mx-auto p-6 md:p-10 max-w-5xl pb-20 z-10">

                {/* ── Page header badge ── */}
                <div className="flex justify-center">
                    <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold shadow-sm">
                        Hall of Fame
                    </Badge>
                </div>

                {/* ── Top 3 Podium ── */}
                {leaderboard.length > 0 && (
                    <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-8 w-full">

                        {/* 2nd Place — Silver */}
                        {leaderboard[1] && (
                            <div className="w-full md:w-72">
                                <PodiumCard entry={leaderboard[1]} rank={2} palette={SILVER} size="md" />
                            </div>
                        )}

                        {/* 1st Place — Gold (taller) */}
                        {leaderboard[0] && (
                            <div className="w-full md:w-80 md:-mt-10 order-first md:order-none">
                                <PodiumCard entry={leaderboard[0]} rank={1} palette={GOLD} size="lg" />
                            </div>
                        )}

                        {/* 3rd Place — Bronze */}
                        {leaderboard[2] && (
                            <div className="w-full md:w-72">
                                <PodiumCard entry={leaderboard[2]} rank={3} palette={BRONZE} size="md" />
                            </div>
                        )}
                    </div>
                )}

                {/* ── Elite Guard (4th+) ── */}
                {leaderboard.length > 3 && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {/* Section heading */}
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9)' }} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#A59582' }}>
                                The Elite Guard
                            </span>
                            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #E3DAC9)' }} />
                        </div>

                        {/* Rows */}
                        <div className="space-y-3">
                            {leaderboard.slice(3).map((entry, index) => {
                                const rank = index + 4;
                                return (
                                    <div
                                        key={entry.user_id}
                                        className="flex items-center gap-4 md:gap-5 p-4 md:p-5 rounded-xl border group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                                        style={{
                                            background: '#FDFDFB',
                                            borderColor: '#E3DAC9',
                                            boxShadow: '0 2px 12px rgba(44,36,27,0.05)',
                                        }}
                                    >
                                        {/* Rank number */}
                                        <div
                                            className="text-2xl font-bold italic tabular-nums w-10 text-center shrink-0 transition-colors"
                                            style={{ color: '#E3DAC9' }}
                                        >
                                            {rank < 10 ? `0${rank}` : rank}
                                        </div>

                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <Avatar className="h-11 w-11 border shadow-md transition-transform duration-300 group-hover:scale-110" style={{ borderColor: '#E3DAC9' }}>
                                                {entry.avatar ? (
                                                    <img src={entry.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    <AvatarFallback className="font-bold text-sm" style={{ background: 'rgba(197,168,128,0.12)', color: '#8C7654' }}>
                                                        {getInitials(entry.full_name)}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div
                                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                                style={{ background: '#FDFDFB', borderColor: '#E3DAC9' }}
                                            >
                                                <Award className="w-2.5 h-2.5" style={{ color: '#C5A880' }} />
                                            </div>
                                        </div>

                                        {/* Name & email */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate" style={{ color: '#2C241B' }}>{entry.full_name}</h3>
                                            <p className="text-[10px] font-medium truncate mt-0.5" style={{ color: '#A59582' }}>{entry.email}</p>
                                        </div>

                                        {/* Stat pills — hidden on small screens */}
                                        <div className="hidden lg:flex items-center gap-3 shrink-0">
                                            <StatPill icon={Code2} value={entry.code_count} label="Code" color="#8C7654" />
                                            <StatPill icon={BookOpen} value={entry.wiki_count} label="Wiki" color="#5B7FA6" />
                                            <StatPill icon={Terminal} value={entry.scripts_count} label="Scripts" color="#5A8A6A" />
                                            <StatPill icon={JiraIcon} value={entry.maps_count} label="Jira" color="#7A5FA6" />
                                        </div>

                                        {/* Total score */}
                                        <div
                                            className="text-right min-w-[72px] pl-4 shrink-0 border-l"
                                            style={{ borderColor: '#E3DAC9' }}
                                        >
                                            <div className="text-2xl font-bold leading-none transition-colors" style={{ color: '#C5A880' }}>
                                                {entry.total}
                                            </div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: '#A59582' }}>
                                                XP Rank
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Empty State ── */}
                {leaderboard.length === 0 && (
                    <div className="py-28 text-center max-w-sm mx-auto">
                        <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 blur-3xl rounded-full scale-150 animate-pulse" style={{ background: 'rgba(197,168,128,0.2)' }} />
                            <Award className="w-20 h-20 relative z-10" style={{ color: '#C5A880' }} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3" style={{ color: '#2C241B' }}>The Podium Awaits</h3>
                        <p className="text-sm font-medium leading-relaxed" style={{ color: '#A59582' }}>
                            No contributions recorded yet. Be the first to claim a seat in the Hall of Fame.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;