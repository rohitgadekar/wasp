import { useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Navigate } from 'react-router-dom';
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isWeekend,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileSearch,
  Loader2,
  Palmtree,
  ShieldAlert,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { SiChinaeasternairlines } from 'react-icons/si';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useTitle } from '@/hooks/use-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProfileOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface TaskStatus {
  id: string;
  user_id: string;
  date: string;
  new_dev: string[] | null;
  updates: string[] | null;
}

interface Leave {
  id: string;
  start_date: string;
  end_date: string;
  type: string;
}

type RangeMode = 'week' | 'month' | 'custom';

const GOLD = '#C5A880';
const GOLD_LIGHT = '#E5DCCB';
const IVORY = '#FDFDFB';
const IVORY2 = '#FAF9F5';
const BROWN = '#2C241B';
const BROWN_MID = '#8C7654';
const BROWN_LIGHT = '#A59582';
const WORK_MIX_COLORS = [GOLD, '#8C7654'];
const LEAVE_COLORS = ['#C5A880', '#A8896A', '#8C7654', '#D8C29D', '#625342', '#B6A58C'];

const svg = renderToStaticMarkup(
  <SiChinaeasternairlines style={{ width: 224, height: 224, color: '#C5A880', opacity: 0.09 }} />,
);

const isValidCase = (link: string) => {
  const val = link.trim().toLowerCase();
  return val !== '' && val !== 'na' && val !== 'n/a' && !val.includes('leave') && !val.includes('exercise') && val.includes('atlassian.spscommerce.com/browse/');
};

const getPresetRange = (mode: Exclude<RangeMode, 'custom'>) => {
  const today = startOfDay(new Date());
  return mode === 'week'
    ? { start: subDays(today, 6), end: today }
    : { start: startOfMonth(today), end: endOfMonth(today) };
};

const normalizeDate = (date: Date) => format(date, 'yyyy-MM-dd');
const getCaseKey = (link: string) => link.split('/browse/').pop()?.split(/[?#]/)[0] || link;

const AdvancedAnalytics = () => {
  const { role, loading: roleLoading, isOwner } = useUserRole();
  const initialMonth = getPresetRange('month');
  const [rangeMode, setRangeMode] = useState<RangeMode>('month');
  const [dateRange, setDateRange] = useState<DateRange>({ from: initialMonth.start, to: initialMonth.end });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const pdfReportRef = useRef<HTMLDivElement>(null);

  const startDate = dateRange.from ? normalizeDate(dateRange.from) : '';
  const endDate = dateRange.to ? normalizeDate(dateRange.to) : startDate;
  const hasCompleteRange = Boolean(dateRange.from && dateRange.to);

  const EXCLUDED_EMAILS = useMemo(() => [
        'rohit@apex.com',
        'pankaj@apex.com',
        'tschellenberg@spscommerce.com',
        'amit.gilda@bristlecone.com',
        'pankaj.patil@bristlecone.com',
        'aditya.sanjay.dahe@bristlecone.com'
    ].map(e => e.toLowerCase()), []);

  useTitle('Insight Studio');

  const applyPreset = (mode: Exclude<RangeMode, 'custom'>) => {
    const range = getPresetRange(mode);
    setRangeMode(mode);
    setDateRange({ from: range.start, to: range.end });
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setRangeMode('custom');
    setDateRange(range || {});
  };

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['advanced_analytics_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email').order('full_name', { ascending: true });
      if (error) throw error;
      return (data as ProfileOption[]).filter(
      (profile) => !EXCLUDED_EMAILS.includes(profile.email ?? '')
    );
    },
    enabled: isOwner,
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['advanced_analytics_report', selectedUserId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_task_status')
        .select('id, user_id, date, new_dev, updates')
        .eq('user_id', selectedUserId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      if (error) throw error;
      return data as TaskStatus[];
    },
    enabled: isOwner && !!selectedUserId && hasCompleteRange,
  });

  const { data: leaves = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ['advanced_analytics_leaves', selectedUserId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_leaves')
        .select('id, start_date, end_date, type')
        .eq('user_id', selectedUserId)
        .lte('start_date', endDate)
        .gte('end_date', startDate)
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data as Leave[];
    },
    enabled: isOwner && !!selectedUserId && hasCompleteRange,
  });

  const selectedProfile = profiles.find((profile) => profile.id === selectedUserId);

  const analytics = useMemo(() => {
    if (!dateRange.from || !dateRange.to) {
      return {
        daily: [], weekdayData: [], leaveTypes: [], totalNewDev: 0, totalUpdates: 0, totalCases: 0,
        submittedDays: 0, activeDays: 0, periodDays: 0, leaveDays: 0, leaveRecords: 0,
        availableWorkDays: 0, submissionRate: 0, averagePerActiveDay: 0, peakDay: null as null | { label: string; total: number },
      };
    }

    const reportsByDate = new Map<string, TaskStatus[]>();
    reports.forEach((report) => reportsByDate.set(report.date, [...(reportsByDate.get(report.date) || []), report]));
    const days = eachDayOfInterval({ start: startOfDay(dateRange.from), end: startOfDay(dateRange.to) });

    const daily = days.map((day) => {
      const date = normalizeDate(day);
      const reportsForDay = reportsByDate.get(date) || [];
      const newDev = reportsForDay.flatMap((report) => report.new_dev || []).filter(isValidCase);
      const updates = reportsForDay.flatMap((report) => report.updates || []).filter(isValidCase);
      const dayLeaves = leaves.filter((leave) => date >= leave.start_date && date <= leave.end_date);

      return {
        date,
        label: format(day, 'MMM d'),
        day: format(day, 'EEE'),
        new_dev: newDev.length,
        updates: updates.length,
        total: newDev.length + updates.length,
        submitted: reportsForDay.length > 0,
        isWorkday: !isWeekend(day),
        leaves: dayLeaves,
        newDevLinks: newDev,
        updateLinks: updates,
      };
    });

    const totalNewDev = daily.reduce((sum, day) => sum + day.new_dev, 0);
    const totalUpdates = daily.reduce((sum, day) => sum + day.updates, 0);
    const submittedDays = daily.filter((day) => day.submitted).length;
    const activeDays = daily.filter((day) => day.total > 0).length;
    const leaveDays = daily.filter((day) => day.leaves.length > 0).length;
    const availableWorkDays = daily.filter((day) => day.isWorkday && !day.leaves.length).length;
    const submittedWorkDays = daily.filter((day) => day.isWorkday && !day.leaves.length && day.submitted).length;
    const peakDay = daily.reduce<typeof daily[number] | null>((best, day) => (!best || day.total > best.total ? day : best), null);

    const leaveTypeTotals = new Map<string, number>();
    leaves.forEach((leave) => {
      const leaveStart = parseISO(leave.start_date) < startOfDay(dateRange.from) ? startOfDay(dateRange.from) : parseISO(leave.start_date);
      const leaveEnd = parseISO(leave.end_date) > startOfDay(dateRange.to) ? startOfDay(dateRange.to) : parseISO(leave.end_date);
      const overlappingDays = differenceInCalendarDays(leaveEnd, leaveStart) + 1;
      if (overlappingDays > 0) leaveTypeTotals.set(leave.type, (leaveTypeTotals.get(leave.type) || 0) + overlappingDays);
    });

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekdayData = weekdays.map((name) => {
      const matchingDays = daily.filter((day) => day.day === name);
      return {
        day: name,
        cases: matchingDays.reduce((sum, day) => sum + day.total, 0),
        submissions: matchingDays.filter((day) => day.submitted).length,
      };
    });

    return {
      daily,
      weekdayData,
      leaveTypes: Array.from(leaveTypeTotals, ([name, value]) => ({ name, value })),
      totalNewDev,
      totalUpdates,
      totalCases: totalNewDev + totalUpdates,
      submittedDays,
      activeDays,
      periodDays: daily.length,
      leaveDays,
      leaveRecords: leaves.length,
      availableWorkDays,
      submissionRate: availableWorkDays ? Math.round((submittedWorkDays / availableWorkDays) * 100) : 0,
      averagePerActiveDay: activeDays ? Number(((totalNewDev + totalUpdates) / activeDays).toFixed(1)) : 0,
      peakDay: peakDay && peakDay.total > 0 ? { label: peakDay.label, total: peakDay.total } : null,
    };
  }, [dateRange, leaves, reports]);

  const workMix = [
    { name: 'New Dev', value: analytics.totalNewDev },
    { name: 'Updates', value: analytics.totalUpdates },
  ];

  const rangeLabel = !dateRange.from
    ? 'Select a date range'
    : !dateRange.to
      ? `${format(dateRange.from, 'MMM d, yyyy')} — choose an end date`
      : `${format(dateRange.from, 'MMM d, yyyy')} — ${format(dateRange.to, 'MMM d, yyyy')}`;

  const exportToPDF = async () => {
    if (!pdfReportRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfReportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: IVORY,
        onclone: (document) => {
          document.querySelectorAll('[data-export-hide]').forEach((element) => element.remove());
          document.querySelectorAll<HTMLElement>('[data-export-expand]').forEach((element) => {
            element.style.maxHeight = 'none';
            element.style.overflow = 'visible';
          });
        },
      });
      // The dedicated export canvas is a compact, one-page report. It is embedded as one high-resolution PNG,
      // so a PDF viewer can zoom into every table row without splitting the report across pages.
      const pdf = new jsPDF('l', 'mm', 'letter');
      const margin = 8;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2 - 6;
      const image = canvas.toDataURL('image/png');
      const imageRatio = canvas.width / canvas.height;
      const printableRatio = printableWidth / printableHeight;
      const imageWidth = imageRatio > printableRatio ? printableWidth : printableHeight * imageRatio;
      const imageHeight = imageRatio > printableRatio ? printableWidth / imageRatio : printableHeight;
      const imageX = (pageWidth - imageWidth) / 2;
      const imageY = margin + (printableHeight - imageHeight) / 2;

      pdf.setFillColor(253, 253, 251);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.addImage(image, 'PNG', imageX, imageY, imageWidth, imageHeight);

      pdf.save(`analytics-${selectedProfile?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'report'}-${startDate}-to-${endDate}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  if (roleLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#C5A880]" /></div>;
  }

  if (!isOwner || role !== 'owner') return <Navigate to="/" replace />;

  const isLoading = loadingReports || loadingLeaves;

  return (
    <div className="relative min-h-screen overflow-hidden">
     

      <div className="max-w-[1500px] mx-auto p-6 md:p-12 space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight" style={{ color: BROWN }}>Insight Studio</h1>
            <p className="text-xs md:text-sm font-sans font-bold uppercase tracking-[0.22em] mt-3" style={{ color: BROWN_LIGHT }}>A complete view of delivery, reporting consistency, and time away</p>
          </div>
        </div>

        <Card className="border rounded-2xl overflow-visible shadow-xl" style={{ background: IVORY, borderColor: GOLD_LIGHT }}>
          <CardHeader className="px-6 md:px-8 pt-7 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border flex items-center justify-center" style={{ borderColor: GOLD_LIGHT, background: IVORY2 }}><FileSearch className="w-5 h-5 text-[#C5A880]" /></div>
              <div><CardTitle className="text-2xl" style={{ color: BROWN }}>Report Controls</CardTitle><CardDescription className="font-sans font-bold uppercase text-[10px] tracking-[0.2em]" style={{ color: BROWN_LIGHT }}>Choose a member and a reporting window</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="px-6 md:px-8 pb-8 grid gap-5 lg:grid-cols-[1fr_1.4fr_0.8fr] items-end">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: BROWN_MID }}>Team member</Label>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button type="button" disabled={loadingProfiles} className="w-full h-12 px-4 flex items-center justify-between rounded-md border bg-white/60 text-sm font-medium outline-none transition-colors focus:border-[#C5A880] disabled:opacity-60" style={{ borderColor: GOLD_LIGHT, color: selectedUserId ? BROWN : BROWN_LIGHT }}>
                    <span className="truncate">{selectedProfile?.full_name || selectedProfile?.email || 'Select a user'}</span><ChevronDown className="w-4 h-4 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto rounded-md border shadow-xl p-1" style={{ borderColor: GOLD_LIGHT, background: IVORY }}>
                  {profiles.map((profile) => <DropdownMenuItem key={profile.id} onClick={() => setSelectedUserId(profile.id)} className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm font-medium" style={{ color: BROWN }}>
                    <span className="truncate">{profile.full_name || profile.email || profile.id}</span>{selectedUserId === profile.id && <Check className="w-3.5 h-3.5 ml-2 shrink-0 text-[#C5A880]" />}
                  </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: BROWN_MID }}>Date range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full h-12 px-4 justify-start text-left font-medium border bg-white/60 hover:bg-white', !dateRange.from && 'text-[#A59582]')} style={{ borderColor: GOLD_LIGHT, color: dateRange.from ? BROWN : BROWN_LIGHT }}>
                    <CalendarRange className="mr-2 h-4 w-4 shrink-0 text-[#A59582]" /><span className="truncate">{rangeLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0 rounded-xl border shadow-xl" style={{ borderColor: GOLD_LIGHT }}>
                  <Calendar mode="range" selected={dateRange} onSelect={handleRangeSelect} numberOfMonths={2} showOutsideDays={false} defaultMonth={dateRange.from} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: BROWN_MID }}>Quick ranges</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['week', 'month'] as const).map((mode) => <Button key={mode} type="button" variant="solid" onClick={() => applyPreset(mode)} className="h-12 rounded-md uppercase text-[10px] tracking-widest" style={rangeMode === mode ? { background: BROWN, color: IVORY, borderColor: BROWN } : { borderColor: GOLD_LIGHT, color: BROWN }}>{mode === 'week' ? 'Last 7 days' : 'This month'}</Button>)}
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedUserId ? (
          <Card className="border rounded-2xl" style={{ background: IVORY, borderColor: GOLD_LIGHT }}><CardContent className="py-16 text-center space-y-3"><User className="w-10 h-10 mx-auto text-[#C5A880]" /><p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: BROWN_LIGHT }}>Select a user to generate analytics</p></CardContent></Card>
        ) : !hasCompleteRange ? (
          <Card className="border rounded-2xl" style={{ background: IVORY, borderColor: GOLD_LIGHT }}><CardContent className="py-16 text-center space-y-3"><CalendarRange className="w-10 h-10 mx-auto text-[#C5A880]" /><p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: BROWN_LIGHT }}>Choose both a start and end date</p></CardContent></Card>
        ) : isLoading ? (
          <div className="grid gap-6 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}</div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
              <div><h2 className="text-xl font-bold" style={{ color: BROWN }}>{selectedProfile?.full_name || selectedProfile?.email}</h2><p className="text-xs font-medium" style={{ color: BROWN_LIGHT }}>{rangeLabel}</p></div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="w-fit uppercase rounded-full px-3 h-9 py-1 border-[#E5DCCB] text-[#8C7654]">{analytics.periodDays} days analysed</Badge><Button data-export-hide type="button" variant="outline" onClick={exportToPDF} disabled={isExporting} className="h-9 border-[#E5DCCB] rounded-2xl text-[#8C7654] hover:bg-[#C5A880]/10 hover:text-[#2C241B]"><Download className="w-4 h-4 mr-2" />{isExporting ? 'Preparing…' : 'Export PDF'}</Button></div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Total Cases', value: analytics.totalCases, icon: Target, note: `${analytics.activeDays} active days` },
                { label: 'Reporting Rate', value: `${analytics.submissionRate}%`, icon: ClipboardCheck, note: `${analytics.submittedDays} submitted days` },
                { label: 'Leaves Taken', value: analytics.leaveDays, icon: Palmtree, note: `${analytics.leaveRecords} leave record${analytics.leaveRecords === 1 ? '' : 's'}` },
                { label: 'New Development', value: analytics.totalNewDev, icon: Activity, note: 'Valid cases logged' },
                { label: 'Updates', value: analytics.totalUpdates, icon: TrendingUp, note: 'Valid cases logged' },
                { label: 'Avg / Active Day', value: analytics.averagePerActiveDay, icon: CalendarDays, note: analytics.peakDay ? `Peak: ${analytics.peakDay.label} (${analytics.peakDay.total})` : 'No cases logged' },
              ].map((stat) => <Card key={stat.label} className="border rounded-2xl overflow-hidden" style={{ background: IVORY, borderColor: GOLD_LIGHT }}><CardContent className="p-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: BROWN_LIGHT }}>{stat.label}</p><p className="text-3xl font-bold mt-1" style={{ color: BROWN }}>{stat.value}</p><p className="text-[11px] mt-1" style={{ color: BROWN_MID }}>{stat.note}</p></div><div className="w-11 h-11 rounded-xl border flex items-center justify-center" style={{ borderColor: GOLD_LIGHT, background: IVORY2 }}><stat.icon className="w-5 h-5 text-[#C5A880]" /></div></CardContent></Card>)}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
              <Card className="border rounded-2xl overflow-hidden" style={{ background: IVORY, borderColor: GOLD_LIGHT }}>
                <CardHeader><CardTitle style={{ color: BROWN }}>Daily throughput</CardTitle><CardDescription>New development and update cases across the selected period</CardDescription></CardHeader>
                <CardContent className="h-[340px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.daily} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={GOLD_LIGHT} vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: BROWN_LIGHT }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11, fill: BROWN_LIGHT }} allowDecimals={false} /><Tooltip /><Legend iconType="circle" /><Bar dataKey="new_dev" name="New Dev" stackId="cases" fill={GOLD} radius={[4, 4, 0, 0]} /><Bar dataKey="updates" name="Updates" stackId="cases" fill={BROWN_MID} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent>
              </Card>
              <Card className="border rounded-2xl overflow-hidden" style={{ background: IVORY, borderColor: GOLD_LIGHT }}>
                <CardHeader><CardTitle style={{ color: BROWN }}>Work mix</CardTitle><CardDescription>New development versus updates</CardDescription></CardHeader>
                <CardContent className="h-[340px]">{analytics.totalCases ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={workMix} dataKey="value" nameKey="name" cx="50%" cy="46%" innerRadius={65} outerRadius={100} paddingAngle={1}>{workMix.map((entry, index) => <Cell key={entry.name} fill={WORK_MIX_COLORS[index]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" iconType="circle" /></PieChart></ResponsiveContainer> : <EmptyChart message="No valid cases in this timeframe" />}</CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="border rounded-2xl overflow-hidden" style={{ background: IVORY, borderColor: GOLD_LIGHT }}>
                <CardHeader><CardTitle style={{ color: BROWN }}>Activity trend</CardTitle><CardDescription>Total case volume and submitted-report rhythm</CardDescription></CardHeader>
                <CardContent className="h-[310px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={analytics.daily} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}><defs><linearGradient id="caseArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GOLD} stopOpacity={0.42} /><stop offset="95%" stopColor={GOLD} stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={GOLD_LIGHT} vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: BROWN_LIGHT }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 11, fill: BROWN_LIGHT }} allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="total" name="Cases" stroke={GOLD} strokeWidth={3} fill="url(#caseArea)" /></AreaChart></ResponsiveContainer></CardContent>
              </Card>
              <Card className="border rounded-2xl overflow-hidden" style={{ background: IVORY, borderColor: GOLD_LIGHT }}>
                <CardHeader><CardTitle style={{ color: BROWN }}>Weekly cadence</CardTitle><CardDescription>Case volume by day of week</CardDescription></CardHeader>
                <CardContent className="h-[310px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.weekdayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={GOLD_LIGHT} vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 11, fill: BROWN_LIGHT }} /><YAxis tick={{ fontSize: 11, fill: BROWN_LIGHT }} allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="cases" name="Cases" stroke={BROWN_MID} strokeWidth={3} dot={{ r: 4, fill: GOLD }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.6fr]">
              <Card className="border rounded-2xl overflow-hidden" style={{ background: IVORY, borderColor: GOLD_LIGHT }}>
                <CardHeader><CardTitle className="flex items-center gap-2" style={{ color: BROWN }}>Leave distribution</CardTitle><CardDescription>Leave days overlapping this timeframe</CardDescription></CardHeader>
                <CardContent className="h-[300px]">{analytics.leaveTypes.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.leaveTypes} dataKey="value" nameKey="name" cx="50%" cy="46%" innerRadius={55} outerRadius={92} paddingAngle={1}>{analytics.leaveTypes.map((entry, index) => <Cell key={entry.name} fill={LEAVE_COLORS[index % LEAVE_COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer> : <EmptyChart message="No leave recorded in this timeframe" />}</CardContent>
              </Card>
              <Card className="border rounded-2xl overflow-hidden" style={{ background: IVORY, borderColor: GOLD_LIGHT }}>
                <CardHeader><CardTitle style={{ color: BROWN }}>Time away in selected timeframe</CardTitle><CardDescription>Every leave record is clipped to the dates selected above</CardDescription></CardHeader>
                <CardContent><div data-export-expand className="rounded-md border overflow-hidden max-h-[300px] overflow-y-auto" style={{ borderColor: GOLD_LIGHT }}><Table><TableHeader className="sticky top-0 bg-[#FAF9F5] z-10"><TableRow><TableHead>Leave type</TableHead><TableHead>Dates in range</TableHead><TableHead className="text-right">Days</TableHead></TableRow></TableHeader><TableBody>{leaves.length ? leaves.map((leave) => { const leaveStart = parseISO(leave.start_date) < startOfDay(dateRange.from!) ? startOfDay(dateRange.from!) : parseISO(leave.start_date); const leaveEnd = parseISO(leave.end_date) > startOfDay(dateRange.to!) ? startOfDay(dateRange.to!) : parseISO(leave.end_date); const days = differenceInCalendarDays(leaveEnd, leaveStart) + 1; return <TableRow key={leave.id}><TableCell><Badge variant="outline" className="border-[#E5DCCB] text-[#8C7654]">{leave.type}</Badge></TableCell><TableCell className="text-sm" style={{ color: BROWN }}>{format(leaveStart, 'MMM d')} – {format(leaveEnd, 'MMM d, yyyy')}</TableCell><TableCell className="text-right font-bold" style={{ color: BROWN }}>{days}</TableCell></TableRow>; }) : <TableRow><TableCell colSpan={3} className="py-16 text-center"><Palmtree className="w-7 h-7 mx-auto mb-2 text-[#C5A880]" /><span className="text-xs font-bold uppercase tracking-widest" style={{ color: BROWN_LIGHT }}>No leave taken</span></TableCell></TableRow>}</TableBody></Table></div></CardContent>
              </Card>
            </div>

            <Card className="border rounded-2xl overflow-hidden" style={{ background: IVORY, borderColor: GOLD_LIGHT }}>
              <CardHeader><CardTitle style={{ color: BROWN }}>Detailed Breakdown</CardTitle><CardDescription>Daily status activity and leave taken for the selected user and timeframe</CardDescription></CardHeader>
              <CardContent><div data-export-expand className="rounded-xl border overflow-x-auto" style={{ borderColor: GOLD_LIGHT }}><Table><TableHeader className="bg-[#FAF9F5]"><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>New Dev</TableHead><TableHead>Updates</TableHead><TableHead>Leave</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{analytics.daily.slice().reverse().map((day) => <TableRow key={day.date} className={day.leaves.length ? 'bg-[#C5A880]/[0.04]' : undefined}><TableCell className="font-bold whitespace-nowrap" style={{ color: BROWN }}>{format(parseISO(day.date), 'MMM d, yyyy')}</TableCell><TableCell>{day.leaves.length ? <Badge className="bg-[#F6ECD8] text-[#8C6839] hover:bg-[#F6ECD8] border-0">On Leave</Badge> : !day.isWorkday ? <Badge className="bg-[#EEF0F5] text-[#657083] hover:bg-[#EEF0F5] border-0">Week Off</Badge> : day.submitted ? <Badge className="bg-[#E7F1E7] text-[#527052] hover:bg-[#E7F1E7] border-0">Submitted</Badge> : <Badge variant="outline" className="border-[#E5DCCB] text-[#A59582]">No log</Badge>}</TableCell><CaseLinks links={day.newDevLinks} /><CaseLinks links={day.updateLinks} /><TableCell>{day.leaves.length ? <div className="flex flex-wrap gap-1">{day.leaves.map((leave) => <Badge key={leave.id} variant="outline" className="border-[#E5DCCB] text-[#8C7654]">{leave.type}</Badge>)}</div> : <span className="text-xs text-muted-foreground">—</span>}</TableCell><TableCell className="text-right font-bold" style={{ color: BROWN }}>{day.total}</TableCell></TableRow>)}</TableBody></Table></div></CardContent>
            </Card>
          </>
        )}
      </div>

      {/* A compact, dedicated canvas for a professional single-page Letter PDF. */}
      <div
        ref={pdfReportRef}
        aria-hidden="true"
        className="fixed top-0 w-[1600px] overflow-hidden bg-[#FDFDFB] p-10 font-sans text-[#2C241B]"
        style={{ left: '-10000px' }}
      >
        
        <header className="relative z-10 flex items-start justify-between border-b-2 border-[#C5A880] pb-5">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.35em] text-[#8C7654]">Insight Studio | Powered by Wasp</p>
            <h1 className="mt-1 text-[34px] font-bold tracking-tight">Performance & Availability Report</h1>
            <p className="mt-2 text-[15px] text-[#8C7654]">{selectedProfile?.full_name || selectedProfile?.email} · {rangeLabel}</p>
          </div>
          <div className="rounded-xl border border-[#E5DCCB] bg-[#FAF9F5] px-5 py-3 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A59582]">Report generated</p>
            <p className="mt-1 text-[13px] font-semibold">{format(new Date(), 'MMM d, yyyy')}</p>
          </div>
        </header>

        <section className="relative z-10 mt-5 grid grid-cols-6 gap-3">
          {[
            ['Total Cases', analytics.totalCases],
            ['New Dev', analytics.totalNewDev],
            ['Updates', analytics.totalUpdates],
            ['Reporting Rate', `${analytics.submissionRate}%`],
            ['Leave Days', analytics.leaveDays],
            ['Active Days', analytics.activeDays],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-[#E5DCCB] bg-white px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A59582]">{label}</p><p className="mt-1 text-[25px] font-bold text-[#2C241B]">{value}</p></div>)}
        </section>

        <section className="relative z-10 mt-5 grid grid-cols-[1.65fr_1fr] gap-5">
          <div className="rounded-xl border border-[#E5DCCB] bg-white p-4">
            <div className="flex items-baseline justify-between"><div><h2 className="text-[17px] font-bold">Daily Case Throughput</h2><p className="text-[11px] text-[#8C7654]">New development and updates throughout the selected period</p></div><p className="text-[11px] font-semibold text-[#8C7654]">{analytics.periodDays} days</p></div>
            <div className="mt-2 h-[190px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.daily} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={GOLD_LIGHT} vertical={false} /><XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 9, fill: BROWN_LIGHT }} /><YAxis allowDecimals={false} tick={{ fontSize: 9, fill: BROWN_LIGHT }} /><Tooltip /><Bar dataKey="new_dev" name="New Dev" stackId="cases" fill={GOLD} /><Bar dataKey="updates" name="Updates" stackId="cases" fill={BROWN_MID} /></BarChart></ResponsiveContainer></div>
          </div>
          <div className="rounded-xl border border-[#E5DCCB] bg-[#FAF9F5] p-4">
            <h2 className="text-[17px] font-bold">Period Snapshot</h2>
            <div className="mt-3 space-y-3 text-[12px]">
              <div className="flex justify-between border-b border-[#E5DCCB] pb-2"><span className="text-[#8C7654]">Average per active day</span><strong>{analytics.averagePerActiveDay}</strong></div>
              <div className="flex justify-between border-b border-[#E5DCCB] pb-2"><span className="text-[#8C7654]">Submitted reports</span><strong>{analytics.submittedDays}</strong></div>
              <div className="flex justify-between border-b border-[#E5DCCB] pb-2"><span className="text-[#8C7654]">Peak throughput</span><strong>{analytics.peakDay ? `${analytics.peakDay.label} (${analytics.peakDay.total})` : '—'}</strong></div>
              <div><p className="mb-1 text-[#8C7654]">Work mix</p><p className="font-semibold">{analytics.totalNewDev} New Dev · {analytics.totalUpdates} Updates</p></div>
              <div><p className="mb-1 text-[#8C7654]">Leave summary</p><p className="font-semibold">{analytics.leaveTypes.length ? analytics.leaveTypes.map((leave) => `${leave.name}: ${leave.value}d`).join(' · ') : 'No leave recorded'}</p></div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mt-5 rounded-xl border border-[#E5DCCB] bg-white p-4">
          <div className="mb-3 flex items-end justify-between"><div><h2 className="text-[17px] font-bold">Detailed Breakdown</h2><p className="text-[11px] text-[#8C7654]">All status logs, leave, and scheduled week-offs for the selected timeframe</p></div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A59582]">{analytics.daily.length} records</p></div>
          <table className="w-full table-fixed border-collapse text-left text-[10px]">
            <thead><tr className="border-y border-[#E5DCCB] bg-[#FAF9F5] text-[9px] font-bold uppercase tracking-[0.12em] text-[#8C7654]"><th className="w-[12%] px-2 py-2">Date</th><th className="w-[12%] px-2 py-2">Status</th><th className="w-[25%] px-2 py-2">New Dev</th><th className="w-[25%] px-2 py-2">Updates</th><th className="w-[18%] px-2 py-2">Leave</th><th className="w-[8%] px-2 py-2 text-right">Total</th></tr></thead>
            <tbody>{analytics.daily.slice().reverse().map((day) => <tr key={day.date} className="border-b border-[#E5DCCB]/70 align-top"><td className="px-2 py-1.5 font-semibold whitespace-nowrap">{format(parseISO(day.date), 'EEE, MMM d')}</td><td className="px-2 py-1.5 font-semibold">{day.leaves.length ? 'On Leave' : !day.isWorkday ? 'Week Off' : day.submitted ? 'Submitted' : 'No Log'}</td><td className="px-2 py-1.5 break-words text-[#8C7654]">{day.newDevLinks.length ? day.newDevLinks.map(getCaseKey).join(', ') : '—'}</td><td className="px-2 py-1.5 break-words text-[#8C7654]">{day.updateLinks.length ? day.updateLinks.map(getCaseKey).join(', ') : '—'}</td><td className="px-2 py-1.5 text-[#8C7654]">{day.leaves.length ? day.leaves.map((leave) => leave.type).join(', ') : '—'}</td><td className="px-2 py-1.5 text-right font-bold">{day.total}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

const EmptyChart = ({ message }: { message: string }) => <div className="h-full flex flex-col items-center justify-center text-center gap-2"><ShieldAlert className="w-8 h-8 text-[#C5A880]" /><span className="text-xs font-bold uppercase tracking-widest text-[#A59582]">{message}</span></div>;

const CaseLinks = ({ links }: { links: string[] }) => links.length ? <TableCell><div className="space-y-1 min-w-[120px] max-w-[220px]">{links.map((link, index) => <a key={`${link}-${index}`} href={link} target="_blank" rel="noreferrer" title={link} className="block text-xs font-semibold text-[#8C7654] hover:text-[#2C241B] hover:underline">{getCaseKey(link)}</a>)}</div></TableCell> : <TableCell><span className="text-xs text-muted-foreground">—</span></TableCell>;

export default AdvancedAnalytics;
