import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/hooks/use-title';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, parseISO, isValid, differenceInCalendarDays, isAfter, isBefore, startOfDay, isWeekend as isWeekendFn, compareAsc } from 'date-fns';
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

/** Groups an array of dates into contiguous calendar-day blocks. */
const groupIntoContinuousRanges = (days: Date[]): { start: Date; end: Date }[] => {
    if (days.length === 0) return [];
    const sorted = [...days].sort(compareAsc);
    const ranges: { start: Date; end: Date }[] = [];
    let rangeStart = sorted[0];
    let rangeEnd = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        if (differenceInCalendarDays(sorted[i], rangeEnd) === 1) {
            rangeEnd = sorted[i];
        } else {
            ranges.push({ start: rangeStart, end: rangeEnd });
            rangeStart = sorted[i];
            rangeEnd = sorted[i];
        }
    }
    ranges.push({ start: rangeStart, end: rangeEnd });
    return ranges;
};

/** Extracts and sorts unique working days from an array of leave records. */
const extractWorkingDays = (leaveList: { start_date: string; end_date: string }[]) => {
    const daysMap = new Map<string, Date>();
    leaveList.forEach(l => {
        const s = parseISO(l.start_date);
        const e = parseISO(l.end_date);
        const days = eachDayOfInterval({ start: s, end: e }).filter(d => !isWeekendFn(d));
        days.forEach(d => {
            daysMap.set(format(d, 'yyyy-MM-dd'), d);
        });
    });
    return Array.from(daysMap.values()).sort(compareAsc);
};

/** Returns uppercase initials (e.g. "RG") for a member full name. */
const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

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
    const [deletingLeaveRecords, setDeletingLeaveRecords] = useState<Leave[]>([]);
    const [datesToDelete, setDatesToDelete] = useState<Date[]>([]);
    const [allUserLeaveDays, setAllUserLeaveDays] = useState<Date[]>([]);
    const [deleteDialogMonth, setDeleteDialogMonth] = useState<Date>(new Date());
    const [editingLeaveIds, setEditingLeaveIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [dialogCalendarMonth, setDialogCalendarMonth] = useState(new Date());

    const [newLeave, setNewLeave] = useState({
        userId: '',
        selectedDays: [] as Date[],
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

    // Fetch holidays for the current month (main calendar)
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

    // Fetch holidays for the dialog calendars (assign/edit and delete) — covers both visible months in the 2-month view
    const activeDialogMonth = isDeleteDialogOpen ? deleteDialogMonth : dialogCalendarMonth;
    const { data: dialogHolidays = {} } = useQuery({
        queryKey: ['holidays-dialog', format(activeDialogMonth, 'yyyy-MM')],
        queryFn: async () => {
            const start = startOfMonth(activeDialogMonth);
            const end = endOfMonth(addMonths(activeDialogMonth, 1)); // +1 for right-side month
            const { data } = await supabase
                .from('holidays' as any)
                .select('date, description')
                .gte('date', format(start, 'yyyy-MM-dd'))
                .lte('date', format(end, 'yyyy-MM-dd'));
            const map: Record<string, string> = {};
            data?.forEach((h: any) => map[h.date] = h.description);
            return map;
        },
        enabled: isAddDialogOpen || isDeleteDialogOpen
    });

    const dialogHolidayDates = useMemo(() =>
        Object.keys(dialogHolidays).map(d => parseISO(d)),
        [dialogHolidays]
    );

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
        if (!newLeave.userId || newLeave.selectedDays.length === 0) {
            toast({ title: "Please fill all fields", description: "Select a member and at least one working day.", variant: "destructive" });
            return;
        }

        setActionLoading(true);

        try {
            // If editing, remove the old leave records and their log entries first
            if (editingLeaveIds.length > 0) {
                const { data: oldLeaves } = await supabase
                    .from('team_leaves')
                    .select('*')
                    .in('id', editingLeaveIds);

                await supabase
                    .from('team_leaves')
                    .delete()
                    .in('id', editingLeaveIds);

                if (oldLeaves && oldLeaves.length > 0) {
                    for (const oldLeave of oldLeaves) {
                        await supabase
                            .from('daily_task_status')
                            .delete()
                            .eq('user_id', oldLeave.user_id)
                            .gte('date', oldLeave.start_date)
                            .lte('date', oldLeave.end_date)
                            .contains('new_dev', ['ON LEAVE']);
                    }
                }
            }

            // Group selected days into contiguous blocks → one leave row per block
            const ranges = groupIntoContinuousRanges(newLeave.selectedDays);
            const leaveInserts = ranges.map(range => ({
                user_id: newLeave.userId,
                start_date: format(range.start, 'yyyy-MM-dd'),
                end_date: format(range.end, 'yyyy-MM-dd'),
                type: newLeave.type,
                assigned_by: user?.id
            }));

            const { error } = await supabase.from('team_leaves').insert(leaveInserts);

            if (error) {
                toast({ title: editingLeaveIds.length > 0 ? "Failed to update leave" : "Failed to assign leave", description: error.message, variant: "destructive" });
            } else {
                // Upsert daily_task_status for each individually selected day
                const statusEntries = newLeave.selectedDays.map(date => ({
                    user_id: newLeave.userId,
                    date: format(startOfDay(date), 'yyyy-MM-dd'),
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
                    toast({ title: editingLeaveIds.length > 0 ? "Leave & Logs updated successfully!" : "Leave & Logs synchronized successfully!" });
                }

                setIsAddDialogOpen(false);
                setEditingLeaveIds([]);
                setNewLeave({ userId: '', selectedDays: [], type: 'Vacation' });
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditLeave = async (leave: Leave) => {
        const start = parseISO(leave.start_date);

        // Immediate local match from current month's leaves so UI opens instantly
        const localMatches = leaves.filter(
            l => l.user_id === leave.user_id && l.type === leave.type
        );
        const initialLeaves = localMatches.length > 0 ? localMatches : [leave];

        setEditingLeaveIds(initialLeaves.map(l => l.id));
        setNewLeave({
            userId: leave.user_id,
            selectedDays: extractWorkingDays(initialLeaves),
            type: leave.type
        });
        setDialogCalendarMonth(start);
        lastClickedDayRef.current = null;
        setIsAddDialogOpen(true);

        // Also query DB for all leaves in the visible 2-month window for this user & type
        try {
            const windowStart = format(startOfMonth(start), 'yyyy-MM-dd');
            const windowEnd = format(endOfMonth(addMonths(start, 1)), 'yyyy-MM-dd');
            const { data: dbLeaves } = await supabase
                .from('team_leaves')
                .select('*')
                .eq('user_id', leave.user_id)
                .eq('type', leave.type)
                .lte('start_date', windowEnd)
                .gte('end_date', windowStart);

            if (dbLeaves && dbLeaves.length > 0) {
                setEditingLeaveIds(dbLeaves.map(l => l.id));
                setNewLeave(prev => ({
                    ...prev,
                    selectedDays: extractWorkingDays(dbLeaves)
                }));
            }
        } catch (e) {
            console.error("Failed to fetch all related leaves for editing:", e);
        }
    };

    // Anchor for Ctrl/Cmd+click range fill
    const lastClickedDayRef = useRef<Date | null>(null);

    // Centralised disabled-day predicate — used by Calendar and by the handler guard
    const isDisabledDay = (date: Date) =>
        isWeekendFn(date) || dialogHolidayDates.some(h => isSameDay(h, date));

    const handleLeaveSelect = (
        days: Date[] | undefined,
        clickedDay: Date,
        _modifiers: Record<string, boolean>,
        e: React.MouseEvent | React.KeyboardEvent
    ) => {
        // Hard guard — never allow disabled days through (weekends / holidays)
        if (isDisabledDay(clickedDay)) return;

        const isRangeFill = (e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).metaKey;

        if (isRangeFill && lastClickedDayRef.current) {
            // Fill every working, non-holiday day between anchor and clicked day
            const anchor = lastClickedDayRef.current;
            const start = compareAsc(anchor, clickedDay) <= 0 ? anchor : clickedDay;
            const end = compareAsc(anchor, clickedDay) <= 0 ? clickedDay : anchor;
            const rangeDays = eachDayOfInterval({ start, end }).filter(d => !isDisabledDay(d));
            setNewLeave(prev => {
                const merged = [...prev.selectedDays];
                rangeDays.forEach(d => {
                    if (!merged.some(s => isSameDay(s, d))) merged.push(d);
                });
                return { ...prev, selectedDays: merged };
            });
            // Keep the same anchor so repeated Ctrl+clicks extend from the same point
        } else {
            // Normal toggle — use what react-day-picker computed
            setNewLeave(prev => ({ ...prev, selectedDays: days ?? [] }));
            lastClickedDayRef.current = clickedDay;
        }
    };

    const lastClickedDeleteDayRef = useRef<Date | null>(null);

    const handleDeleteDateSelect = (
        days: Date[] | undefined,
        clickedDay: Date,
        _modifiers: Record<string, boolean>,
        e: React.MouseEvent | React.KeyboardEvent
    ) => {
        // Only allow toggling dates that are part of this user's leave
        if (!allUserLeaveDays.some(d => isSameDay(d, clickedDay))) return;

        const isRangeFill = (e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).metaKey;

        if (isRangeFill && lastClickedDeleteDayRef.current) {
            const anchor = lastClickedDeleteDayRef.current;
            const start = compareAsc(anchor, clickedDay) <= 0 ? anchor : clickedDay;
            const end = compareAsc(anchor, clickedDay) <= 0 ? clickedDay : anchor;
            const rangeDays = eachDayOfInterval({ start, end }).filter(d =>
                allUserLeaveDays.some(ald => isSameDay(ald, d))
            );
            setDatesToDelete(prev => {
                const merged = [...prev];
                rangeDays.forEach(d => {
                    if (!merged.some(s => isSameDay(s, d))) merged.push(d);
                });
                return merged;
            });
        } else {
            const validSelected = (days ?? []).filter(d =>
                allUserLeaveDays.some(ald => isSameDay(ald, d))
            );
            setDatesToDelete(validSelected);
            lastClickedDeleteDayRef.current = clickedDay;
        }
    };

    const confirmDeleteLeave = async (leave: Leave) => {
        const start = parseISO(leave.start_date);

        // Immediate local match from current month's leaves so UI opens instantly
        const localMatches = leaves.filter(
            l => l.user_id === leave.user_id && l.type === leave.type
        );
        const initialLeaves = localMatches.length > 0 ? localMatches : [leave];
        const allWorkingDays = extractWorkingDays(initialLeaves);

        setDeletingLeaveRecords(initialLeaves);
        setDatesToDelete(allWorkingDays);
        setAllUserLeaveDays(allWorkingDays);
        setDeleteDialogMonth(start);
        lastClickedDeleteDayRef.current = null;
        setIsDeleteDialogOpen(true);

        // Also query DB for all leaves in the visible 2-month window for this user & type
        try {
            const windowStart = format(startOfMonth(start), 'yyyy-MM-dd');
            const windowEnd = format(endOfMonth(addMonths(start, 1)), 'yyyy-MM-dd');
            const { data: dbLeaves } = await supabase
                .from('team_leaves')
                .select('*')
                .eq('user_id', leave.user_id)
                .eq('type', leave.type)
                .lte('start_date', windowEnd)
                .gte('end_date', windowStart);

            if (dbLeaves && dbLeaves.length > 0) {
                const dbWorkingDays = extractWorkingDays(dbLeaves);
                setDeletingLeaveRecords(dbLeaves);
                setDatesToDelete(dbWorkingDays);
                setAllUserLeaveDays(dbWorkingDays);
            }
        } catch (e) {
            console.error("Failed to fetch all related leaves for deletion:", e);
        }
    };

    const handleDeleteLeave = async () => {
        if (deletingLeaveRecords.length === 0 || datesToDelete.length === 0) return;

        setActionLoading(true);

        try {
            const recordIds = deletingLeaveRecords.map(r => r.id);
            const userId = deletingLeaveRecords[0].user_id;
            const leaveType = deletingLeaveRecords[0].type;

            // 1. Delete the old leave records for this user/period
            const { error: deleteError } = await supabase
                .from('team_leaves')
                .delete()
                .in('id', recordIds);

            if (deleteError) {
                toast({ title: "Failed to delete leave", description: deleteError.message, variant: "destructive" });
                return;
            }

            // 2. Delete task status logs for all datesToDelete
            for (const d of datesToDelete) {
                await supabase
                    .from('daily_task_status')
                    .delete()
                    .eq('user_id', userId)
                    .eq('date', format(startOfDay(d), 'yyyy-MM-dd'))
                    .contains('new_dev', ['ON LEAVE']);
            }

            // 3. Compute remaining leave days (allUserLeaveDays minus datesToDelete)
            const remainingDays = allUserLeaveDays.filter(
                d => !datesToDelete.some(dtd => isSameDay(dtd, d))
            );

            // 4. If there are remaining leave days, insert new contiguous ranges for them
            if (remainingDays.length > 0) {
                const newRanges = groupIntoContinuousRanges(remainingDays);
                const newInserts = newRanges.map(range => ({
                    user_id: userId,
                    start_date: format(range.start, 'yyyy-MM-dd'),
                    end_date: format(range.end, 'yyyy-MM-dd'),
                    type: leaveType,
                    assigned_by: user?.id
                }));

                await supabase.from('team_leaves').insert(newInserts);
            }

            toast({
                title: remainingDays.length > 0
                    ? "Selected leave dates removed successfully!"
                    : "Leave completely removed successfully!"
            });

            setIsDeleteDialogOpen(false);
            setDeletingLeaveRecords([]);
            setDatesToDelete([]);
            setAllUserLeaveDays([]);
        } catch (e: any) {
            console.error("Delete leave error:", e);
            toast({ title: "Error deleting leave", description: e.message, variant: "destructive" });
        } finally {
            setActionLoading(false);
        }
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

    // Compute range-start / range-middle / range-end sets from the selected days so
    // the calendar cell CSS can draw the pill band between contiguous groups.
    const leaveRangeModifiers = useMemo(() => {
        const groups = groupIntoContinuousRanges(newLeave.selectedDays);
        // Only multi-day groups get the band treatment; single days stay as plain circles
        const multiGroups = groups.filter(g => !isSameDay(g.start, g.end));
        const rangeStart = multiGroups.map(g => g.start);
        const rangeEnd = multiGroups.map(g => g.end);
        const rangeMiddle = newLeave.selectedDays.filter(d =>
            !rangeStart.some(s => isSameDay(s, d)) &&
            !rangeEnd.some(e => isSameDay(e, d)) &&
            multiGroups.some(g => d > g.start && d < g.end)
        );
        return { rangeStart, rangeEnd, rangeMiddle };
    }, [newLeave.selectedDays]);

    const deleteRangeModifiers = useMemo(() => {
        const groups = groupIntoContinuousRanges(datesToDelete);
        const multiGroups = groups.filter(g => !isSameDay(g.start, g.end));
        const rangeStart = multiGroups.map(g => g.start);
        const rangeEnd = multiGroups.map(g => g.end);
        const rangeMiddle = datesToDelete.filter(d =>
            !rangeStart.some(s => isSameDay(s, d)) &&
            !rangeEnd.some(e => isSameDay(e, d)) &&
            multiGroups.some(g => d > g.start && d < g.end)
        );
        return { rangeStart, rangeEnd, rangeMiddle };
    }, [datesToDelete]);

    return (
        <div className="relative min-h-screen">
            <div className="relative space-y-10 mx-auto p-6 md:p-10 max-w-7xl pb-20 z-10">

                {/* Page Header */}
                <div className="flex items-center justify-center">
                    <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold shadow-sm">
                        Leave Calendar
                    </Badge>
                </div>

                {/* ── Top Section: Selected Day Details & Quick Stat ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Selected Day Details Card (8 cols) */}
                    <Card className="lg:col-span-8 border border-[#E5DCCB] overflow-hidden shadow-xl rounded-3xl">
                        <CardHeader className="px-7 pt-6 pb-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-xl md:text-2xl font-bold" style={{ color: '#2C241B', fontFamily: "'Inter', serif" }}>
                                            {format(selectedDate, "do MMMM yyyy")}
                                        </h3>
                                        {holidays[format(selectedDate, 'yyyy-MM-dd')] && (
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                                                style={{ background: 'rgba(139,92,246,0.12)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.25)' }}
                                            >
                                                {holidays[format(selectedDate, 'yyyy-MM-dd')]}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-medium tracking-[0.2em] uppercase mt-0.5" style={{ color: '#A59582' }}>
                                        {format(selectedDate, "EEEE")} • {leavesOnSelectedDate.length} Member{leavesOnSelectedDate.length !== 1 ? 's' : ''} on Leave
                                    </p>
                                </div>

                                {canManageLeaves && (
                                    <Button
                                        onClick={() => {
                                            setEditingLeaveIds([]);
                                            setNewLeave({
                                                userId: '',
                                                selectedDays: [],
                                                type: 'Vacation'
                                            });
                                            setDialogCalendarMonth(selectedDate);
                                            lastClickedDayRef.current = null;
                                            setIsAddDialogOpen(true);
                                        }}
                                        variant='default'
                                        className="rounded-full px-5 h-9 text-xs font-bold uppercase tracking-wider shadow-md gap-1.5"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>Assign Leave</span>
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <div className="mx-7 h-px" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} />

                        <CardContent className="px-7 pt-4 pb-6">
                            {loadingLeaves ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C5A880' }} />
                                </div>
                            ) : leavesOnSelectedDate.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {leavesOnSelectedDate.map(leave => (
                                        <div
                                            key={leave.id}
                                            className="flex items-center justify-between p-3 rounded-2xl border border-[#E3DAC9] group transition-all"
                                            style={{ background: 'rgba(197,168,128,0.04)' }}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div
                                                    className="w-9 h-9 text-[10px] rounded-xl bg-[#E3DAC9]/20 text-[#BFA378] flex items-center justify-center font-bold uppercase shadow-xs flex-shrink-0"
                                                >
                                                    {getInitials(leave.profiles?.full_name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-xs truncate" style={{ color: '#2C241B' }}>
                                                        {leave.profiles?.full_name}
                                                    </p>
                                                    <p className="text-[10px] font-medium flex items-center gap-1 mt-0.5" style={{ color: '#A59582' }}>
                                                        {leave.type.toLowerCase() === 'personal leave' || leave.type.toLowerCase() === 'vacation' ? <TentTree className="w-3 h-3" /> : leave.type.toLowerCase() === "sick leave" ? <Hospital className="w-3 h-3" /> : <Siren className="w-3 h-3" />}
                                                        <span className="truncate">{leave.type}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            {canManageLeaves && (
                                                <div className="flex items-center gap-1 ml-2">
                                                    <span className="border border-[#E3DAC9] hover:bg-[#E3DAC9] rounded-full p-1.5 hover:cursor-pointer transition-all" onClick={() => handleEditLeave(leave)} title="Edit Leave">
                                                        <Pencil className="w-3 h-3" />
                                                    </span>
                                                    <span className="border border-red-600/20 hover:bg-red-600/20 rounded-full p-1.5 hover:cursor-pointer transition-all" onClick={() => confirmDeleteLeave(leave)} title="Delete Leave">
                                                        <Trash2 className="w-3 h-3" color="red" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 px-4 rounded-2xl border border-dashed" style={{ borderColor: '#E3DAC9' }}>
                                    <p className="text-xs font-light" style={{ color: '#A59582' }}>
                                        No absence records for {format(selectedDate, "do MMMM")}. Click any day below or click "Assign Leave" to add.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stat Card (4 cols) */}
                    <Card className="lg:col-span-4 border border-[#E5DCCB] overflow-hidden shadow-xl rounded-3xl flex flex-col justify-between" >
                        <CardHeader className="px-7 pt-6 pb-2">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: '#A59582' }}>Monthly Personnel</p>
                        </CardHeader>
                        <CardContent className="px-7 pb-6 pt-0 space-y-3">
                            {loadingLeaves ? (
                                <Loader2 className="w-5 h-5 animate-spin mt-1" style={{ color: '#C5A880' }} />
                            ) : (
                                <div>
                                    <p className="text-3xl font-bold" style={{ color: '#2C241B', fontFamily: "'Inter', serif" }}>
                                        {userSummaries.length} <span className="text-sm font-medium" style={{ color: '#8C7654' }}>Members on leave</span>
                                    </p>
                                    <p className="text-xs font-medium mt-1" style={{ color: '#A59582' }}>
                                        in {format(currentMonth, "MMMM yyyy")}
                                    </p>
                                </div>
                            )}
                            <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: '#F0EAE0' }}>
                                <span className="text-[#A59582]">Total days off:</span>
                                <span className="font-bold text-[#8C7654]">
                                    {userSummaries.reduce((sum, u) => sum + u.totalDays, 0)} days
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Full Width Calendar Section ── */}
                <Card className="w-full border border-[#E5DCCB] overflow-hidden shadow-xl rounded-3xl">
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

                    <CardContent className="px-6 md:px-8 pb-8 pt-2">
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="text-center py-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#A59582' }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="h-px mb-4" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} />

                        {/* Day cells */}
                        <div className="grid grid-cols-7 gap-1 md:gap-2.5">
                            {leadingDays.map((_, i) => (
                                <div key={`empty-${i}`} className="min-h-[110px] md:min-h-[125px] rounded-2xl opacity-20 border border-dashed border-[#E3DAC9]" />
                            ))}
                            {days.map(day => {
                                const dayLeaves = getDayStatus(day);
                                const dayStr = format(day, 'yyyy-MM-dd');
                                const holiday = holidays[dayStr];
                                const isSelected = isSameDay(day, selectedDate);
                                const isToday = isSameDay(day, new Date());
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                return (
                                    <div
                                        key={day.toISOString()}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedDate(day)}
                                        onDoubleClick={() => {
                                            if (canManageLeaves) {
                                                const isHoliday = holidays[dayStr];
                                                setSelectedDate(day);
                                                setEditingLeaveIds([]);
                                                const isWorkday = !isWeekendFn(day);
                                                setNewLeave({
                                                    userId: '',
                                                    selectedDays: isWorkday && !isHoliday ? [day] : [],
                                                    type: 'Vacation'
                                                });
                                                setDialogCalendarMonth(day);
                                                lastClickedDayRef.current = isWorkday ? day : null;
                                                setIsAddDialogOpen(true);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelectedDate(day);
                                            }
                                        }}
                                        className={cn(
                                            "relative flex flex-col p-2 md:p-2.5 rounded-2xl md:rounded-3xl transition-all group text-left cursor-pointer select-none",
                                            "min-h-[115px] md:min-h-[130px]",
                                            isSelected
                                                ? "z-10 ring-2 ring-[#C5A880] shadow-xl"
                                                : "hover:scale-[1.01] hover:shadow-md"
                                        )}
                                        style={
                                            isSelected
                                                ? { background: '#2C241B', color: '#EFEAE2', boxShadow: '0 8px 24px rgba(44,36,27,0.35)' }
                                                : holiday
                                                    ? { background: 'rgba(139,92,246,0.05)', color: '#7C3AED', border: '1px solid rgba(139,92,246,0.2)' }
                                                    : isToday
                                                        ? { background: 'rgba(197,168,128,0.08)', color: '#8C7654', border: '1px solid rgba(197,168,128,0.35)' }
                                                        : isWeekend
                                                            ? { background: 'rgba(44,36,27,0.02)', color: '#A59582', border: '1px solid rgba(227,218,201,0.4)' }
                                                            : { background: '#FDFDFB', color: '#5C4A36', border: '1px solid #E5DCCB' }
                                        }
                                    >
                                        {/* Day Cell Header: Day Number + Holiday Badge */}
                                        <div className="flex items-center justify-between w-full mb-1.5">
                                            <span
                                                className={cn(
                                                    "font-bold text-xs md:text-sm w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-all",
                                                    isToday && !isSelected && "bg-[#C5A880] text-white font-extrabold shadow-sm",
                                                    isSelected && "bg-[#FDFDFB] text-[#2C241B]"
                                                )}
                                            >
                                                {format(day, "d")}
                                            </span>

                                            {holiday && (
                                                <span
                                                    className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md truncate max-w-[70px] md:max-w-[95px]"
                                                    style={
                                                        isSelected
                                                            ? { background: 'rgba(255,255,255,0.2)', color: '#FDFDFB' }
                                                            : { background: 'rgba(139,92,246,0.15)', color: '#7C3AED' }
                                                    }
                                                    title={holiday}
                                                >
                                                    {holiday}
                                                </span>
                                            )}
                                        </div>

                                        {/* Day Cell Content: Personnel on Leave with Avatar + Name */}
                                        <div className="w-full space-y-1 flex-1 overflow-hidden">
                                            {dayLeaves.slice(0, 2).map((l) => {
                                                const isSick = l.type.toLowerCase().includes('sick');
                                                return (
                                                    <div
                                                        key={l.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedDate(day);
                                                        }}
                                                        onDoubleClick={(e) => {
                                                            e.stopPropagation();
                                                            if (canManageLeaves) {
                                                                handleEditLeave(l);
                                                            }
                                                        }}
                                                        className="w-full flex items-center gap-1.5 px-1 py-1 rounded-2xl text-left overflow-hidden transition-all shadow-xs cursor-pointer hover:brightness-95 active:scale-[0.98]"
                                                        style={
                                                            isSelected
                                                                ? { background: 'rgba(255,255,255,0.12)', color: '#FDFDFB', border: '1px solid rgba(255,255,255,0.2)' }
                                                                : isSick
                                                                    ? { background: 'rgba(59,130,246,0.1)', color: '#1E40AF', border: '1px solid rgba(59,130,246,0.25)' }
                                                                    : { background: 'rgba(197,168,128,0.15)', color: '#4A3B28', border: '1px solid rgba(197,168,128,0.35)' }
                                                        }
                                                        title={`${l.profiles?.full_name || 'Member'} (${l.type}) • Double-click to edit`}
                                                    >
                                                        <div
                                                            className="w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[7px] md:text-[8px] font-bold uppercase tracking-tight"
                                                            style={
                                                                isSelected
                                                                    ? { background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }
                                                                    : isSick
                                                                        ? { background: 'rgba(59,130,246,0.25)', color: '#1E40AF' }
                                                                        : { background: 'rgba(197,168,128,0.35)', color: '#3D3020' }
                                                            }
                                                        >
                                                            {getInitials(l.profiles?.full_name)}
                                                        </div>
                                                        <span className="truncate text-[10px] md:text-[11px] font-semibold leading-tight">
                                                            {l.profiles?.full_name || 'Member'}
                                                        </span>
                                                    </div>
                                                );
                                            })}

                                            {dayLeaves.length > 2 && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedDate(day);
                                                            }}
                                                            className={cn(
                                                                "inline-flex items-center gap-1 text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-md transition-all hover:scale-105 cursor-pointer shadow-xs",
                                                                isSelected
                                                                    ? "bg-white/20 text-[#FDFDFB] hover:bg-white/30"
                                                                    : "bg-[#8C7654]/10 text-[#8C7654] hover:bg-[#8C7654]/20 border border-[#8C7654]/20"
                                                            )}
                                                            title="Click to view all personnel on leave"
                                                        >
                                                            <span>+{dayLeaves.length - 2} more</span>
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        align="start"
                                                        side="bottom"
                                                        className="w-64 p-3 rounded-2xl border shadow-xl space-y-2 z-50"
                                                        style={{ background: '#FDFDFB', borderColor: '#E3DAC9' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: '#F0EAE0' }}>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C7654]">
                                                                {format(day, "MMM do, yyyy")} • {dayLeaves.length} on Leave
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                                            {dayLeaves.map((l) => {
                                                                const isSick = l.type.toLowerCase().includes('sick');
                                                                return (
                                                                    <div
                                                                        key={l.id}
                                                                        onClick={() => setSelectedDate(day)}
                                                                        onDoubleClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (canManageLeaves) handleEditLeave(l);
                                                                        }}
                                                                        className="flex items-center justify-between p-2 rounded-xl border border-[#E3DAC9] hover:border-[#C5A880] transition-all cursor-pointer group"
                                                                        style={{
                                                                            background: isSick ? 'rgba(59,130,246,0.06)' : 'rgba(197,168,128,0.08)'
                                                                        }}
                                                                        title="Double-click to edit leave"
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                            <div
                                                                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold uppercase"
                                                                                style={{
                                                                                    background: isSick ? 'rgba(59,130,246,0.2)' : 'rgba(197,168,128,0.3)',
                                                                                    color: isSick ? '#1E40AF' : '#3D3020'
                                                                                }}
                                                                            >
                                                                                {getInitials(l.profiles?.full_name)}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="font-semibold text-xs truncate" style={{ color: '#2C241B' }}>
                                                                                    {l.profiles?.full_name}
                                                                                </p>
                                                                                <p className="text-[9px] font-medium" style={{ color: '#8C7654' }}>
                                                                                    {l.type}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {canManageLeaves && (
                                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <span
                                                                                    className="p-1 hover:bg-[#E3DAC9] rounded-full"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleEditLeave(l);
                                                                                    }}
                                                                                    title="Edit"
                                                                                >
                                                                                    <Pencil className="w-3 h-3 text-[#8C7654]" />
                                                                                </span>
                                                                                <span
                                                                                    className="p-1 hover:bg-red-100 rounded-full"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        confirmDeleteLeave(l);
                                                                                    }}
                                                                                    title="Delete"
                                                                                >
                                                                                    <Trash2 className="w-3 h-3 text-red-600" />
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <p className="text-[9px] text-[#A59582] italic text-center pt-0.5">
                                                            Tip: Double-click any member to edit
                                                        </p>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

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
                    setEditingLeaveIds([]);
                    setNewLeave({ userId: '', selectedDays: [], type: 'Vacation' });
                }
            }}>
                <DialogContent
                    className="p-0 gap-0 overflow-hidden border-0 shadow-2xl max-w-lg"
                >
                    {/* Royal gradient header */}
                    <div
                        className="relative px-8 pt-8 pb-7 overflow-hidden bg-cyan-800/80"
                    // style={{ background: 'linear-gradient(135deg, #2C241B 0%, #3D3020 50%, #4A3B28 100%)' }}
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.06]"
                            style={{ background: 'radial-gradient(circle, #C5A880, transparent 70%)' }} />



                        <DialogHeader>
                            <DialogTitle
                                className="text-2xl font-bold font-inter font-medium"
                                style={{ color: '#FDFDFB', letterSpacing: '0.04em' }}
                            >
                                {editingLeaveIds.length > 0 ? 'Update Leave' : 'Assign Leave'}
                            </DialogTitle>

                        </DialogHeader>
                    </div>

                    {/* Form body */}
                    <div className="px-8 py-7 space-y-5">

                        {/* Team Member */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className={labelClasses}>Team Member</Label>
                                {editingLeaveIds.length > 0 && (
                                    <span className="text-[10px] font-semibold text-[#8C7654]">
                                        Locked for update
                                    </span>
                                )}
                            </div>
                            {editingLeaveIds.length > 0 ? (
                                <div
                                    className="w-full flex items-center justify-between pl-4 pr-3 h-11 rounded-md border text-sm font-medium cursor-not-allowed select-none"
                                    style={{ background: 'rgba(44,36,27,0.03)', borderColor: '#E3DAC9', color: '#2C241B' }}
                                >
                                    <span>{selectedMemberName || 'Team Member'}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E3DAC9]/40 text-[#8C7654]">
                                        Fixed
                                    </span>
                                </div>
                            ) : (
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
                            )}
                        </div>

                        {/* ── Leave day picker (popover) ── */}
                        <div className="space-y-2">
                            <Label className={labelClasses}>Leave Days</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 px-4 justify-start text-left font-medium border bg-white/60 hover:bg-white"
                                        style={{ borderColor: '#E3DAC9', color: newLeave.selectedDays.length ? '#2C241B' : '#A59582' }}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" style={{ color: '#A59582' }} />
                                        <span className="truncate">
                                            {newLeave.selectedDays.length === 0
                                                ? 'Select leave days…'
                                                : `${newLeave.selectedDays.length} day${newLeave.selectedDays.length !== 1 ? 's' : ''} selected`}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    className="w-auto p-0 rounded-xl border shadow-xl"
                                    style={{ borderColor: '#E3DAC9' }}
                                >
                                    <Calendar
                                        mode="multiple"
                                        selected={newLeave.selectedDays}
                                        onSelect={handleLeaveSelect as any}
                                        month={dialogCalendarMonth}
                                        onMonthChange={setDialogCalendarMonth}
                                        disabled={isDisabledDay}
                                        modifiers={{
                                            holiday: dialogHolidayDates,
                                            rangeStart: leaveRangeModifiers.rangeStart,
                                            rangeEnd: leaveRangeModifiers.rangeEnd,
                                            rangeMiddle: leaveRangeModifiers.rangeMiddle,
                                        }}
                                        modifiersClassNames={{
                                            rangeStart: 'day-range-start',
                                            rangeEnd: 'day-range-end',
                                            rangeMiddle: 'day-range-middle',
                                        }}
                                        modifiersStyles={{
                                            holiday: {
                                                color: '#7C3AED',
                                                backgroundColor: 'rgba(139,92,246,0.09)',
                                                fontWeight: '600',
                                            },
                                            // Middle days: let the cell band colour show through
                                            rangeMiddle: {
                                                backgroundColor: 'transparent',
                                                color: '#2C241B',
                                            },
                                        }}
                                        showOutsideDays={false}
                                        numberOfMonths={2}
                                    />
                                    {/* Legend inside popover footer */}
                                    <div className="flex items-center gap-4 px-4 pb-3 pt-1 border-t" style={{ borderColor: '#F0EAE0' }}>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.6)' }} />
                                            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#A59582' }}>Holiday</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C5B8AA', opacity: 0.5 }} />
                                            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#A59582' }}>Weekend</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2C241B' }} />
                                            <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#A59582' }}>Selected</span>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Selected ranges summary chips — always visible below trigger */}
                            {newLeave.selectedDays.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {groupIntoContinuousRanges(newLeave.selectedDays).map((range, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                            style={{ background: 'rgba(44,36,27,0.05)', color: '#5C4A36', border: '1px solid rgba(197,168,128,0.4)' }}
                                        >
                                            {isSameDay(range.start, range.end)
                                                ? format(range.start, 'MMM d, EEE')
                                                : `${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d')}`}
                                        </span>
                                    ))}
                                </div>
                            )}
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
                            {editingLeaveIds.length > 0 ? 'Update' : 'Assign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════════════════
                Delete Confirmation Dialog
            ══════════════════════════════════════════════════ */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                setIsDeleteDialogOpen(open);
                if (!open) {
                    setDeletingLeaveRecords([]);
                    setDatesToDelete([]);
                    setAllUserLeaveDays([]);
                }
            }}>
                <AlertDialogContent
                    className="p-0 gap-0 overflow-hidden border-0 shadow-2xl max-w-lg"
                    style={{ borderRadius: '1.25rem', background: '#FDFDFB' }}
                >
                    {/* Danger gradient header */}
                    <div
                        className="relative px-8 pt-8 pb-7 overflow-hidden bg-red-800/90"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.06]"
                            style={{ background: 'radial-gradient(circle, #E87070, transparent 70%)' }} />
                        <AlertDialogHeader>
                            <AlertDialogTitle
                                className="text-2xl font-bold"
                                style={{ color: '#FDFDFB', fontFamily: "'Inter', serif" }}
                            >
                                Delete Leave
                            </AlertDialogTitle>
                            <AlertDialogDescription
                                className="text-sm font-light mt-1"
                                style={{ color: 'rgba(255,255,255,0.75)' }}
                            >
                                Select the date(s) you want to remove for this team member.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>

                    {deletingLeaveRecords.length > 0 && (() => {
                        const memberName = deletingLeaveRecords[0]?.profiles?.full_name || profiles.find(p => p.id === deletingLeaveRecords[0]?.user_id)?.full_name || 'Team Member';
                        const leaveType = deletingLeaveRecords[0]?.type || 'Vacation';

                        return (
                            <div className="px-8 py-6 space-y-5">
                                {/* Team Member Card */}
                                <div
                                    className="p-3.5 rounded-2xl border flex items-center gap-3"
                                    style={{ borderColor: '#E3DAC9', background: 'rgba(197,168,128,0.06)' }}
                                >
                                    <div
                                        className="w-10 h-10 text-xs rounded-2xl bg-[#E3DAC9]/30 text-[#8C7654] flex items-center justify-center font-bold uppercase shadow-sm flex-shrink-0"
                                    >
                                        {memberName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: '#A59582' }}>
                                            Team Member
                                        </p>
                                        <p className="font-bold text-sm truncate" style={{ color: '#2C241B' }}>
                                            {memberName}
                                        </p>
                                    </div>
                                    <span
                                        className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
                                        style={{ background: 'rgba(197,168,128,0.15)', color: '#8C7654', border: '1px solid rgba(197,168,128,0.3)' }}
                                    >
                                        {leaveType}
                                    </span>
                                </div>

                                {/* ── Leave day picker for deletion (same popover calendar) ── */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className={labelClasses}>Select Dates to Delete</Label>
                                        <div className="flex items-center gap-2">
                                            {datesToDelete.length !== allUserLeaveDays.length && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDatesToDelete(allUserLeaveDays)}
                                                    className="text-[10px] font-bold uppercase tracking-wider text-[#8C7654] hover:underline"
                                                >
                                                    Select All
                                                </button>
                                            )}
                                            {datesToDelete.length > 0 && (
                                                <span
                                                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                                                    style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)' }}
                                                >
                                                    {datesToDelete.length} of {allUserLeaveDays.length} day{allUserLeaveDays.length !== 1 ? 's' : ''} to delete
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full h-11 px-4 justify-start text-left font-medium border bg-white/60 hover:bg-white"
                                                style={{ borderColor: '#E3DAC9', color: datesToDelete.length ? '#2C241B' : '#A59582' }}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-[#C0392B]" />
                                                <span className="truncate">
                                                    {datesToDelete.length === 0
                                                        ? 'No dates selected to delete…'
                                                        : `${datesToDelete.length} day${datesToDelete.length !== 1 ? 's' : ''} selected to delete`}
                                                </span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            align="start"
                                            className="w-auto p-0 rounded-xl border shadow-xl"
                                            style={{ borderColor: '#E3DAC9' }}
                                        >
                                            <Calendar
                                                mode="multiple"
                                                selected={datesToDelete}
                                                onSelect={handleDeleteDateSelect as any}
                                                month={deleteDialogMonth}
                                                onMonthChange={setDeleteDialogMonth}
                                                disabled={(date) => !allUserLeaveDays.some(d => isSameDay(d, date))}
                                                modifiers={{
                                                    holiday: dialogHolidayDates,
                                                    rangeStart: deleteRangeModifiers.rangeStart,
                                                    rangeEnd: deleteRangeModifiers.rangeEnd,
                                                    rangeMiddle: deleteRangeModifiers.rangeMiddle,
                                                    leaveDay: allUserLeaveDays,
                                                }}
                                                modifiersClassNames={{
                                                    rangeStart: 'day-range-start',
                                                    rangeEnd: 'day-range-end',
                                                    rangeMiddle: 'day-range-middle',
                                                }}
                                                modifiersStyles={{
                                                    holiday: {
                                                        color: '#7C3AED',
                                                        backgroundColor: 'rgba(139,92,246,0.09)',
                                                        fontWeight: '600',
                                                    },
                                                    rangeMiddle: {
                                                        backgroundColor: 'transparent',
                                                        color: '#2C241B',
                                                    },
                                                }}
                                                showOutsideDays={false}
                                                numberOfMonths={2}
                                            />
                                            {/* Legend inside popover footer */}
                                            <div className="flex items-center gap-4 px-4 pb-3 pt-1 border-t" style={{ borderColor: '#F0EAE0' }}>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2C241B' }} />
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#A59582' }}>To Delete</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C5A880' }} />
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#A59582' }}>Leave Days</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C5B8AA', opacity: 0.3 }} />
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: '#A59582' }}>Other (Disabled)</span>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Selected ranges summary chips */}
                                    {datesToDelete.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {groupIntoContinuousRanges(datesToDelete).map((range, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                                    style={{ background: 'rgba(192,57,43,0.08)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.25)' }}
                                                >
                                                    <Trash2 className="w-2.5 h-2.5" />
                                                    {isSameDay(range.start, range.end)
                                                        ? format(range.start, 'MMM d, EEE')
                                                        : `${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d')}`}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs italic text-[#C0392B] pt-1">
                                            Please select at least one date to delete.
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

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
                            disabled={actionLoading || datesToDelete.length === 0}
                            className="rounded-full px-8 h-10 text-xs font-bold uppercase tracking-widest border-0 shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
                            style={{ background: 'linear-gradient(135deg, #C0392B, #96281B)', color: '#FDFDFB', fontFamily: "'Inter', serif" }}
                        >
                            {actionLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Delete {datesToDelete.length > 0 ? `${datesToDelete.length} Day${datesToDelete.length !== 1 ? 's' : ''}` : 'Leave'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Leaves;
