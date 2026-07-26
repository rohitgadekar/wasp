import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/hooks/use-title';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, parseISO, isValid, differenceInCalendarDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, UserPlus, Trash2, Pencil, Loader2, Plane, Palmtree, Clock, Info, TrendingUp, ChevronDown, Check, TentTree, Hospital, Siren } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
interface Leave {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    type: string;
    assigned_by: string;
    profiles?: { full_name: string };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEAVE_TYPES = ['Vacation', 'Sick Leave', 'Personal Leave', 'Emergency Leave', 'Maternity/Paternity', 'Public Holiday', 'Other'];

const labelClasses = "text-[10px] font-bold uppercase tracking-[0.18em] text-[#8C7654] block mb-1.5";

const Leaves = () => {
    const { user } = useAuth();
    const { role, isSuperUser, canManageLeaves } = useUserRole();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
    const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [newLeave, setNewLeave] = useState({
        userId: '',
        startDate: new Date(),
        endDate: new Date(),
        type: 'Vacation'
    });

    useTitle('Leave Calendar');

    const EXCLUDED_EMAILS = useMemo(() => [
        'rohit@apex.com',
        'pankaj@apex.com',
        'tschellenberg@spscommerce.com',
        'amit.gilda@bristlecone.com',
        'pankaj.patil@bristlecone.com',
        'aditya.sanjay.dahe@bristlecone.com'
    ].map(e => e.toLowerCase()), []);

    // Fetch all profiles for moderator to assign leaves
    const { data: profiles = [] } = useQuery({
        queryKey: ['profiles-list'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
            if (!data) return [];
            return data.filter(p => !EXCLUDED_EMAILS.includes(p.email?.toLowerCase() || ''));
        },
        enabled: canManageLeaves
    });

    // Fetch leaves for the current month
    const { data: leaves = [], isLoading: loadingLeaves } = useQuery({
        queryKey: ['team_leaves', format(currentMonth, 'yyyy-MM')],
        queryFn: async () => {
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('team_leaves')
                .select('*, profiles(full_name)')
                .lte('start_date', end)
                .gte('end_date', start);

            if (error) throw error;
            return data as Leave[];
        }
    });

    // Fetch holidays for the current month
    const { data: holidays = {} } = useQuery({
        queryKey: ['holidays', format(currentMonth, 'yyyy-MM')],
        queryFn: async () => {
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);

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

    // Setup Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('team_leaves_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_leaves' }, () => {
                queryClient.invalidateQueries({ queryKey: ['team_leaves'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const userSummaries = useMemo(() => {
        const summary: Record<string, { name: string, totalDays: number, leaveTypes: Set<string>, dateRanges: string[] }> = {};

        leaves.forEach(leave => {
            const uid = leave.user_id;
            const start = parseISO(leave.start_date);
            const end = parseISO(leave.end_date);

            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);

            const effectiveStart = start < monthStart ? monthStart : start;
            const effectiveEnd = end > monthEnd ? monthEnd : end;

            const days = differenceInCalendarDays(effectiveEnd, effectiveStart) + 1;

            if (days <= 0) return;

            if (!summary[uid]) {
                summary[uid] = {
                    name: leave.profiles?.full_name || 'Unknown User',
                    totalDays: 0,
                    leaveTypes: new Set(),
                    dateRanges: []
                };
            }
            summary[uid].totalDays += days;
            summary[uid].leaveTypes.add(leave.type);

            const rangeStr = isSameDay(start, end)
                ? format(start, 'MMM dd')
                : `${format(start, 'MMM dd')} – ${format(end, 'MMM dd')}`;
            summary[uid].dateRanges.push(rangeStr);
        });

        return Object.values(summary).sort((a, b) => b.totalDays - a.totalDays);
    }, [leaves, currentMonth]);

    const leavesOnSelectedDate = useMemo(() => {
        return leaves.filter(leave => {
            const start = parseISO(leave.start_date);
            const end = parseISO(leave.end_date);
            const selected = new Date(selectedDate.setHours(0, 0, 0, 0));
            return selected >= start && selected <= end;
        });
    }, [leaves, selectedDate]);

    const handleSaveLeave = async () => {
        if (!newLeave.userId || !newLeave.startDate || !newLeave.endDate) {
            toast({ title: "Please fill all fields", variant: "destructive" });
            return;
        }

        const startDate = startOfDay(newLeave.startDate);
        const endDate = startOfDay(newLeave.endDate);

        if (!isValid(startDate) || !isValid(endDate)) {
            toast({
                title: "Invalid dates",
                description: "Please select valid start and end dates.",
                variant: "destructive"
            });
            return;
        }

        if (isAfter(startDate, endDate)) {
            toast({
                title: "Invalid date range",
                description: "Start date cannot be after end date.",
                variant: "destructive"
            });
            return;
        }

        setActionLoading(true);

        let oldLeave = null;
        if (editingLeaveId) {
            const { data } = await supabase
                .from('team_leaves')
                .select('*')
                .eq('id', editingLeaveId)
                .single();
            oldLeave = data;
        }

        const leaveData = {
            user_id: newLeave.userId,
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
            type: newLeave.type,
            assigned_by: user?.id
        };

        const { error } = editingLeaveId
            ? await supabase.from('team_leaves').update(leaveData).eq('id', editingLeaveId)
            : await supabase.from('team_leaves').insert(leaveData);

        if (error) {
            toast({ title: editingLeaveId ? "Failed to update leave" : "Failed to add leave", description: error.message, variant: "destructive" });
        } else {
            if (oldLeave) {
                await supabase
                    .from('daily_task_status')
                    .delete()
                    .eq('user_id', oldLeave.user_id)
                    .gte('date', oldLeave.start_date)
                    .lte('date', oldLeave.end_date)
                    .contains('new_dev', ['ON LEAVE']);
            }

            const leaveDates = eachDayOfInterval({
                start: startDate,
                end: endDate
            });

            const statusEntries = leaveDates.map(date => ({
                user_id: newLeave.userId,
                date: format(date, 'yyyy-MM-dd'),
                new_dev: ['ON LEAVE'],
                updates: ['ON LEAVE']
            }));

            const { error: statusError } = await supabase
                .from('daily_task_status')
                .upsert(statusEntries, { onConflict: 'user_id,date' });

            if (statusError) {
                console.error("Failed to sync logs:", statusError);
                toast({
                    title: "Leave saved, but log sync failed",
                    description: "Manual log entry may be required.",
                    variant: "destructive"
                });
            } else {
                toast({ title: editingLeaveId ? "Leave & Logs updated successfully!" : "Leave & Logs synchronized successfully!" });
            }

            setIsAddDialogOpen(false);
            setEditingLeaveId(null);
            setNewLeave({
                userId: '',
                startDate: new Date(),
                endDate: new Date(),
                type: 'Vacation'
            });
        }
        setActionLoading(false);
    };

    const handleEditLeave = (leave: Leave) => {
        setEditingLeaveId(leave.id);
        setNewLeave({
            userId: leave.user_id,
            startDate: parseISO(leave.start_date),
            endDate: parseISO(leave.end_date),
            type: leave.type
        });
        setIsAddDialogOpen(true);
    };

    const confirmDeleteLeave = (id: string) => {
        setLeaveToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteLeave = async () => {
        if (!leaveToDelete) return;

        setActionLoading(true);

        const { data: leaveRecord } = await supabase
            .from('team_leaves')
            .select('*')
            .eq('id', leaveToDelete)
            .single();

        if (leaveRecord) {
            const { error: deleteError } = await supabase
                .from('team_leaves')
                .delete()
                .eq('id', leaveToDelete);

            if (deleteError) {
                toast({ title: "Failed to delete leave", variant: "destructive" });
            } else {
                const { error: logError } = await supabase
                    .from('daily_task_status')
                    .delete()
                    .eq('user_id', leaveRecord.user_id)
                    .gte('date', leaveRecord.start_date)
                    .lte('date', leaveRecord.end_date)
                    .contains('new_dev', ['ON LEAVE']);

                if (logError) {
                    console.error("Log cleanup error:", logError);
                    toast({
                        title: "Leave removed, but logs remained",
                        description: "Logs may need manual removal.",
                        variant: "destructive"
                    });
                } else {
                    toast({ title: "Leave and logs successfully removed" });
                }

                setIsDeleteDialogOpen(false);
                setLeaveToDelete(null);
            }
        }

        setActionLoading(false);
    };

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const leadingDays = Array(startOfMonth(currentMonth).getDay()).fill(null);

    const getDayStatus = (day: Date) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayLeaves = leaves.filter(l => {
            const start = l.start_date;
            const end = l.end_date;
            return dayStr >= start && dayStr <= end;
        });
        return dayLeaves;
    };

    const selectedMemberName = profiles.find(p => p.id === newLeave.userId)?.full_name;

    return (
        <div className="relative min-h-screen">
            <div className="relative space-y-10 mx-auto p-6 md:p-10 max-w-7xl pb-20 z-10">

                {/* Page Header */}
                <div className="flex items-center justify-center">
                    <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold shadow-sm">
                        Leave Calendar
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ── Calendar Section ── */}
                    <div className="lg:col-span-8 space-y-8 ">
                        <Card className="border border-[#E5DCCB] overflow-hidden shadow-xl rounded-3xl">


                            <CardHeader className="px-8 pt-7 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">

                                        <div>
                                            <h2 className="text-2xl font-heading" style={{ color: '#2C241B', fontFamily: "'Inter', serif" }}>
                                                {format(currentMonth, "MMMM yyyy")}
                                            </h2>
                                            <p className="text-[10px] font-medium tracking-[0.2em] uppercase mt-0.5" style={{ color: '#A59582' }}>
                                                Schedules & Availability
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost" size="icon"
                                            onClick={prevMonth}
                                            className="w-9 h-9 rounded-full border hover:bg-[#E3DAC9] transition-all hover:scale-105"
                                            style={{ borderColor: '#E3DAC9', color: '#8C7654' }}
                                        >
                                            <ChevronLeft className="w-4 h-4" color='black' />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            onClick={nextMonth}
                                            className="w-9 h-9 rounded-full border hover:bg-[#E3DAC9] transition-all hover:scale-105"
                                            style={{ borderColor: '#E3DAC9', color: '#8C7654' }}
                                        >
                                            <ChevronRight className="w-4 h-4" color='black' />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="px-8 pb-8 pt-2">
                                {/* Weekday headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {WEEKDAYS.map(day => (
                                        <div key={day} className="text-center py-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#A59582' }}>
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="h-px mb-4" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} />

                                {/* Day cells */}
                                <div className="grid grid-cols-7 gap-1 md:gap-2">
                                    {leadingDays.map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square md:aspect-video " />
                                    ))}
                                    {days.map(day => {
                                        const dayLeaves = getDayStatus(day);
                                        const dayStr = format(day, 'yyyy-MM-dd');
                                        const holiday = holidays[dayStr];
                                        const isSelected = isSameDay(day, selectedDate);
                                        const isToday = isSameDay(day, new Date());
                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                        return (
                                            <button
                                                key={day.toISOString()}
                                                onClick={() => setSelectedDate(day)}
                                                className={cn(
                                                    "relative flex flex-col items-center justify-center aspect-square md:aspect-video rounded-3xl text-sm transition-all group",
                                                    isSelected
                                                        ? "scale-105 z-10 shadow-lg"
                                                        : "hover:scale-[1.03]"
                                                )}
                                                style={
                                                    isSelected
                                                        ? { background: '#2C241B', color: '#EFEAE2', boxShadow: '0 4px 16px rgba(197,168,128,0.4)' }
                                                        : holiday
                                                            ? { background: 'rgba(139,92,246,0.08)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.2)' }
                                                            : isToday
                                                                ? { background: 'rgba(197,168,128,0.12)', color: '#8C7654', border: '1px solid rgba(197,168,128,0.3)' }
                                                                : isWeekend
                                                                    ? { background: 'rgba(44,36,27,0.03)', color: '#C5B8AA' }
                                                                    : { background: 'rgba(44,36,27,0.02)', color: '#5C4A36' }
                                                }
                                            >
                                                <span className="font-bold text-base md:text-lg" style={isSelected ? { color: '#FDFDFB' } : {}}>
                                                    {format(day, "d")}
                                                </span>
                                                {(dayLeaves.length > 0 || holiday) && (
                                                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                                                        {holiday && (
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? '#FDFDFB' : '#7C3AED' }} />
                                                        )}
                                                        {dayLeaves.slice(0, 2).map((l) => (
                                                            <div
                                                                key={l.id}
                                                                className="w-1.5 h-1.5 rounded-full"
                                                                style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : '#C5A880' }}
                                                            />
                                                        ))}
                                                        {dayLeaves.length > 2 && (
                                                            <span className="text-[7px] font-bold" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : '#C5A880' }}>+</span>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Selected Day Details */}
                        <Card className="border border-[#E5DCCB] overflow-hidden shadow-xl rounded-3xl" >
                            <CardHeader className="px-6 pt-6 pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold" style={{ color: '#2C241B', fontFamily: "'Inter', serif" }}>
                                            {format(selectedDate, "do MMMM")}
                                        </h3>
                                        <p className="text-[10px] font-medium tracking-[0.2em] uppercase mt-0.5" style={{ color: '#A59582' }}>
                                            {format(selectedDate, "EEEE")}
                                        </p>
                                    </div>
                                    {canManageLeaves && (
                                        <Button
                                            onClick={() => {
                                                setEditingLeaveId(null);
                                                setNewLeave({
                                                    userId: '',
                                                    startDate: selectedDate,
                                                    endDate: selectedDate,
                                                    type: 'Vacation'
                                                });
                                                setIsAddDialogOpen(true);
                                            }}
                                            variant='default'
                                            className="w-9 h-9 rounded-full p-0 border-0 shadow-md"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>

                            <div className="mx-6 h-px" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} />

                            <CardContent className="px-6 pt-4 pb-6 space-y-4">
                                {/* Holiday Banner */}
                                {holidays[format(selectedDate, 'yyyy-MM-dd')] && (
                                    <div className="p-3.5 rounded-3xl flex items-center gap-3" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)' }}>
                                        <div className="w-9 h-9 rounded-3xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.12)' }}>
                                            <TrendingUp className="w-4 h-4" style={{ color: '#7C3AED' }} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#7C3AED' }}>Official Holiday</p>
                                            <p className="text-xs font-medium italic mt-0.5" style={{ color: '#7C3AED', opacity: 0.8 }}>
                                                {holidays[format(selectedDate, 'yyyy-MM-dd')]}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Leave Records */}
                                {loadingLeaves ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#C5A880' }} />
                                    </div>
                                ) : leavesOnSelectedDate.length > 0 ? (
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: '#8C7654' }}>Personnel on Leave</p>
                                        {leavesOnSelectedDate.map(leave => (
                                            <div
                                                key={leave.id}
                                                className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E3DAC9] group transition-all"
                                                style={{ background: 'rgba(197,168,128,0.04)' }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 text-[9px] rounded-3xl bg-[#E3DAC9]/20 text-[#BFA378] flex items-center justify-center font-bold uppercase shadow-sm"
                                                    >
                                                        {leave.profiles?.full_name?.[0] + leave.profiles?.full_name?.split(" ")[1][0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm" style={{ color: '#2C241B' }}>{leave.profiles?.full_name}</p>
                                                        <p className="text-[10px] font-medium flex items-center gap-1 mt-0.5" style={{ color: '#A59582' }}>
                                                            {leave.type.toLowerCase() === 'personal leave' || leave.type.toLowerCase() === 'vacation' ? <TentTree className="w-3 h-3" /> : leave.type.toLowerCase() === "sick leave" ? <Hospital className="w-3 h-3" /> : <Siren className="w-3 h-3" />}  {leave.type}
                                                        </p>
                                                    </div>
                                                </div>
                                                {canManageLeaves && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <span className="border border-[#E3DAC9] hover:bg-[#E3DAC9] rounded-full p-2 hover:cursor-pointer" onClick={() => handleEditLeave(leave)}>
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </span>
                                                        <span className="border border-red-600/20 hover:bg-red-600/20 rounded-full p-2 hover:cursor-pointer" onClick={() => confirmDeleteLeave(leave.id)}>
                                                            <Trash2 className="w-3.5 h-3.5" color="red" />
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 px-4 rounded-3xl border border-dashed" style={{ borderColor: '#E3DAC9' }}>
                                        <p className="text-xs font-light" style={{ color: '#A59582' }}>No absence records for this date</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Stat Card */}
                        <Card className="border border-[#E5DCCB] overflow-hidden shadow-xl rounded-3xl" style={{ background: '#FDFDFB' }}>
                            <div className="px-6 py-5 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#A59582' }}>Monthly Personnel</p>
                                    {loadingLeaves ? (
                                        <Loader2 className="w-5 h-5 animate-spin mt-1" style={{ color: '#C5A880' }} />
                                    ) : (
                                        <p className="text-2xl font-bold" style={{ color: '#2C241B', fontFamily: "'Inter', serif" }}>
                                            {userSummaries.length} <span className="text-sm font-medium" style={{ color: '#8C7654' }}>Members</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ── Leaves Overview Section ── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold" style={{ color: '#2C241B', fontFamily: "'Inter', serif" }}>
                                Leaves Overview
                            </h2>
                            <p className="text-sm font-medium mt-1" style={{ color: '#A59582', fontFamily: "'Inter', serif" }}>
                                Aggregated availability metrics for {format(currentMonth, "MMMM yyyy")}
                            </p>
                        </div>
                    </div>

                    {/* Thin gold separator */}
                    <div className="h-px w-full" style={{ background: 'linear-gradient(to right, #C5A880, transparent)' }} />

                    {userSummaries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {userSummaries.map((summary, idx) => (
                                <Card
                                    key={idx}
                                    className="border border-[#E5DCCB] rounded-3xl overflow-hidden shadow-md group transition-all hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    <div className="p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-11 h-11 text-sm rounded-3xl bg-[#E3DAC9]/20 text-[#BFA378] flex items-center justify-center font-bold text-lg uppercase shadow-sm"
                                            >
                                                {summary.name[0] + summary.name.split(" ")[1][0]}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#A59582' }}>Days Off</p>
                                                <p className="text-2xl font-bold" style={{ color: '#C5A880', fontFamily: "'Inter', serif" }}>
                                                    {summary.totalDays}<span className="text-sm ml-0.5" style={{ color: '#A59582' }}>d</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold text-sm mb-2 truncate" style={{ color: '#2C241B' }}>{summary.name}</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {Array.from(summary.leaveTypes).map(type => (
                                                    <span
                                                        key={type}
                                                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                                                        style={{ background: 'rgba(197,168,128,0.12)', color: '#8C7654', border: '1px solid rgba(197,168,128,0.3)' }}
                                                    >
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t space-y-1.5" style={{ borderColor: '#F0EAE0' }}>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#A59582' }}>Schedule</p>
                                            {summary.dateRanges.map((range, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] font-medium" style={{ color: '#8C7654' }}>
                                                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: '#C5A880' }} />
                                                    {range}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: '#E3DAC9', background: 'rgba(197,168,128,0.03)' }}>
                            <Palmtree className="w-10 h-10 mx-auto mb-4 opacity-30" style={{ color: '#C5A880' }} />
                            <p className="text-sm font-medium italic" style={{ color: '#A59582', fontFamily: "'Cormorant Garamond', serif" }}>
                                No absence records available for this month.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                Add / Edit Leave Dialog
            ══════════════════════════════════════════════════ */}
            <Dialog modal={false} open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                    setEditingLeaveId(null);
                    setNewLeave({ userId: '', startDate: new Date(), endDate: new Date(), type: 'Vacation' });
                }
            }}>
                <DialogContent
                    className="p-0 gap-0 overflow-hidden border-0 shadow-2xl max-w-xl"
                    style={{ borderRadius: '1.25rem', background: '#FDFDFB', boxShadow: '0 25px 80px rgba(44,36,27,0.25)' }}
                >
                    {/* Royal gradient header */}
                    <div
                        className="relative px-8 pt-8 pb-7 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #2C241B 0%, #3D3020 50%, #4A3B28 100%)' }}
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.06]"
                            style={{ background: 'radial-gradient(circle, #C5A880, transparent 70%)' }} />



                        <DialogHeader>
                            <DialogTitle
                                className="text-2xl font-bold"
                                style={{ color: '#FDFDFB', fontFamily: "'Inter', serif", letterSpacing: '0.04em' }}
                            >
                                {editingLeaveId ? 'Update Leave' : 'Assign Leave'}
                            </DialogTitle>

                        </DialogHeader>
                    </div>

                    {/* Form body */}
                    <div className="px-8 py-7 space-y-5">

                        {/* Team Member */}
                        <div className="space-y-1.5">
                            <Label className={labelClasses}>Team Member</Label>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="w-full flex items-center justify-between pl-4 pr-3 h-11 rounded-md border text-sm font-medium transition-all focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30"
                                        style={{ background: 'white', borderColor: '#E3DAC9', color: newLeave.userId ? '#2C241B' : '#A59582' }}
                                    >
                                        <span>{selectedMemberName || 'Select member…'}</span>
                                        <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: '#A59582' }} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-56 overflow-y-auto border shadow-xl rounded-xl p-1"
                                    style={{ borderColor: '#E3DAC9', background: '#FDFDFB' }}
                                >
                                    {profiles.map(p => (
                                        <DropdownMenuItem
                                            key={p.id}
                                            onClick={() => setNewLeave({ ...newLeave, userId: p.id })}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors"
                                            style={{ color: '#2C241B' }}
                                        >
                                            {p.full_name}
                                            {newLeave.userId === p.id && <Check className="w-3.5 h-3.5 ml-2" style={{ color: '#C5A880' }} />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelClasses}>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-11 px-4 rounded-md border text-sm font-medium text-left justify-start transition-all focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30",
                                                !newLeave.startDate && "text-[#A59582]"
                                            )}
                                            style={{ background: 'white', borderColor: '#E3DAC9', color: '#2C241B' }}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" style={{ color: '#A59582' }} />
                                            {newLeave.startDate ? format(newLeave.startDate, "PPP") : <span style={{ color: '#A59582' }}>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-xl border shadow-xl" style={{ borderColor: '#E3DAC9' }} align="start">
                                        <Calendar
                                            mode="single"
                                            selected={newLeave.startDate}
                                            onSelect={(date) => {
                                                if (!date) return;
                                                setNewLeave((prev) => ({
                                                    ...prev,
                                                    startDate: date,
                                                    endDate: prev.endDate && isBefore(startOfDay(prev.endDate), startOfDay(date))
                                                        ? date
                                                        : prev.endDate
                                                }));
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-1.5">
                                <Label className={labelClasses}>End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full h-11 px-4 rounded-md border text-sm font-medium text-left justify-start transition-all focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30",
                                                !newLeave.endDate && "text-[#A59582]"
                                            )}
                                            style={{ background: 'white', borderColor: '#E3DAC9', color: '#2C241B' }}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" style={{ color: '#A59582' }} />
                                            {newLeave.endDate ? format(newLeave.endDate, "PPP") : <span style={{ color: '#A59582' }}>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-xl border shadow-xl" style={{ borderColor: '#E3DAC9' }} align="start">
                                        <Calendar
                                            mode="single"
                                            selected={newLeave.endDate}
                                            onSelect={(date) => date && setNewLeave((prev) => ({ ...prev, endDate: date }))}
                                            disabled={(date) =>
                                                newLeave.startDate
                                                    ? isBefore(startOfDay(date), startOfDay(newLeave.startDate))
                                                    : false
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Leave Type */}
                        <div className="space-y-1.5">
                            <Label className={labelClasses}>Leave Type</Label>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="w-full flex items-center justify-between pl-4 pr-3 h-11 rounded-md border text-sm font-medium transition-all focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30"
                                        style={{ background: 'white', borderColor: '#E3DAC9', color: '#2C241B' }}
                                    >
                                        <span>{newLeave.type}</span>
                                        <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" style={{ color: '#A59582' }} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[var(--radix-dropdown-menu-trigger-width)] border shadow-xl rounded-xl p-1"
                                    style={{ borderColor: '#E3DAC9', background: '#FDFDFB' }}
                                >
                                    {LEAVE_TYPES.map(t => (
                                        <DropdownMenuItem
                                            key={t}
                                            onClick={() => setNewLeave({ ...newLeave, type: t })}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors"
                                            style={{ color: '#2C241B' }}
                                        >
                                            {t}
                                            {newLeave.type === t && <Check className="w-3.5 h-3.5 ml-2" style={{ color: '#C5A880' }} />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-8 h-px" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} />

                    {/* Footer */}
                    <DialogFooter className="px-8 py-5 gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsAddDialogOpen(false)}
                            disabled={actionLoading}
                            className="rounded-3xl px-6 h-10 text-xs font-bold uppercase tracking-widest border"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveLeave}
                            disabled={actionLoading}
                            className="rounded-3xl px-8 h-10 text-xs font-bold uppercase tracking-widest border-0 shadow-lg"
                        >
                            {actionLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            {editingLeaveId ? 'Update' : 'Assign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════════════════
                Delete Confirmation Dialog
            ══════════════════════════════════════════════════ */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent
                    className="p-0 gap-0 overflow-hidden border-0 shadow-2xl max-w-md"
                    style={{ borderRadius: '1.25rem', background: '#FDFDFB' }}
                >
                    {/* Danger gradient header */}
                    <div
                        className="relative px-8 pt-8 pb-7 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #3D1515 0%, #5C1F1F 100%)' }}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.06]"
                            style={{ background: 'radial-gradient(circle, #E87070, transparent 70%)' }} />
                        <AlertDialogHeader>
                            <AlertDialogTitle
                                className="text-2xl font-bold"
                                style={{ color: '#FDFDFB', fontFamily: "'Inter', serif" }}
                            >
                                Cancel Leave?
                            </AlertDialogTitle>
                            <AlertDialogDescription
                                className="text-sm font-light mt-1"
                                style={{ color: 'rgba(255,255,255,0.55)' }}
                            >
                                This will permanently remove the assigned absence protocol from the system.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>

                    <div className="mx-8 h-px" style={{ background: '#F0EAE0' }} />

                    <AlertDialogFooter className="px-8 py-5 gap-3">
                        <AlertDialogCancel
                            className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-widest border transition-all hover:bg-[#FAF9F5]"
                            style={{ color: '#8C7654', borderColor: '#E3DAC9', fontFamily: "'Inter', serif" }}
                        >
                            Keep It
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteLeave}
                            className="rounded-full px-8 h-10 text-xs font-bold uppercase tracking-widest border-0 shadow-lg transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #C0392B, #96281B)', color: '#FDFDFB', fontFamily: "'Inter', serif" }}
                        >
                            {actionLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Terminate Protocol
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Leaves;
