// src/pages/DailyStatus.tsx → FINAL PRODUCTION VERSION (Optional Submission)
import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarWithDots } from '@/components/ui/custom-calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';
import { Download, FileSpreadsheet, Image, Share2, Plus, Trash2, Mail, Palmtree, TrendingUp } from 'lucide-react';
import { SiChinaeasternairlines } from "react-icons/si";
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { GiAvoidance } from "react-icons/gi";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/hooks/use-title';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface TaskStatus {
    id: string;
    user_id: string;
    date: string;
    new_dev: string[];
    updates: string[];
    profiles?: { full_name: string };
}

interface DayStats {
    total: number;
    new_dev: number;
    updates: number;
}

interface Leave {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    type: string;
}


const isValidCase = (link: string) => {
    const val = link.trim().toLowerCase();
    return (
        val !== '' &&
        val !== 'na' &&
        val !== 'n/a' &&
        !val.includes('leave') &&
        !val.includes('exercise') &&
        val.includes('atlassian.spscommerce.com/browse/')
    );
};

const StatusViewer = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const { user } = useAuth();

    // URL-first date management
    const dateParam = searchParams.get('date');
    const selectedDate = useMemo(() => {
        if (dateParam) {
            const parsed = parseISO(dateParam);
            if (isValid(parsed)) return parsed;
        }
        return new Date();
    }, [dateParam]);

    const [viewDate, setViewDate] = useState<Date>(selectedDate);
    const [trendRange, setTrendRange] = useState<'week' | 'month'>('week');

    const exportRef = useRef<HTMLDivElement>(null);

    // Keep viewDate (month view) in sync with selectedDate when it's updated via URL
    useEffect(() => {
        setViewDate(selectedDate);
    }, [selectedDate]);

    // Ensure date is in URL on initial load if missing
    useEffect(() => {
        if (!dateParam) {
            const dateStr = format(new Date(), 'yyyy-MM-dd');
            setSearchParams({ date: dateStr }, { replace: true });
        }
    }, [dateParam, setSearchParams]);

    const handleDateSelect = (d: Date | undefined) => {
        if (d) {
            const dateStr = format(d, 'yyyy-MM-dd');
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('date', dateStr);
                return next;
            }, { replace: true });
        }
    };

    useTitle(`Logs - ${format(selectedDate, 'EEEE do, yyyy')}`);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const EXCLUDED_EMAILS = useMemo(() => [
        'rohit@apex.com',
        'pankaj@apex.com',
        'tschellenberg@spscommerce.com',
        'amit.gilda@bristlecone.com',
        'pankaj.patil@bristlecone.com'
    ].map(e => e.toLowerCase()), []);

    // Fetch daily task statuses
    const { data: taskStatuses = [], isLoading: loadingTable } = useQuery({
        queryKey: ['daily_task_status_viewer', dateStr],
        queryFn: async () => {
            const { data } = await supabase
                .from('daily_task_status')
                .select('*, profiles(full_name)')
                .eq('date', dateStr)
                .order('created_at', { ascending: false });
            return (data as TaskStatus[]) || [];
        },
    });

    // Fetch month stats with TanStack Query
    const { data: monthStats = {}, isLoading: loadingChart } = useQuery({
        queryKey: ['month_stats_viewer', viewDate.getFullYear(), viewDate.getMonth()],
        queryFn: async () => {
            // Fetch data from 30 days before the current month to ensure trend charts have previous month's data
            const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
            start.setDate(start.getDate() - 30);
            const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

            const { data } = await supabase
                .from('daily_task_status')
                .select('date, user_id, new_dev, updates, profiles(email)')
                .gte('date', format(start, 'yyyy-MM-dd'))
                .lte('date', format(end, 'yyyy-MM-dd'));

            const stats: Record<string, DayStats> = {};
            data?.forEach(item => {
                const email = (item.profiles as any)?.email?.toLowerCase();
                if (email && EXCLUDED_EMAILS.includes(email)) return;

                if (!stats[item.date]) stats[item.date] = { total: 0, new_dev: 0, updates: 0 };
                const newDev = item.new_dev?.filter(isValidCase).length || 0;
                const updates = item.updates?.filter(isValidCase).length || 0;
                stats[item.date].new_dev += newDev;
                stats[item.date].updates += updates;
                stats[item.date].total += newDev + updates;
            });
            return stats;
        },
    });

    // Fetch profiles (with email for exclusion filtering)
    const { data: allProfiles = [], isLoading: loadingProfiles } = useQuery({
        queryKey: ['profiles_viewer'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
            return data || [];
        },
    });

    // Memoized filtered task statuses — excludes specified emails globally
    const filteredTaskStatuses = useMemo(() => {
        const excludedIds = new Set(
            allProfiles
                .filter(p => EXCLUDED_EMAILS.includes((p as any).email?.toLowerCase() || ''))
                .map(p => p.id)
        );
        return taskStatuses.filter(status => !excludedIds.has(status.user_id));
    }, [taskStatuses, allProfiles, EXCLUDED_EMAILS]);

       // Fetch leaves for selected date
       const { data: leavesForDate = [] } = useQuery({
        queryKey: ['team_leaves', dateStr],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('team_leaves')
                .select('id, user_id, start_date, end_date, type')
                .lte('start_date', dateStr)
                .gte('end_date', dateStr);

            if (error) throw error;
            return data as Leave[];
        },
    });

    const leaveTypeByUserId = useMemo(() => {
        const map: Record<string, string> = {};
        leavesForDate.forEach(leave => {
            map[leave.user_id] = leave.type;
        });
        return map;
    }, [leavesForDate]);

    

    // Fetch holidays for Viewer
    const { data: holidays = {} } = useQuery({
        queryKey: ['holidays_viewer', viewDate.getFullYear(), viewDate.getMonth()],
        queryFn: async () => {
            const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
            const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
            const { data } = await supabase
                .from('holidays' as any)
                .select('date, description')
                .gte('date', format(start, 'yyyy-MM-dd'))
                .lte('date', format(end, 'yyyy-MM-dd'));

            const map: Record<string, string> = {};
            data?.forEach((h: any) => map[h.date] = h.description);
            return map;
        }
    });

    // Calculations — use filteredTaskStatuses as the source of truth
    const dayStats = useMemo(() => {
        if (filteredTaskStatuses?.length > 0) {
            let newDevCount = 0;
            let updatesCount = 0;

            filteredTaskStatuses.forEach(status => {
                newDevCount += (status.new_dev || []).filter(isValidCase).length;
                updatesCount += (status.updates || []).filter(isValidCase).length;
            });

            return {
                total: newDevCount + updatesCount,
                new_dev: newDevCount,
                updates: updatesCount
            };
        }
        return monthStats[dateStr] || { total: 0, new_dev: 0, updates: 0 };
    }, [filteredTaskStatuses, monthStats, dateStr]);

    const chartData = [{ name: format(selectedDate, 'MMM do, yyyy'), new_dev: dayStats.new_dev, updates: dayStats.updates, total: dayStats.total }];

    const individualData = useMemo(() => {
        return filteredTaskStatuses
            .map(status => {
                const newDev = (status.new_dev || []).filter(isValidCase).length;
                const updates = (status.updates || []).filter(isValidCase).length;
                const total = newDev + updates;
                const isLeave = [...(status.new_dev || []), ...(status.updates || [])]
                    .some(l => l.toLowerCase().includes('leave'));

                return {
                    name: (status.profiles?.full_name || 'Anonymous').split(' ')[0],
                    fullName: status.profiles?.full_name || 'Anonymous',
                    new_dev: newDev,
                    updates: updates,
                    total: total,
                    isLeave
                };
            })
            .filter(d => !d.isLeave)
            .sort((a, b) => b.total - a.total);
    }, [filteredTaskStatuses]);

    const distributionData = useMemo(() => [
        { name: 'New Dev', value: dayStats.new_dev, color: '#C5A059' },
        { name: 'Updates', value: dayStats.updates, color: '#8E7036' }
    ].filter(d => d.value > 0), [dayStats]);

    const memberContributionData = useMemo(() => {
        return filteredTaskStatuses
            .map(status => {
                const newDev = (status.new_dev || []).filter(isValidCase).length;
                const updates = (status.updates || []).filter(isValidCase).length;
                const isLeave = [...(status.new_dev || []), ...(status.updates || [])]
                    .some(l => l.toLowerCase().includes('leave'));

                return {
                    name: (status.profiles?.full_name || 'Anonymous').split(' ')[0],
                    fullName: status.profiles?.full_name || 'Anonymous',
                    value: newDev + updates,
                    isLeave
                };
            })
            .filter(d => !d.isLeave && d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [filteredTaskStatuses]);

    const separatedStatuses = useMemo(() => {
        const active = [];
        const onLeave = [];

        filteredTaskStatuses.forEach(status => {
            const isLeave = [...(status.new_dev || []), ...(status.updates || [])]
                .some(l => l.toLowerCase().includes('leave'));
            if (isLeave) onLeave.push(status);
            else active.push(status);
        });

        return { active, onLeave };
    }, [filteredTaskStatuses]);

    const presenceStats = useMemo(() => {
        const filteredTeam = allProfiles.filter(p => !EXCLUDED_EMAILS.includes((p as any).email?.toLowerCase() || ''));

        const onLeave = filteredTaskStatuses.filter(status =>
            [...(status.new_dev || []), ...(status.updates || [])]
                .some(l => l.toLowerCase().includes('leave'))
        ).length;

        const totalReported = filteredTaskStatuses.length;
        const working = totalReported - onLeave;

        return {
            totalTeam: filteredTeam.length,
            totalReported,
            working,
            onLeave
        };
    }, [filteredTaskStatuses, allProfiles, EXCLUDED_EMAILS]);

    const CHART_COLORS = [
        '#C5A059', // Primary Gold
        '#8E7036', // Bronze
        '#E5D5B0', // Champagne
        '#A0A0A0', // Silver
        '#5A5342', // Slate Gold
        '#2C2C2C', // Obsidian
        '#7A6632', // Dark Bronze
        '#D4C491', // Pale Gold
    ];

    const trendChartData = useMemo(() => {
        const dataArr = [];
        const numDays = trendRange === 'week' ? 7 : 30;

        for (let i = numDays - 1; i >= 0; i--) {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - i);
            const dStr = format(d, 'yyyy-MM-dd');
            const stats = monthStats[dStr] || { total: 0, new_dev: 0, updates: 0 };
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            dataArr.push({
                date: dStr,
                displayDate: format(d, trendRange === 'week' ? 'EEE' : 'MMM dd'),
                new_dev: stats.new_dev,
                updates: stats.updates,
                total: stats.total,
                isWeekend
            });
        }
        return dataArr;
    }, [monthStats, selectedDate, trendRange]);


    // Export functions
    const exportToPDF = async () => {
        if (!exportRef.current) return;
        const canvas = await html2canvas(exportRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f1f4f9',
            onclone: (doc) => {
                const element = doc.querySelector('[ref="exportRef"]') as HTMLElement;
                if (element) {
                    element.style.padding = '40px';
                    element.style.background = '#f1f4f9';
                }

                // Remove everything with data-export-hide
                doc.querySelectorAll('[data-export-hide]').forEach(el => el.remove());

                // Fix header visibility (remove gradients/transparency)
                const header = doc.querySelector('h1');
                if (header) {
                    header.style.color = '#000000';
                    header.style.webkitTextFillColor = '#000000';
                    header.style.background = 'none';
                    header.style.backgroundImage = 'none';
                }

                // Fix glass cards for export (remove blur/transparency)
                doc.querySelectorAll('.glass-card').forEach((card: any) => {
                    card.style.background = '#ffffff';
                    card.style.backdropFilter = 'none';
                    card.style.border = '1px solid #e2e8f0';
                });

                // Ensure table visibility
                doc.querySelectorAll('table').forEach((table: any) => {
                    table.style.background = '#ffffff';
                });
            }
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        let currentY = margin;

        const blocks = exportRef.current.querySelectorAll('[data-pdf-block]');

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i] as HTMLElement;
            const canvas = await html2canvas(block, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f1f4f9',
                onclone: (doc) => {
                    // Fix glass cards for export (remove blur/transparency)
                    doc.querySelectorAll('.glass-card').forEach((card: any) => {
                        card.style.background = '#ffffff';
                        card.style.backdropFilter = 'none';
                        card.style.border = '1px solid #e2e8f0';
                    });
                    const h1 = doc.querySelector('h1');
                    if (h1) {
                        h1.style.color = '#000000';
                        h1.style.webkitTextFillColor = '#000000';
                        h1.style.background = 'none';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Check if block fits on current page
            if (currentY + imgHeight > pageHeight - margin) {
                pdf.addPage();
                // Fill background for new page
                pdf.setFillColor(241, 244, 249);
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                currentY = margin;
            } else if (i === 0) {
                // Fill background for first page
                pdf.setFillColor(241, 244, 249);
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            }

            pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 10; // 10mm gap between blocks
        }

        // FOOTER: WASP Branding
        const brandText = 'WASP';
        const brandSub = 'INTELLIGENCE';

        // Capture logo specifically for footer
        const logoEl = exportRef.current.querySelector('#wasp-logo-export') as HTMLElement;
        let logoDataUrl = null;
        if (logoEl) {
            const logoCanvas = await html2canvas(logoEl, { scale: 3, backgroundColor: null });
            logoDataUrl = logoCanvas.toDataURL('image/png');
        }

        const totalPages = pdf.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            const footerY = pageHeight - 10;

            // Draw Logo if available
            if (logoDataUrl) {
                const logoSize = 6;
                pdf.addImage(logoDataUrl, 'PNG', (pageWidth / 2) - 14, footerY - 5, logoSize, logoSize);
            }

            // Draw Brand Text
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(30, 41, 59); // Slate-800
            pdf.text(brandText, (pageWidth / 2) - 6, footerY);

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(148, 163, 184); // Slate-400
            pdf.text(brandSub, (pageWidth / 2) + 6, footerY);
        }

        pdf.save(`Logs-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    };

    const exportToPNG = async () => {
        if (!exportRef.current) return;
        const canvas = await html2canvas(exportRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#f1f4f9',
            onclone: (doc) => {
                doc.querySelectorAll('[data-export-hide]').forEach(el => el.remove());

                // Fix header visibility
                const header = doc.querySelector('h1');
                if (header) {
                    header.style.color = '#000000';
                    header.style.webkitTextFillColor = '#000000';
                    header.style.background = 'none';
                }

                // Fix glass cards
                doc.querySelectorAll('.glass-card').forEach((card: any) => {
                    card.style.background = '#ffffff';
                    card.style.backdropFilter = 'none';
                    card.style.border = '1px solid #e2e8f0';
                });
            }
        });
        const link = document.createElement('a');
        link.download = `Status-${dateStr}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    const exportToExcel = () => {
        const rows = filteredTaskStatuses.map(s => {
            const newDev = (s.new_dev || []).filter(isValidCase);
            const updates = (s.updates || []).filter(isValidCase);
            return {
                User: s.profiles?.full_name || 'Unknown',
                'New Development': newDev.length ? newDev.join('\n') : '-',
                Updates: updates.length ? updates.join('\n') : '-',
                Count: `${newDev.length + updates.length} ${newDev.length + updates.length === 1 ? 'case' : 'cases'}`,
            };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [{ wch: 20 }, { wch: 60 }, { wch: 60 }, { wch: 22 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Daily Status');
        XLSX.writeFile(wb, `Status-${dateStr}.xlsx`);
    };

    const sendEmailStatus = async () => {
        // Trigger PNG download so user can attach it
        await exportToPNG();

        const subject = `Status - ${format(selectedDate, 'PPPP')}`;
        const cc = "amit.gilda@bristlecone.com,Aditya.Sanjay.Dahe@bristlecone.com,Rohit.Gadekar@bristlecone.com,Divyansh.Singh@bristlecone.com,mouli.maiti@bristlecone.com,ayush.tyagi@bristlecone.com,anil.panigrahi@bristlecone.com,sumit.dadanwale@bristlecone.com,vitthal.dhakane@bristlecone.com,shubham.chakraborty@bristlecone.com";

        let body = `Hello Pankaj,\n\nPlease find status for ${format(selectedDate, 'PPPP')}. A snapshot has been attached for quick reference.\n\n`;


        body += `Logs can also be viewed at https://wasp.rohitgadekar.dev/p/status?date=${dateStr}.\n\nThis email was generated automatically for reporting purposes.\n\n\nWASP`;

        const mailtoUri = `mailto:pankaj.patil@bristlecone.com?cc=${cc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUri;

        toast({
            title: "Email Client Opened",
            description: "A summary PNG has also been downloaded for you to attach.",
        });
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-tr from-[#FAF9F5] via-[#FDFDFB] to-[#F3EEE3] select-none">
            {/* Floating Actions Hub */}
            {/* <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl px-6 py-4 rounded-full border border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-8 duration-700">
                <Button variant="ghost" className="rounded-full px-4 h-10 font-bold text-sm hover:bg-primary/10 hover:text-primary transition-all" onClick={exportToPDF}>
                    <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
                <div className="w-px h-6 bg-foreground/10 mx-1" />
                <Button variant="ghost" className="rounded-full px-4 h-10 font-bold text-sm hover:bg-primary/10 hover:text-primary transition-all" onClick={exportToPNG}>
                    <Image className="w-4 h-4 mr-2" /> PNG
                </Button>
                <div className="w-px h-6 bg-foreground/10 mx-1" />
                <Button variant="ghost" className="rounded-full px-4 h-10 font-bold text-sm hover:bg-primary/10 hover:text-primary transition-all" onClick={exportToExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </Button>
                <div className="w-px h-6 bg-foreground/10 mx-1" />
                <Button variant="default" className="rounded-full px-6 h-10 font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all" onClick={sendEmailStatus}>
                    <Mail className="w-4 h-4 mr-2" /> Mail
                </Button>
                <Button variant="outline" className="rounded-full px-6 h-10 font-bold text-sm hover:bg-primary border-0 transition-all" onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}?date=${dateStr}`;
                    navigator.clipboard.writeText(url);
                    toast({ title: 'Share link copied to clipboard!' });
                }}>
                    <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
            </div> */}


            <div ref={exportRef} className="relative z-10 transition-all duration-500">
                <div className="space-y-12 mx-auto p-6 max-w-7xl pt-10">
                    {/* Branding Header */}
                    <div className="flex items-center justify-between border-b border-[#E5DCCB]/60 pb-8 mb-2">
                        <div className="flex items-center gap-4">
                            <div id="wasp-logo-export" className="w-14 h-14 bg-gradient-to-br from-[#E2D4BF] to-[#997C53] rounded-full flex items-center justify-center shadow-xl border border-[#F0E6D2] transform -rotate-6 transition-transform duration-500">
                                <SiChinaeasternairlines className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-cinzel font-bold tracking-wide text-[#2C241B] flex items-center gap-2">
                                    WASP <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]/40" /> <span className="text-[#A59582] font-sans font-normal uppercase text-lg tracking-normal">Analytics</span>
                                </h2>
                                <p className="text-[10px] font-sans font-bold tracking-[0.3em] text-[#C5A880] uppercase mb-0.5">Powered by Eagle Labs</p>
                            </div>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#A59582] mb-1">System Status Report</p>
                            <p className="text-xs font-mono font-bold text-[#C5A880] tracking-wider uppercase whitespace-nowrap">
                                {format(selectedDate, 'yyyyMMdd')}-{(Math.random() * 1000).toFixed(0)}
                            </p>
                        </div>
                    </div>

                    {holidays[dateStr] && (
                        <div className="p-6 rounded-[2.5rem] bg-[#C5A880]/10 border border-[#E5DCCB] flex flex-col md:flex-row items-center justify-between gap-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[#8C7654] border border-[#E5DCCB]">
                                    <TrendingUp className="w-6 h-6 text-[#C5A880]" />
                                </div>
                                <div>
                                    <p className="font-cinzel font-semibold text-lg text-[#2C241B] uppercase tracking-wider flex items-center gap-2">
                                        System Protocol: HOLIDAY
                                    </p>
                                    <p className="text-sm font-serif italic text-[#8C7654]">{holidays[dateStr]}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-px w-12 bg-[#E5DCCB] hidden md:block" />
                                <Badge className="bg-[#8C7654] text-white border-none rounded-full px-6 py-2 font-sans font-bold uppercase tracking-widest text-[9px]">
                                    Operations Suspended
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl  font-bold font-heading text-[#2C241B]">
                            {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                        </h1>
                        <p className="text-md text-[#8C7654] font-sans flex items-center gap-2">
                            <span className="w-8 h-[2px] bg-[#C5A880] rounded-full" />
                            SE MAPPERS • {format(selectedDate, 'yyyy')}
                        </p>
                    </div>

                    {/* Attendance / Presence Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {['Total Team', 'Reported', 'Working', 'On Leave'].map((label, index) => {
                            const val = index === 0 ? presenceStats.totalTeam : index === 1 ? presenceStats.totalReported : index === 2 ? presenceStats.working : presenceStats.onLeave;
                            const isLoad = index === 0 ? loadingProfiles : loadingTable;
                            return (
                                <Card key={label} className="bg-[#FDFDFB] rounded-[2rem] border border-[#E5DCCB] p-6 flex flex-col items-center justify-center text-center group hover:border-[#C5A880]/50 hover:shadow-lg transition-all duration-300">
                                    <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654] mb-2">{label}</span>
                                    {isLoad ? (
                                        <Skeleton className="h-9 w-12 rounded-lg bg-[#E5DCCB]/20" />
                                    ) : (
                                        <span className="text-3xl font-sans font-semibold text-[#2C241B]">{val}</span>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    {/* Calendar + Chart Grid */}
                    <div data-pdf-block className="grid gap-8 lg:grid-cols-2">
                        <Card className="glass-card rounded-[2.5rem] border-white/10 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-extrabold tracking-tight group-hover:text-primary transition-colors">Calendar</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 flex justify-center">
                                <CalendarWithDots
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    onMonthChange={setViewDate}
                                    monthStats={monthStats}
                                    holidays={holidays}
                                />
                            </CardContent>
                        </Card>

                        <Card className="bg-[#FDFDFB] rounded-[2.5rem] border border-[#E5DCCB] hover:border-[#C5A880]/50 hover:shadow-xl transition-all duration-500 overflow-hidden group">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-bold text-[#2C241B]">Team Velocity</CardTitle>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-[#E5DCCB]/60">
                                    <span className="flex items-center gap-2 text-xs font-sans font-bold text-[#C5A880] uppercase tracking-wider">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#C5A880]" />
                                        {dayStats.new_dev} New Dev
                                    </span>
                                    <span className="flex items-center gap-2 text-xs font-sans font-bold text-[#8C7654] uppercase tracking-wider">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#8C7654]" />
                                        {dayStats.updates} Updates
                                    </span>
                                    <span className="flex items-center gap-2 text-xs font-sans font-bold text-[#2C241B] uppercase tracking-wider">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#2C241B]" />
                                        {dayStats.total} Total Cases
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-0">
                                {loadingChart ? (
                                    <Skeleton className="h-96 w-full rounded-lg bg-[#E5DCCB]/20" />
                                ) : dayStats.total === 0 ? (
                                    <div className="h-96 flex flex-col items-center justify-center text-[#A59582] font-serif italic text-lg">
                                        <div className="text-4xl mb-4">🍂</div>
                                        {selectedDate.getDay() === 0 || selectedDate.getDay() === 6 ? 'Weekend Break' : 'No activity reported'}
                                    </div>
                                ) : (
                                    <div className="w-full h-96 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="30%"
                                                outerRadius="100%"
                                                barSize={32}
                                                data={[
                                                    { name: 'TOTAL', value: dayStats.total, fill: '#2C241B' },
                                                    { name: 'UPDATES', value: dayStats.updates, fill: '#8C7654' },
                                                    { name: 'NEW DEV', value: dayStats.new_dev, fill: '#C5A880' }
                                                ]}
                                            >
                                                <RadialBar
                                                    label={{ position: 'insideStart', fill: '#fff', fontWeight: 'bold' }}
                                                    background={{ fill: '#FAF9F5' }}
                                                    dataKey="value"
                                                    cornerRadius={30}
                                                />
                                                <Legend
                                                    iconType="circle"
                                                    iconSize={8}
                                                    layout="vertical"
                                                    verticalAlign="middle"
                                                    align="right"
                                                    wrapperStyle={{
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.1em',
                                                        color: '#2C241B'
                                                    }}
                                                />
                                                <Tooltip content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="rounded-2xl bg-[#FDFDFB] border border-[#E5DCCB] p-4 shadow-xl">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }} />
                                                                    <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#8C7654]">{data.name} : </span>
                                                                    <span className="font-cinzel font-semibold text-lg" style={{ color: data.fill }}>{data.value}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }} />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Trend Analysis Chart */}
                        <Card className="lg:col-span-2 bg-[#FDFDFB] rounded-[2.5rem] border border-[#E5DCCB] hover:border-[#C5A880]/50 hover:shadow-xl transition-all duration-500 overflow-hidden group">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-bold  text-[#2C241B]">Trend Analysis</CardTitle>
                                        <p className="text-sm font-sans text-[#8C7654]">Historical velocity overview</p>
                                    </div>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="w-[160px] h-10 rounded-xl border border-[#E5DCCB] bg-[#FDFDFB] hover:bg-[#FAF9F5] hover:border-[#C5A880] focus:ring-0 outline-none px-4 text-xs font-sans font-bold text-[#2C241B] transition-all flex items-center justify-between">
                                                <span>{trendRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] ml-2 inline-block shrink-0" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-[#FDFDFB] border border-[#E5DCCB] rounded-xl shadow-xl p-1 w-[160px]">
                                            <DropdownMenuItem onClick={() => setTrendRange('week')} className="cursor-pointer rounded-lg text-xs font-sans font-bold text-[#2C241B] focus:bg-[#C5A880]/10 focus:text-[#2C241B] flex items-center justify-between">
                                                <span>Last 7 Days</span>
                                                {trendRange === 'week' && <span className="w-1 h-1 rounded-full bg-[#C5A880]" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTrendRange('month')} className="cursor-pointer rounded-lg text-xs font-sans font-bold text-[#2C241B] focus:bg-[#C5A880]/10 focus:text-[#2C241B] flex items-center justify-between">
                                                <span>Last 30 Days</span>
                                                {trendRange === 'month' && <span className="w-1 h-1 rounded-full bg-[#C5A880]" />}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                {loadingChart ? (
                                    <Skeleton className="h-96 w-full rounded-lg bg-[#E5DCCB]/20" />
                                ) : (
                                    <div className="w-full h-96 mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2C241B" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#2C241B" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorNewDev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#C5A880" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#C5A880" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8C7654" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#8C7654" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5DCCB" vertical={true} />
                                                <XAxis
                                                    dataKey="displayDate"
                                                    tick={{ fontSize: 11, fontWeight: 700, fill: '#8C7654' }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis tick={{ fontSize: 10, fill: '#8C7654' }} tickLine={false} axisLine={false} />
                                                <Tooltip content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="rounded-2xl bg-[#FDFDFB] border border-[#E5DCCB] p-4 shadow-xl">
                                                                <div className="flex items-center justify-between mb-2 border-b border-[#E5DCCB]/60 pb-1.5">
                                                                    <p className="font-sans font-semibold text-sm text-[#2C241B]">{format(parseISO(data.date), 'PPPP')}</p>
                                                                    {data.isWeekend && (
                                                                        <Badge className="bg-[#C5A880]/15 text-[#8C7654] border-none rounded-full ml-4 font-sans font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
                                                                            WEEK OFF
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {!data.isWeekend && data.total > 0 && (
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="text-xs font-sans font-bold text-[#C5A880] uppercase tracking-wider">New Dev</span>
                                                                            <span className="font-sans font-semibold text-sm text-[#C5A880]">{data.new_dev}</span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="text-xs font-sans font-bold text-[#8C7654] uppercase tracking-wider">Updates</span>
                                                                            <span className="font-sans font-semibold text-sm text-[#8C7654]">{data.updates}</span>
                                                                        </div>
                                                                        <div className="pt-2 mt-2 border-t border-[#E5DCCB]/60 flex items-center justify-between gap-4">
                                                                            <span className="text-xs font-sans font-bold text-[#2C241B] uppercase tracking-wider">Total</span>
                                                                            <span className="font-sans font-semibold text-sm text-[#2C241B]">{data.total}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }} />
                                                <Area name="TOTAL" type="monotone" dataKey="total" stroke="#2C241B" strokeWidth={2} dot={trendRange === 'week'} fillOpacity={1} fill="url(#colorTotal)" />
                                                <Area name="NEW DEV" type="monotone" dataKey="new_dev" stroke="#C5A880" strokeWidth={2} dot={trendRange === 'week'} fillOpacity={1} fill="url(#colorNewDev)" />
                                                <Area name="UPDATES" type="monotone" dataKey="updates" stroke="#8C7654" strokeWidth={2} dot={trendRange === 'week'} fillOpacity={1} fill="url(#colorUpdates)" />
                                                <Legend
                                                    iconType="circle"
                                                    verticalAlign="top"
                                                    align="right"
                                                    height={36}
                                                    wrapperStyle={{
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        color: '#8C7654'
                                                    }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* New Individual Charts Section */}
                    {dayStats.total > 0 && (
                        <div className="space-y-8">
                            <Card className="bg-[#FDFDFB] rounded-[2.5rem] border border-[#E5DCCB] hover:border-[#C5A880]/50 hover:shadow-xl transition-all duration-500 overflow-hidden group">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-2xl font-bold text-[#2C241B]">Individual Performance</CardTitle>
                                    <p className="text-sm font-sans text-[#8C7654] mt-1 mb-4">Cases delivered by team members today</p>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-[#E5DCCB]/60">
                                        <span className="flex items-center gap-2 text-xs font-sans font-bold text-[#8C7654] uppercase tracking-wider">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#8C7654]" />
                                            {individualData.reduce((acc, curr) => acc + curr.updates, 0)} Updates
                                        </span>
                                        <span className="flex items-center gap-2 text-xs font-sans font-bold text-[#C5A880] uppercase tracking-wider">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#C5A880]" />
                                            {individualData.reduce((acc, curr) => acc + curr.new_dev, 0)} New Dev
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    {loadingTable ? (
                                        <Skeleton className="h-96 w-full rounded-lg bg-[#E5DCCB]/20" />
                                    ) : individualData.length === 0 ? (
                                        <div className="h-96 flex items-center justify-center text-[#A59582] font-serif italic text-lg">No individual data</div>
                                    ) : (
                                        <div className="w-full h-96">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={individualData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5DCCB" vertical={true} />
                                                    <XAxis
                                                        dataKey="name"
                                                        tick={{ fontSize: 11, fontWeight: 700, fill: '#8C7654' }}
                                                        tickLine={false}
                                                        axisLine={true}
                                                    />
                                                    <YAxis tick={{ fontSize: 10, fill: '#8C7654' }} tickLine={true} axisLine={true} />
                                                    <Tooltip content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="rounded-2xl bg-[#FDFDFB] border border-[#E5DCCB] p-4 shadow-xl">
                                                                    <p className="font-sans font-semibold text-sm text-[#2C241B] mb-2">{data.fullName}</p>
                                                                    <div className="space-y-1">
                                                                        {data.new_dev > 0 && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-xs font-sans font-bold text-[#C5A880] uppercase tracking-wider">New Dev</span>
                                                                                <span className="font-sans font-semibold text-sm text-[#C5A880]">{data.new_dev}</span>
                                                                            </div>)}
                                                                        {data.updates > 0 && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-xs font-sans font-bold text-[#8C7654] uppercase tracking-wider">Updates</span>
                                                                                <span className="font-sans font-semibold text-sm text-[#8C7654]">{data.updates}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="pt-2 mt-2 border-t border-[#E5DCCB]/60 flex items-center justify-between gap-4">
                                                                            <span className="text-xs font-sans font-bold text-[#2C241B] uppercase tracking-wider">Total Cases</span>
                                                                            <span className="font-sans font-semibold text-sm text-[#2C241B]">{data.total}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }} />
                                                    {(() => {
                                                        const renderRoundedBar = (props: any) => {
                                                            const { fill, x, y, width, height, payload, dataKey } = props;
                                                            if (height <= 0) return null;
                                                            const radius = (dataKey === 'updates' || (dataKey === 'new_dev' && (!payload.updates || payload.updates === 0))) ? 6 : 0;
                                                            return (
                                                                <path
                                                                    d={`M${x},${y + height} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + width - radius},${y} Q${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} Z`}
                                                                    fill={fill}
                                                                />
                                                            );
                                                        };
                                                        return (
                                                            <>
                                                                <Bar name="NEW DEV" dataKey="new_dev" stackId="a" fill="#C5A880" shape={renderRoundedBar} maxBarSize={48} />
                                                                <Bar name="UPDATES" dataKey="updates" stackId="a" fill="#8C7654" shape={renderRoundedBar} maxBarSize={48} />
                                                            </>
                                                        );
                                                    })()}
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="grid gap-8 lg:grid-cols-2">
                                <Card className="bg-[#FDFDFB] rounded-[2.5rem] border border-[#E5DCCB] hover:border-[#C5A880]/50 hover:shadow-xl transition-all duration-500 overflow-hidden group">
                                    <CardHeader className="p-8 pb-4 text-center">
                                        <CardTitle className="text-2xl font-bold text-[#2C241B]">Team Status Mix</CardTitle>
                                        <p className="text-sm font-sans text-[#8C7654] mt-1">Ratio of New Dev vs Updates</p>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center p-8 pt-0">
                                        {dayStats.total === 0 ? (
                                            <div className="h-72 flex items-center justify-center text-[#A59582] font-serif italic text-sm">No distribution data</div>
                                        ) : (
                                            <>
                                                <div className="w-full h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={distributionData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={70}
                                                                outerRadius={95}
                                                                paddingAngle={8}
                                                                dataKey="value"
                                                            >
                                                                {distributionData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    const data = payload[0].payload;
                                                                    return (
                                                                        <div className="rounded-2xl bg-[#FDFDFB] border border-[#E5DCCB] p-4 shadow-xl">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                                                                <span className="text-xs font-sans font-bold uppercase tracking-wider" style={{ color: data.color }}>{data.name}  </span>
                                                                                <span className="font-sans font-semibold text-sm" style={{ color: data.color }}>{data.value}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="flex flex-wrap justify-center gap-6 mt-6">
                                                    {distributionData.map((item, i) => (
                                                        <div key={i} className="flex flex-col items-center px-8 py-4 rounded-[2rem] min-w-[140px] bg-[#FAF9F5] border border-[#E5DCCB]/60">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                                <span className="text-xs font-sans font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.name}</span>
                                                            </div>
                                                            <span className="text-2xl font-sans font-semibold tracking-tight" style={{ color: item.color }}>{Math.round((item.value / dayStats.total) * 100)}%</span>
                                                            <span className="text-xs font-sans font-bold text-[#8C7654]" style={{ color: item.color }}>{item.value} {item.value === 1 ? 'case' : 'cases'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="bg-[#FDFDFB] rounded-[2.5rem] border border-[#E5DCCB] hover:border-[#C5A880]/50 hover:shadow-xl transition-all duration-500 overflow-hidden group">
                                    <CardHeader className="p-8 pb-4 text-center">
                                        <CardTitle className="text-2xl font-bold text-[#2C241B]">Contribution Share</CardTitle>
                                        <p className="text-sm font-sans text-[#8C7654] mt-1">Output share per team member</p>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center justify-center p-8 pt-0">
                                        {memberContributionData.length === 0 ? (
                                            <div className="h-72 flex items-center justify-center text-[#A59582] font-serif italic text-sm">No contribution data</div>
                                        ) : (
                                            <>
                                                <div className="w-full h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={memberContributionData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={70}
                                                                outerRadius={95}
                                                                paddingAngle={4}
                                                                dataKey="value"
                                                            >
                                                                {memberContributionData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    const data = payload[0].payload;
                                                                    const color = payload[0].color || payload[0].payload.fill;
                                                                    return (
                                                                        <div className="rounded-2xl bg-[#FDFDFB] border border-[#E5DCCB] p-4 shadow-xl">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                                                                <span className="font-sans font-semibold text-sm" style={{ color: color }}>{data.fullName}</span>
                                                                                <span className="font-sans font-semibold text-sm ml-2" style={{ color: color }}>{data.value}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-2xl mx-auto">
                                                    {memberContributionData.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5DCCB]/60 bg-[#FAF9F5]">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{item.name}</span>
                                                            <span className="text-xs font-sans font-semibold ml-1" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{Math.round((item.value / dayStats.total) * 100)}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}



                    {/* Report Summary Table (Read Only) */}
                    <Card className="bg-[#FDFDFB] rounded-[2.5rem] border border-[#E5DCCB] hover:border-[#C5A880]/50 hover:shadow-xl transition-all duration-500 overflow-hidden shadow-2xl">
                        <CardHeader className="p-10 pb-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-3xl font-bold text-[#2C241B]">Performance Summary</CardTitle>
                                    <p className="text-sm font-sans  text-[#8C7654]">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</p>
                                </div>
                                {dayStats.total > 0 && (
                                    <div className="hidden md:flex flex-col items-end">
                                        <Badge className="bg-[#C5A880]/15 text-[#8C7654] border-none rounded-full px-6 py-2 text-sm font-sans font-semibold">
                                            {dayStats.total} {dayStats.total === 1 ? 'CASE' : 'CASES'}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 pt-4">
                            {loadingTable ? (
                                <div className="space-y-6">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl bg-[#E5DCCB]/20 animate-pulse" />)}
                                </div>
                            ) : filteredTaskStatuses.length === 0 ? (
                                <div className="text-center py-24 bg-[#FAF9F5] border border-dashed border-[#E5DCCB] rounded-[2.5rem]">
                                    <GiAvoidance className="w-16 h-16 mx-auto mb-6 text-[#A59582]/30" />
                                    <h3 className="text-xl font-sans font-bold text-[#2C241B]">No data synchronized yet</h3>
                                    <p className="text-sm font-sans text-[#8C7654] mt-2">Be the first to report your cases for today!</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-none bg-[#C5A880]/10">
                                                <TableHead className="text-[#8C7654] font-sans font-bold uppercase tracking-[0.2em] text-[10px] h-14 rounded-l-xl pl-8">Reporter</TableHead>
                                                <TableHead className="text-[#8C7654] font-sans font-bold uppercase tracking-[0.2em] text-[10px] h-14">New Development</TableHead>
                                                <TableHead className="text-[#8C7654] font-sans font-bold uppercase tracking-[0.2em] text-[10px] h-14">Updates & Maintenance</TableHead>
                                                <TableHead className="text-right text-[#8C7654] font-sans font-bold uppercase tracking-[0.2em] text-[10px] h-14 rounded-r-xl">Metrics</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {separatedStatuses.active.map((status) => {
                                                const newDev = (status.new_dev || []).filter(l => l.trim());
                                                const updates = (status.updates || []).filter(l => l.trim());
                                                const total = newDev.filter(isValidCase).length + updates.filter(isValidCase).length;
                                                return (
                                                    <TableRow
                                                        key={status.id}
                                                        className="border-[#E5DCCB]/60 hover:bg-[#FAF9F5] transition-colors group/row"
                                                    >
                                                        <TableCell className="py-6 align-top pl-8">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-sans font-bold text-[#2C241B] text-base">
                                                                    {status.profiles?.full_name || 'Anonymous User'}
                                                                </span>
                                                                <span className="text-[9px] font-sans font-bold text-[#A59582] uppercase tracking-widest">
                                                                    X{status.user_id.split("-")[0]}
                                                                </span>
                                                                {status.user_id === user?.id && (
                                                                    <Badge className="w-fit bg-[#C5A880]/15 text-[#8C7654] border-none rounded-full px-2 py-0.5 text-[8px] font-sans font-bold uppercase tracking-wider">
                                                                        YOU
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6 align-top">
                                                            <div className="space-y-1.5">
                                                                {newDev.length > 0 ? newDev.map((l, i) => (
                                                                    l.toLowerCase().startsWith('http') ? (
                                                                        <a key={i} href={l} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group/link w-fit">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C5A880] opacity-60 group-hover/link:opacity-100 transition-opacity" />
                                                                            <span className="text-sm font-sans font-medium text-[#C5A880] hover:underline underline-offset-2">
                                                                                {l.split('/browse/').pop()}
                                                                            </span>
                                                                        </a>
                                                                    ) : (
                                                                        <div key={i} className="flex items-center gap-2">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#A59582]/40" />
                                                                            <span className="text-sm font-sans font-medium text-[#8C7654] italic">{l}</span>
                                                                        </div>
                                                                    )
                                                                )) : <span className="text-xs font-sans font-bold text-[#A59582]/30 uppercase tracking-wider">— EMPTY</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6 align-top">
                                                            <div className="space-y-1.5">
                                                                {updates.length > 0 ? updates.map((l, i) => (
                                                                    l.toLowerCase().startsWith('http') ? (
                                                                        <a key={i} href={l} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group/link w-fit">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#8C7654] opacity-60 group-hover/link:opacity-100 transition-opacity" />
                                                                            <span className="text-sm font-sans font-medium text-[#8C7654] hover:underline underline-offset-2">
                                                                                {l.split('/browse/').pop()}
                                                                            </span>
                                                                        </a>
                                                                    ) : (
                                                                        <div key={i} className="flex items-center gap-2">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#A59582]/40" />
                                                                            <span className="text-sm font-sans font-medium text-[#8C7654] italic">{l}</span>
                                                                        </div>
                                                                    )
                                                                )) : <span className="text-xs font-sans font-bold text-[#A59582]/30 uppercase tracking-wider">— EMPTY</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6 text-right align-top pr-8">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <Badge className="bg-[#C5A880]/15 text-[#8C7654] border-none rounded-md px-3 py-1 text-sm font-sans font-semibold">
                                                                    {total}
                                                                </Badge>
                                                                {total > 0 && (
                                                                    <div className="text-[9px] font-sans font-bold text-[#A59582] uppercase mt-1">
                                                                        {newDev.filter(isValidCase).length}N • {updates.filter(isValidCase).length}U
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Personnel Absence Protocol Section */}
                    {separatedStatuses.onLeave.length > 0 && (
                        <Card className="bg-[#FDFDFB] rounded-[2.5rem] border border-[#E5DCCB] hover:border-[#C5A880]/50 hover:shadow-xl transition-all duration-500 overflow-hidden shadow-2xl">
                            <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-2xl font-inter font-bold text-[#2C241B]">Personnel Absence Protocol</CardTitle>
                                    <p className="text-sm font-inter  text-[#8C7654]">Team members currently on scheduled leave</p>
                                </div>
                                <Badge className="bg-[#C5A880]/15 text-[#8C7654] border-none rounded-full px-4 py-1.5 text-[9px] font-sans font-bold uppercase tracking-widest">
                                    {separatedStatuses.onLeave.length} PERSONNEL
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-10 pt-4">
                                <div className="flex flex-wrap gap-6">
                                    {separatedStatuses.onLeave.map((status) => (
                                        <div
                                            key={status.id}
                                            className="group relative bg-[#FAF9F5] rounded-3xl p-6 hover:bg-[#C5A880]/10  border border-[#E5DCCB]/20 transition-all duration-300"
                                        >
                                            <div className="flex flex-col">
                                                    <span className="font-inter font-semibold text-[#8C7654] text-lg">
                                                        {status.profiles?.full_name || 'Anonymous User'}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                    <Badge className="text-xs w-fit bg-[#C5A880]/15 text-[#8C7654] border-none rounded-md px-3 py-1 text-[8px] font-sans font-bold uppercase tracking-widest mt-2">
                                                    X{status.user_id.split("-")[0]}
                                                    </Badge>
                                                    <Badge className="text-xs w-fit bg-[#C5A880]/15 text-[#8C7654] border-none rounded-md px-3 py-1 text-[8px] font-sans font-bold uppercase tracking-widest mt-2">
                                                    {leaveTypeByUserId[status.user_id] || 'Leave'}
                                                    </Badge>
                                                    </div>
                                                </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusViewer;