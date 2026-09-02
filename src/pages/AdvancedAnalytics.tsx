import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isValid,
  isWeekend,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
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
} from "recharts";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileDown,
  FileSearch,
  Image as ImageIcon,
  Loader2,
  Palmtree,
  Share2,
  ShieldAlert,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { SiChinaeasternairlines } from "react-icons/si";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useTitle } from "@/hooks/use-title";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Loader from "@/components/Loader";

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

interface Holiday {
  id?: string;
  date: string;
  description?: string;
}

type RangeMode = "week" | "month" | "custom";

const GOLD = "#C5A880";
const GOLD_LIGHT = "#E5DCCB";
const IVORY = "#FDFDFB";
const IVORY2 = "#FAF9F5";
const BROWN = "#2C241B";
const BROWN_MID = "#8C7654";
const BROWN_LIGHT = "#A59582";
const WORK_MIX_COLORS = [GOLD, "#8C7654"];
const LEAVE_COLORS = [
  "#C5A880",
  "#A8896A",
  "#8C7654",
  "#D8C29D",
  "#625342",
  "#B6A58C",
];

const svg = renderToStaticMarkup(
  <SiChinaeasternairlines
    style={{ width: 224, height: 224, color: "#C5A880", opacity: 0.09 }}
  />
);

const isValidCase = (link: string) => {
  if (typeof link !== "string") return false;
  const val = link.trim().toLowerCase();
  return (
    val !== "" &&
    val !== "na" &&
    val !== "n/a" &&
    !val.includes("leave") &&
    !val.includes("exercise") &&
    val.includes("atlassian.spscommerce.com/browse/")
  );
};

const renderRoundedBar = (props: any) => {
  const { fill, x, y, width, height, payload, dataKey } = props;
  if (height <= 0) return null;

  // Round the top only when this segment is the top of the stack:
  // - "updates" is always on top
  // - "new_dev" is on top only when there are no updates that day
  const isTopSegment =
    dataKey === "updates" ||
    (dataKey === "new_dev" && (!payload.updates || payload.updates === 0));

  const radius = isTopSegment ? Math.min(4, height / 2, width / 2) : 0;

  // Top corners rounded; bottom stays square so stacked bars join cleanly
  const d =
    radius > 0
      ? `M${x},${y + height}
         L${x},${y + radius}
         Q${x},${y} ${x + radius},${y}
         L${x + width - radius},${y}
         Q${x + width},${y} ${x + width},${y + radius}
         L${x + width},${y + height}
         Z`
      : `M${x},${y + height} L${x},${y} L${x + width},${y} L${x + width},${y + height} Z`;

  return <path d={d} fill={fill} />;
};

const getPresetRange = (mode: Exclude<RangeMode, "custom">) => {
  const today = startOfDay(new Date());
  return mode === "week"
    ? { start: subDays(today, 6), end: today }
    : { start: startOfMonth(today), end: endOfMonth(today) };
};

const normalizeDate = (date: Date) => format(date, "yyyy-MM-dd");
const getCaseKey = (link: string) =>
  link.split("/browse/").pop()?.split(/[?#]/)[0] || link;

const AdvancedAnalytics = () => {
  const { role, loading: roleLoading, isOwner } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [rangeMode, setRangeMode] = useState<RangeMode>(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "week" || modeParam === "month" || modeParam === "custom") {
      return modeParam;
    }
    return "month";
  });

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const modeParam = searchParams.get("mode");
    const initialRange =
      modeParam === "week" ? getPresetRange("week") : getPresetRange("month");

    if (fromParam) {
      const parsedFrom = parseISO(fromParam);
      if (isValid(parsedFrom)) {
        if (toParam) {
          const parsedTo = parseISO(toParam);
          if (isValid(parsedTo)) {
            return { from: startOfDay(parsedFrom), to: startOfDay(parsedTo) };
          }
        }
        return { from: startOfDay(parsedFrom), to: startOfDay(parsedFrom) };
      }
    }
    return {
      from: initialRange.start,
      to: initialRange.end,
    };
  });

  const [isExporting, setIsExporting] = useState(false);
  const pdfReportRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const startDate = dateRange.from ? normalizeDate(dateRange.from) : "";
  const endDate = dateRange.to ? normalizeDate(dateRange.to) : startDate;
  const hasCompleteRange = Boolean(dateRange.from && dateRange.to);

  const EXCLUDED_EMAILS = useMemo(
    () =>
      [
        "rohit@apex.com",
        "pankaj@apex.com",
        "tschellenberg@spscommerce.com",
        "amit.gilda@bristlecone.com",
        "pankaj.patil@bristlecone.com",
        "aditya.sanjay.dahe@bristlecone.com",
      ].map((e) => e.toLowerCase()),
    []
  );

  useTitle("Insight Studio");

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["advanced_analytics_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data as ProfileOption[]).filter(
        (profile) => !EXCLUDED_EMAILS.includes(profile.email ?? "")
      );
    },
    // enabled: isOwner,
  });

  const userParam = searchParams.get("user") || searchParams.get("userId") || "";

  // Derive selectedProfile directly from searchParams and loaded profiles
  const selectedProfile = useMemo(() => {
    if (!profiles.length || !userParam) return undefined;
    const normalizedParam = userParam.trim().toLowerCase();
    return profiles.find((p) => {
      if (p.id.toLowerCase() === normalizedParam) return true;
      if (p.full_name && p.full_name.trim().toLowerCase() === normalizedParam) return true;
      if (p.full_name && p.full_name.trim().toLowerCase().replace(/\s+/g, "-") === normalizedParam) return true;
      if (p.email && p.email.toLowerCase() === normalizedParam) return true;
      return false;
    });
  }, [profiles, userParam]);

  const selectedUserId = selectedProfile?.id || "";

  const handleUserSelect = (profile: ProfileOption) => {
    const userIdentifier = profile.full_name || profile.email || profile.id;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("userId");
      next.set("user", userIdentifier);
      return next;
    }, { replace: true });
  };

  const applyPreset = (mode: Exclude<RangeMode, "custom">) => {
    const range = getPresetRange(mode);
    setRangeMode(mode);
    setDateRange({ from: range.start, to: range.end });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("mode", mode);
      if (range.start) next.set("from", normalizeDate(range.start));
      if (range.end) next.set("to", normalizeDate(range.end));
      return next;
    }, { replace: true });
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setRangeMode("custom");
    setDateRange(range ?? { from: undefined, to: undefined });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("mode", "custom");
      if (range?.from) {
        next.set("from", normalizeDate(range.from));
      } else {
        next.delete("from");
      }
      if (range?.to) {
        next.set("to", normalizeDate(range.to));
      } else {
        next.delete("to");
      }
      return next;
    }, { replace: true });
  };

  // Sync date range state when URL searchParams change (e.g. browser back/forward navigation)
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "week" || modeParam === "month" || modeParam === "custom") {
      setRangeMode((prev) => (prev !== modeParam ? modeParam : prev));
    }
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    if (fromParam) {
      const parsedFrom = parseISO(fromParam);
      if (isValid(parsedFrom)) {
        const fromDate = startOfDay(parsedFrom);
        let toDate: Date | undefined = undefined;
        if (toParam) {
          const parsedTo = parseISO(toParam);
          if (isValid(parsedTo)) {
            toDate = startOfDay(parsedTo);
          }
        }
        setDateRange((prev) => {
          if (
            prev.from?.getTime() === fromDate.getTime() &&
            prev.to?.getTime() === toDate?.getTime()
          ) {
            return prev;
          }
          return { from: fromDate, to: toDate };
        });
      }
    }
  }, [searchParams]);

  // Canonicalize URL to member name once profile is resolved if it was given as raw UUID or userId param
  useEffect(() => {
    if (!selectedProfile) return;
    const rawUserId = searchParams.get("userId");
    const currentUser = searchParams.get("user");
    if (rawUserId || (currentUser === selectedProfile.id && selectedProfile.full_name)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("userId");
        if (selectedProfile.full_name) {
          next.set("user", selectedProfile.full_name);
        }
        return next;
      }, { replace: true });
    }
  }, [selectedProfile, searchParams, setSearchParams]);

  // Populate default range params in URL on initial mount if not present
  useEffect(() => {
    setSearchParams((prev) => {
      let changed = false;
      const next = new URLSearchParams(prev);
      if (!next.get("mode")) {
        next.set("mode", rangeMode);
        changed = true;
      }
      if (!next.get("from") && dateRange.from) {
        next.set("from", normalizeDate(dateRange.from));
        changed = true;
      }
      if (!next.get("to") && dateRange.to) {
        next.set("to", normalizeDate(dateRange.to));
        changed = true;
      }
      return changed ? next : prev;
    }, { replace: true });
  }, []);

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ["advanced_analytics_report", selectedUserId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_task_status")
        .select("id, user_id, date, new_dev, updates")
        .eq("user_id", selectedUserId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return data as TaskStatus[];
    },
    enabled: !!selectedUserId && hasCompleteRange,
  });

  const { data: leaves = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ["advanced_analytics_leaves", selectedUserId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_leaves")
        .select("id, start_date, end_date, type")
        .eq("user_id", selectedUserId)
        .lte("start_date", endDate)
        .gte("end_date", startDate)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data as Leave[];
    },
    enabled: !!selectedUserId && hasCompleteRange,
  });

  const { data: holidaysData = { map: {}, list: [] }, isLoading: loadingHolidays } = useQuery({
    queryKey: ["advanced_analytics_holidays", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holidays" as any)
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      if (error) throw error;
      const map: Record<string, string> = {};
      const list = (data || []) as Holiday[];
      list.forEach((h) => {
        map[h.date] = h.description || "Holiday";
      });
      return { map, list };
    },
    enabled: hasCompleteRange,
  });

  const analytics = useMemo(() => {
    if (!dateRange.from || !dateRange.to) {
      return {
        daily: [],
        weekdayData: [],
        leaveTypes: [],
        totalNewDev: 0,
        totalUpdates: 0,
        totalCases: 0,
        submittedDays: 0,
        submittedWorkDays: 0,
        activeDays: 0,
        periodDays: 0,
        leaveDays: 0,
        leaveRecords: 0,
        availableWorkDays: 0,
        submissionRate: 0,
        averagePerActiveDay: 0,
        peakDay: null as null | { label: string; total: number },
      };
    }

    const reportsByDate = new Map<string, TaskStatus[]>();
    reports.forEach((report) =>
      reportsByDate.set(report.date, [
        ...(reportsByDate.get(report.date) || []),
        report,
      ])
    );
    const days = eachDayOfInterval({
      start: startOfDay(dateRange.from),
      end: startOfDay(dateRange.to),
    });

    const daily = days.map((day) => {
      const date = normalizeDate(day);
      const reportsForDay = reportsByDate.get(date) || [];
      const newDev = reportsForDay
        .flatMap((report) => report.new_dev || [])
        .filter(isValidCase);
      const updates = reportsForDay
        .flatMap((report) => report.updates || [])
        .filter(isValidCase);
      const dayLeaves = leaves.filter(
        (leave) => date >= leave.start_date && date <= leave.end_date
      );
      const isHoliday = !!holidaysData.map[date];
      const holidayDescription = holidaysData.map[date];

      const isOnLeave = dayLeaves.length > 0;
      const hasValidLog = reportsForDay.some((r) => {
        const isAutoLeave =
          r.new_dev?.length === 1 &&
          r.new_dev[0] === "ON LEAVE" &&
          r.updates?.length === 1 &&
          r.updates[0] === "ON LEAVE";
        return !isAutoLeave;
      });
      const isSubmitted = !isOnLeave && reportsForDay.length > 0 && hasValidLog;

      return {
        date,
        label: format(day, "MMM d"),
        day: format(day, "EEE"),
        new_dev: newDev.length,
        updates: updates.length,
        total: newDev.length + updates.length,
        submitted: isSubmitted,
        isWorkday: !isWeekend(day),
        isHoliday,
        holidayDescription,
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
    const availableWorkDays = daily.filter(
      (day) => day.isWorkday && !day.isHoliday
    ).length;
    const submittedWorkDays = Math.max(0, availableWorkDays - leaveDays);
    const submissionRate = availableWorkDays
      ? Math.round((submittedWorkDays / availableWorkDays) * 100)
      : 0;
    const peakDay = daily.reduce<(typeof daily)[number] | null>(
      (best, day) => (!best || day.total > best.total ? day : best),
      null
    );

    const leaveTypeTotals = new Map<string, number>();
    leaves.forEach((leave) => {
      const leaveStart =
        parseISO(leave.start_date) < startOfDay(dateRange.from!)
          ? startOfDay(dateRange.from!)
          : parseISO(leave.start_date);
      const leaveEnd =
        parseISO(leave.end_date) > startOfDay(dateRange.to!)
          ? startOfDay(dateRange.to!)
          : parseISO(leave.end_date);
      const overlappingDays =
        differenceInCalendarDays(leaveEnd, leaveStart) + 1;
      if (overlappingDays > 0)
        leaveTypeTotals.set(
          leave.type,
          (leaveTypeTotals.get(leave.type) || 0) + overlappingDays
        );
    });

    const holidayDaysCount = daily.filter((d) => d.isHoliday).length;
    if (holidayDaysCount > 0) {
      leaveTypeTotals.set("Company Off", holidayDaysCount);
    }

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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
      leaveTypes: Array.from(leaveTypeTotals, ([name, value]) => ({
        name,
        value,
      })),
      totalNewDev,
      totalUpdates,
      totalCases: totalNewDev + totalUpdates,
      submittedDays,
      submittedWorkDays,
      activeDays,
      periodDays: daily.length,
      leaveDays,
      leaveRecords: leaves.length,
      availableWorkDays,
      submissionRate: availableWorkDays
        ? Math.round((submittedWorkDays / availableWorkDays) * 100)
        : 0,
      averagePerActiveDay: activeDays
        ? Number(((totalNewDev + totalUpdates) / activeDays).toFixed(1))
        : 0,
      peakDay:
        peakDay && peakDay.total > 0
          ? { label: peakDay.label, total: peakDay.total }
          : null,
    };
  }, [dateRange, leaves, reports, holidaysData]);

  const timeAwayItems = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];

    const items: Array<{
      id: string;
      type: string;
      description?: string;
      startDate: Date;
      endDate: Date;
      days: number;
      dateRangeText: string;
      isHoliday: boolean;
    }> = [];

    leaves.forEach((leave) => {
      const rawStart = parseISO(leave.start_date);
      const rawEnd = parseISO(leave.end_date);
      const leaveStart =
        rawStart < startOfDay(dateRange.from!)
          ? startOfDay(dateRange.from!)
          : rawStart;
      const leaveEnd =
        rawEnd > startOfDay(dateRange.to!)
          ? startOfDay(dateRange.to!)
          : rawEnd;
      const days = differenceInCalendarDays(leaveEnd, leaveStart) + 1;
      if (days > 0) {
        items.push({
          id: `leave-${leave.id}`,
          type: leave.type,
          startDate: leaveStart,
          endDate: leaveEnd,
          days,
          dateRangeText: isSameDay(leaveStart, leaveEnd)
            ? format(leaveStart, "MMM d, yyyy")
            : `${format(leaveStart, "MMM d")} – ${format(
              leaveEnd,
              "MMM d, yyyy"
            )}`,
          isHoliday: false,
        });
      }
    });

    holidaysData.list.forEach((h) => {
      const hDate = parseISO(h.date);
      if (
        hDate >= startOfDay(dateRange.from!) &&
        hDate <= startOfDay(dateRange.to!)
      ) {
        items.push({
          id: `holiday-${h.date}-${h.id || ""}`,
          type: "Company Off",
          description: h.description,
          startDate: hDate,
          endDate: hDate,
          days: 1,
          dateRangeText: format(hDate, "MMM d, yyyy"),
          isHoliday: true,
        });
      }
    });

    return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [dateRange, leaves, holidaysData]);

  const workMix = [
    { name: "New Dev", value: analytics.totalNewDev },
    { name: "Updates", value: analytics.totalUpdates },
  ];

  const rangeLabel = !dateRange.from
    ? "Select a date range"
    : !dateRange.to
      ? `${format(dateRange.from, "MMM d, yyyy")} — choose an end date`
      : `${format(dateRange.from, "MMM d, yyyy")} — ${format(
        dateRange.to,
        "MMM d, yyyy"
      )}`;

  const exportToPDF = async () => {
    if (!pdfReportRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfReportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: IVORY,
        onclone: (document) => {
          document
            .querySelectorAll("[data-export-hide]")
            .forEach((element) => element.remove());
        },
      });

      const pdf = new jsPDF("l", "mm", "letter");
      const margin = 6;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const image = canvas.toDataURL("image/png");
      const imageRatio = canvas.width / canvas.height;
      const printableRatio = printableWidth / printableHeight;
      const imageWidth =
        imageRatio > printableRatio
          ? printableWidth
          : printableHeight * imageRatio;
      const imageHeight =
        imageRatio > printableRatio
          ? printableWidth / imageRatio
          : printableHeight;
      const imageX = (pageWidth - imageWidth) / 2;
      const imageY = margin + (printableHeight - imageHeight) / 2;

      pdf.setFillColor(253, 253, 251);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.addImage(image, "PNG", imageX, imageY, imageWidth, imageHeight);

      pdf.save(
        `analytics-${selectedProfile?.full_name?.replace(/\s+/g, "-").toLowerCase() ||
        "report"
        }-${startDate}-to-${endDate}.pdf`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPNG = async () => {
    if (!exportRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: IVORY,
        onclone: (document) => {
          document
            .querySelectorAll("[data-export-hide]")
            .forEach((element) => element.remove());
          document
            .querySelectorAll<HTMLElement>("[data-export-expand]")
            .forEach((element) => {
              element.style.maxHeight = "none";
              element.style.overflow = "visible";
            });
        },
      });

      const link = document.createElement("a");
      link.download = `analytics-${selectedProfile?.full_name?.replace(/\s+/g, "-").toLowerCase() ||
        "report"
        }-${startDate}-to-${endDate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  if (roleLoading) {
    return (
      <Loader />
    );
  }

  if (role !== "owner" && role !== "manager") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-[2em] p-8 md:p-10 text-center space-y-6"
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border shadow-inner"
          >
            <ShieldAlert className="w-8 h-8 text-[#C5A880]" />
          </div>

          <div className="space-y-2">
            <Badge
              variant="outline"
              className="uppercase rounded-full border-[#E5DCCB] text-[#8C7654] text-[10px] tracking-widest px-3 py-1 font-bold"
            >
              Access Restricted
            </Badge>
            <h1
              className="text-2xl md:text-3xl font-heading font-bold tracking-tight"
              style={{ color: BROWN }}
            >
              Not Authorized
            </h1>
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: BROWN_MID }}>
              You are not authorized to view this page. Insight Studio and Advanced Analytics are reserved for workspace owners and managers.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/">
              <Button
                variant="outline"
                className="w-full h-11 border-[#E5DCCB] rounded-2xl text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B] font-bold text-xs uppercase tracking-wider transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const isLoading = loadingReports || loadingLeaves || loadingHolidays;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div ref={exportRef} className="max-w-[1500px] mx-auto p-6 md:p-12 space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div>
            <h1
              className="text-4xl md:text-5xl font-heading font-bold tracking-tight"
              style={{ color: BROWN }}
            >
              Insight Studio
            </h1>
            <p
              className="text-xs md:text-sm font-sans font-bold uppercase tracking-[0.22em] mt-3"
              style={{ color: BROWN_LIGHT }}
            >
              A complete view of delivery, reporting consistency, and time away
            </p>
          </div>
        </div>

        <Card
          data-export-hide
          className="border rounded-3xl overflow-visible shadow-xl"
          style={{ background: IVORY, borderColor: GOLD_LIGHT }}
        >
          <CardHeader className="px-6 md:px-8 pt-7 pb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl border flex items-center justify-center"
                style={{ borderColor: GOLD_LIGHT, background: IVORY2 }}
              >
                <FileSearch className="w-5 h-5 text-[#C5A880]" />
              </div>
              <div>
                <CardTitle className="text-2xl" style={{ color: BROWN }}>
                  Report Controls
                </CardTitle>
                <CardDescription
                  className="font-sans font-bold uppercase text-[10px] tracking-[0.2em]"
                  style={{ color: BROWN_LIGHT }}
                >
                  Choose a member and a reporting window
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 md:px-8 pb-8 grid gap-5 lg:grid-cols-[1fr_1.4fr_0.8fr] items-end">
            <div className="space-y-2">
              <Label
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: BROWN_MID }}
              >
                Team member
              </Label>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={loadingProfiles}
                    className="w-full h-12 px-4 flex items-center justify-between rounded-md border bg-white/60 text-sm font-medium outline-none transition-colors focus:border-[#C5A880] disabled:opacity-60"
                    style={{
                      borderColor: GOLD_LIGHT,
                      color: selectedUserId ? BROWN : BROWN_LIGHT,
                    }}
                  >
                    <span className="truncate">
                      {selectedProfile?.full_name ||
                        selectedProfile?.email ||
                        "Select a user"}
                    </span>
                    <ChevronDown className="w-4 h-4 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto rounded-md border shadow-xl p-1"
                  style={{ borderColor: GOLD_LIGHT, background: IVORY }}
                >
                  {profiles.map((profile) => (
                    <DropdownMenuItem
                      key={profile.id}
                      onClick={() => handleUserSelect(profile)}
                      className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm font-medium"
                      style={{ color: BROWN }}
                    >
                      <span className="truncate">
                        {profile.full_name || profile.email || profile.id}
                      </span>
                      {selectedUserId === profile.id && (
                        <Check className="w-3.5 h-3.5 ml-2 shrink-0 text-[#C5A880]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: BROWN_MID }}
              >
                Date range
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 px-4 justify-start text-left font-medium border bg-white/60 hover:bg-white",
                      !dateRange.from && "text-[#A59582]"
                    )}
                    style={{
                      borderColor: GOLD_LIGHT,
                      color: dateRange.from ? BROWN : BROWN_LIGHT,
                    }}
                  >
                    <CalendarRange className="mr-2 h-4 w-4 shrink-0 text-[#A59582]" />
                    <span className="truncate">{rangeLabel}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-auto p-0 rounded-xl border shadow-xl"
                  style={{ borderColor: GOLD_LIGHT }}
                >
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleRangeSelect}
                    numberOfMonths={2}
                    showOutsideDays={false}
                    defaultMonth={dateRange.from}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: BROWN_MID }}
              >
                Quick ranges
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(["week", "month"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant="default"
                    onClick={() => applyPreset(mode)}
                    className="h-12 rounded-md uppercase text-[10px] tracking-widest"
                    style={
                      rangeMode === mode
                        ? {
                          background: BROWN,
                          color: "white",
                          borderColor: BROWN,
                        }
                        : { color: "#BFA378" }
                    }
                  >
                    {mode === "week" ? "Last 7 days" : "This month"}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedUserId ? (
          <Card
            className="border rounded-3xl"
            style={{ background: IVORY, borderColor: GOLD_LIGHT }}
          >
            <CardContent className="py-16 text-center space-y-3">
              <User className="w-10 h-10 mx-auto text-[#C5A880]" />
              <p
                className="text-sm font-bold uppercase tracking-[0.2em]"
                style={{ color: BROWN_LIGHT }}
              >
                Select a user to generate analytics
              </p>
            </CardContent>
          </Card>
        ) : !hasCompleteRange ? (
          <Card
            className="border rounded-3xl"
            style={{ background: IVORY, borderColor: GOLD_LIGHT }}
          >
            <CardContent className="py-16 text-center space-y-3">
              <CalendarRange className="w-10 h-10 mx-auto text-[#C5A880]" />
              <p
                className="text-sm font-bold uppercase tracking-[0.2em]"
                style={{ color: BROWN_LIGHT }}
              >
                Choose both a start and end date
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-32 rounded-3xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-xl font-bold" style={{ color: BROWN }}>
                  {selectedProfile?.full_name || selectedProfile?.email}
                </h2>
                <p
                  className="text-xs font-medium"
                  style={{ color: BROWN_LIGHT }}
                >
                  {rangeLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="uppercase rounded-full border-[#E5DCCB] text-[#8C7654]"
                >
                  {analytics.periodDays} days
                </Badge>
                <Button
                  data-export-hide
                  type="button"
                  variant="outline"
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className="h-9 border-[#E5DCCB] rounded-3xl text-[#8C7654] hover:bg-[#C5A880]/10 hover:text-[#2C241B]"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  {isExporting ? "Preparing…" : "Export PDF"}
                </Button>
                <Button
                  data-export-hide
                  type="button"
                  variant="outline"
                  onClick={exportToPNG}
                  disabled={isExporting}
                  className="h-9 border-[#E5DCCB] rounded-3xl text-[#8C7654] hover:bg-[#C5A880]/10 hover:text-[#2C241B]"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {isExporting ? "Preparing…" : "Export PNG"}
                </Button>
                <Button
                  data-export-hide
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const shareUrl = new URL(window.location.origin + window.location.pathname);
                    const userIdentifier = selectedProfile?.full_name || selectedProfile?.email;
                    if (userIdentifier) {
                      shareUrl.searchParams.set("user", userIdentifier);
                    } else if (selectedUserId) {
                      const existingUser = searchParams.get("user");
                      if (existingUser) {
                        shareUrl.searchParams.set("user", existingUser);
                      } else {
                        shareUrl.searchParams.set("user", selectedUserId);
                      }
                    }
                    if (dateRange.from) {
                      shareUrl.searchParams.set("from", normalizeDate(dateRange.from));
                    }
                    if (dateRange.to) {
                      shareUrl.searchParams.set("to", normalizeDate(dateRange.to));
                    }
                    if (rangeMode) {
                      shareUrl.searchParams.set("mode", rangeMode);
                    }
                    navigator.clipboard.writeText(shareUrl.toString());
                    toast({
                      title: "Direct link copied!",
                      description:
                        "Anyone opening this link will see this exact report and timeframe.",
                    });
                  }}
                  className="h-9 border-[#E5DCCB] rounded-3xl text-[#8C7654] hover:bg-[#C5A880]/10 hover:text-[#2C241B]"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  label: "Total Cases",
                  value: analytics.totalCases,
                  icon: Target,
                  note: `${analytics.activeDays} active days`,
                },
                {
                  label: "Reporting Rate",
                  value: `${analytics.submissionRate}%`,
                  icon: ClipboardCheck,
                  note: `${analytics.submittedWorkDays} / ${analytics.availableWorkDays} working days`,
                },
                {
                  label: "Leaves Taken",
                  value: analytics.leaveDays,
                  icon: Palmtree,
                  note: `${analytics.leaveRecords} leave record${analytics.leaveRecords === 1 ? "" : "s"
                    }`,
                },
                {
                  label: "New Development",
                  value: analytics.totalNewDev,
                  icon: Activity,
                  note: "Valid cases logged",
                },
                {
                  label: "Updates",
                  value: analytics.totalUpdates,
                  icon: TrendingUp,
                  note: "Valid cases logged",
                },
                {
                  label: "Avg / Active Day",
                  value: analytics.averagePerActiveDay,
                  icon: CalendarDays,
                  note: analytics.peakDay
                    ? `Peak: ${analytics.peakDay.label} (${analytics.peakDay.total})`
                    : "No cases logged",
                },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="border rounded-3xl overflow-hidden"
                  style={{ background: IVORY, borderColor: GOLD_LIGHT }}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: BROWN_LIGHT }}
                      >
                        {stat.label}
                      </p>
                      <p
                        className="text-3xl font-bold mt-1"
                        style={{ color: BROWN }}
                      >
                        {stat.value}
                      </p>
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: BROWN_MID }}
                      >
                        {stat.note}
                      </p>
                    </div>
                    <div
                      className="w-11 h-11 rounded-xl border flex items-center justify-center"
                      style={{ borderColor: GOLD_LIGHT, background: IVORY2 }}
                    >
                      <stat.icon className="w-5 h-5 text-[#C5A880]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
              <Card
                className="border rounded-3xl overflow-hidden"
                style={{ background: IVORY, borderColor: GOLD_LIGHT }}
              >
                <CardHeader>
                  <CardTitle style={{ color: BROWN }}>
                    Daily throughput
                  </CardTitle>
                  <CardDescription>
                    New development and update cases across the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.daily}
                      margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={GOLD_LIGHT}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: BROWN_LIGHT }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: BROWN_LIGHT }}
                        allowDecimals={false}
                      />
                      <Tooltip />
                      <Legend iconType="circle" />
                      <Bar
                        dataKey="new_dev"
                        name="New Dev"
                        stackId="cases"
                        fill={GOLD}
                        shape={renderRoundedBar}
                        maxBarSize={48}
                      />
                      <Bar
                        dataKey="updates"
                        name="Updates"
                        stackId="cases"
                        fill={BROWN_MID}
                        shape={renderRoundedBar}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card
                className="border rounded-3xl overflow-hidden"
                style={{ background: IVORY, borderColor: GOLD_LIGHT }}
              >
                <CardHeader>
                  <CardTitle style={{ color: BROWN }}>Work mix</CardTitle>
                  <CardDescription>
                    New development versus updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[340px]">
                  {analytics.totalCases ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={workMix}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="46%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={1}
                        >
                          {workMix.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={WORK_MIX_COLORS[index]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="No valid cases in this timeframe" />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card
                className="border rounded-3xl overflow-hidden"
                style={{ background: IVORY, borderColor: GOLD_LIGHT }}
              >
                <CardHeader>
                  <CardTitle style={{ color: BROWN }}>Activity trend</CardTitle>
                  <CardDescription>
                    Total case volume and submitted-report rhythm
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[310px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.daily}
                      margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="caseArea"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={GOLD}
                            stopOpacity={0.42}
                          />
                          <stop
                            offset="95%"
                            stopColor={GOLD}
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={GOLD_LIGHT}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: BROWN_LIGHT }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: BROWN_LIGHT }}
                        allowDecimals={false}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Cases"
                        stroke={GOLD}
                        strokeWidth={3}
                        fill="url(#caseArea)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card
                className="border rounded-3xl overflow-hidden"
                style={{ background: IVORY, borderColor: GOLD_LIGHT }}
              >
                <CardHeader>
                  <CardTitle style={{ color: BROWN }}>Weekly cadence</CardTitle>
                  <CardDescription>Case volume by day of week</CardDescription>
                </CardHeader>
                <CardContent className="h-[310px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={analytics.weekdayData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={GOLD_LIGHT}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: BROWN_LIGHT }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: BROWN_LIGHT }}
                        allowDecimals={false}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="cases"
                        name="Cases"
                        stroke={BROWN_MID}
                        strokeWidth={3}
                        dot={{ r: 4, fill: GOLD }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.6fr]">
              <Card
                className="border rounded-3xl overflow-hidden"
                style={{ background: IVORY, borderColor: GOLD_LIGHT }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: BROWN }}
                  >
                    Leave distribution
                  </CardTitle>
                  <CardDescription>
                    Leave days overlapping this timeframe
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {analytics.leaveTypes.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.leaveTypes}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="46%"
                          innerRadius={55}
                          outerRadius={92}
                          paddingAngle={1}
                        >
                          {analytics.leaveTypes.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={LEAVE_COLORS[index % LEAVE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="No leave recorded in this timeframe" />
                  )}
                </CardContent>
              </Card>
              <Card
                className="border rounded-3xl overflow-hidden"
                style={{ background: IVORY, borderColor: GOLD_LIGHT }}
              >
                <CardHeader>
                  <CardTitle style={{ color: BROWN }}>
                    Time away in selected timeframe
                  </CardTitle>
                  <CardDescription>
                    Every leave record and company holiday is clipped to the dates selected above
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    data-export-expand
                    className="rounded-md border overflow-hidden max-h-[300px] overflow-y-auto"
                    style={{ borderColor: GOLD_LIGHT }}
                  >
                    <Table>
                      <TableHeader className="sticky top-0 bg-[#FAF9F5] z-10">
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Dates in range</TableHead>
                          <TableHead className="text-right">Days</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeAwayItems.length ? (
                          timeAwayItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={
                                      item.isHoliday
                                        ? "border-[#DFCBB5] bg-[#FAF9F5] text-[#8C7654] font-semibold"
                                        : "border-[#E5DCCB] text-[#8C7654]"
                                    }
                                  >
                                    {item.type}
                                  </Badge>
                                  {item.isHoliday &&
                                    item.description &&
                                    item.description !== "Holiday" &&
                                    item.description !== "Company Off" && (
                                      <span className="text-xs text-[#8C7654] italic">
                                        ({item.description})
                                      </span>
                                    )}
                                </div>
                              </TableCell>
                              <TableCell
                                className="text-sm"
                                style={{ color: BROWN }}
                              >
                                {item.dateRangeText}
                              </TableCell>
                              <TableCell
                                className="text-right font-bold"
                                style={{ color: BROWN }}
                              >
                                {item.days}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="py-16 text-center"
                            >
                              <Palmtree className="w-7 h-7 mx-auto mb-2 text-[#C5A880]" />
                              <span
                                className="text-xs font-bold uppercase tracking-widest"
                                style={{ color: BROWN_LIGHT }}
                              >
                                No time away recorded
                              </span>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card
              className="border rounded-3xl overflow-hidden"
              style={{ background: IVORY, borderColor: GOLD_LIGHT }}
            >
              <CardHeader>
                <CardTitle style={{ color: BROWN }}>
                  Detailed Breakdown
                </CardTitle>
                <CardDescription>
                  Daily status activity, company off days, and leave taken for the selected user
                  and timeframe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  data-export-expand
                  className="rounded-xl border overflow-x-auto"
                  style={{ borderColor: GOLD_LIGHT }}
                >
                  <Table>
                    <TableHeader className="bg-[#FAF9F5]">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>New Dev</TableHead>
                        <TableHead>Updates</TableHead>
                        <TableHead>Leave / Time Off</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.daily
                        .slice()
                        .reverse()
                        .map((day) => (
                          <TableRow
                            key={day.date}
                            className={
                              day.leaves.length || day.isHoliday
                                ? "bg-[#C5A880]/[0.04]"
                                : undefined
                            }
                          >
                            <TableCell
                              className="font-bold whitespace-nowrap"
                              style={{ color: BROWN }}
                            >
                              {format(parseISO(day.date), "PPPP")}
                            </TableCell>
                            <TableCell>
                              {day.leaves.length ? (
                                <Badge className="bg-[#F6ECD8] text-[#8C6839] hover:bg-[#F6ECD8] border-0">
                                  On Leave
                                </Badge>
                              ) : day.isHoliday ? (
                                <Badge className="bg-[#EFE8DC] text-[#7A6241] hover:bg-[#EFE8DC] border-0">
                                  Company Off
                                </Badge>
                              ) : !day.isWorkday ? (
                                <Badge className="bg-[#EEF0F5] text-[#657083] hover:bg-[#EEF0F5] border-0">
                                  Week Off
                                </Badge>
                              ) : day.submitted ? (
                                <Badge className="bg-[#E7F1E7] text-[#527052] hover:bg-[#E7F1E7] border-0">
                                  Submitted
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-[#E5DCCB] text-[#A59582]"
                                >
                                  No log
                                </Badge>
                              )}
                            </TableCell>
                            <CaseLinks links={day.newDevLinks} />
                            <CaseLinks links={day.updateLinks} />
                            <TableCell>
                              {day.leaves.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {day.leaves.map((leave) => (
                                    <Badge
                                      key={leave.id}
                                      variant="outline"
                                      className="border-[#E5DCCB] text-[#8C7654]"
                                    >
                                      {leave.type}
                                    </Badge>
                                  ))}
                                </div>
                              ) : day.isHoliday ? (
                                <Badge
                                  variant="outline"
                                  className="border-[#DFCBB5] bg-[#FAF9F5] text-[#8C7654]"
                                >
                                  {day.holidayDescription && day.holidayDescription !== "Holiday"
                                    ? day.holidayDescription
                                    : "Company Off"}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell
                              className="text-right font-bold"
                              style={{ color: BROWN }}
                            >
                              {day.total}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* A compact, dedicated canvas for a professional single-page Letter PDF. */}
      <div
        ref={pdfReportRef}
        aria-hidden="true"
        className="fixed top-0 w-[1400px] overflow-hidden bg-[#FDFDFB] p-6 font-sans text-[#2C241B]"
        style={{ left: "-10000px" }}
      >
        <header className="flex items-start justify-between border-b-2 border-[#C5A880] pb-3 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8C7654]">
              Insight Studio | Powered by Wasp
            </p>
            <h1 className="text-[24px] font-bold tracking-tight text-[#2C241B]">
              Performance & Availability Report
            </h1>
            <p className="text-[12px] text-[#8C7654] font-medium">
              {selectedProfile?.full_name || selectedProfile?.email} · {rangeLabel}
            </p>
          </div>
          <div className="rounded-lg border border-[#E5DCCB] bg-[#FAF9F5] px-4 py-2 text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#A59582]">
              Report generated
            </p>
            <p className="text-[12px] font-bold text-[#2C241B]">
              {format(new Date(), "MMM d, yyyy")}
            </p>
          </div>
        </header>

        {/* 6 Key Metrics Row */}
        <section className="grid grid-cols-6 gap-2.5 mb-3">
          {[
            {
              label: "Total Cases",
              value: analytics.totalCases,
              note: `${analytics.activeDays} active days`,
            },
            {
              label: "Reporting Rate",
              value: `${analytics.submissionRate}%`,
              note: `${analytics.submittedWorkDays} / ${analytics.availableWorkDays} work days`,
            },
            {
              label: "Leaves Taken",
              value: analytics.leaveDays,
              note: `${analytics.leaveRecords} record${analytics.leaveRecords === 1 ? "" : "s"}`,
            },
            {
              label: "New Dev",
              value: analytics.totalNewDev,
              note: `${analytics.totalCases ? Math.round((analytics.totalNewDev / analytics.totalCases) * 100) : 0}% of total`,
            },
            {
              label: "Updates",
              value: analytics.totalUpdates,
              note: `${analytics.totalCases ? Math.round((analytics.totalUpdates / analytics.totalCases) * 100) : 0}% of total`,
            },
            {
              label: "Avg / Active Day",
              value: analytics.averagePerActiveDay,
              note: analytics.peakDay ? `Peak: ${analytics.peakDay.label} (${analytics.peakDay.total})` : "—",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#E5DCCB] bg-white px-3 py-2"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#A59582]">
                {item.label}
              </p>
              <p className="text-[20px] font-bold text-[#2C241B] mt-0.5 leading-none">
                {item.value}
              </p>
              <p className="text-[9px] text-[#8C7654] mt-1 truncate">
                {item.note}
              </p>
            </div>
          ))}
        </section>

        {/* Middle Section: 3-column Overview */}
        <section className="grid grid-cols-[1.5fr_1fr_1.1fr] gap-3 mb-3">
          {/* Daily Throughput Chart */}
          <div className="rounded-lg border border-[#E5DCCB] bg-white p-3">
            <div className="flex items-center justify-between border-b border-[#E5DCCB] pb-1.5 mb-1.5">
              <h2 className="text-[12px] font-bold text-[#2C241B]">Daily Case Throughput</h2>
              <span className="text-[9px] font-bold text-[#8C7654]">
                {analytics.periodDays} days
              </span>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.daily}
                  margin={{ top: 5, right: 4, left: -24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={GOLD_LIGHT} vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval="preserveStartEnd"
                    tick={{ fontSize: 8, fill: BROWN_LIGHT }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 8, fill: BROWN_LIGHT }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="new_dev"
                    name="New Dev"
                    stackId="cases"
                    fill={GOLD}
                    shape={renderRoundedBar}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="updates"
                    name="Updates"
                    stackId="cases"
                    fill={BROWN_MID}
                    shape={renderRoundedBar}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Period Snapshot Summary */}
          <div className="rounded-lg border border-[#E5DCCB] bg-[#FAF9F5] p-3 text-[10.5px]">
            <h2 className="text-[12px] font-bold text-[#2C241B] border-b border-[#E5DCCB] pb-1.5 mb-2">
              Period Snapshot
            </h2>
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-[#E5DCCB]/60 pb-1">
                <span className="text-[#8C7654]">Average / Active Day</span>
                <strong className="text-[#2C241B]">{analytics.averagePerActiveDay} cases</strong>
              </div>
              <div className="flex justify-between border-b border-[#E5DCCB]/60 pb-1">
                <span className="text-[#8C7654]">Reporting Coverage</span>
                <strong className="text-[#2C241B]">{analytics.submittedWorkDays} / {analytics.availableWorkDays} work days ({analytics.submissionRate}%)</strong>
              </div>
              <div className="flex justify-between border-b border-[#E5DCCB]/60 pb-1">
                <span className="text-[#8C7654]">Peak Throughput</span>
                <strong className="text-[#2C241B]">
                  {analytics.peakDay ? `${analytics.peakDay.label} (${analytics.peakDay.total} cases)` : "—"}
                </strong>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-[#8C7654]">Work Mix Ratio</span>
                <strong className="text-[#2C241B]">
                  {analytics.totalNewDev} Dev · {analytics.totalUpdates} Upd
                </strong>
              </div>
            </div>
          </div>

          {/* Time Away & Holidays Table */}
          <div className="rounded-lg border border-[#E5DCCB] bg-white p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E5DCCB] pb-1.5 mb-2">
                <h2 className="text-[12px] font-bold text-[#2C241B]">Time Away & Holidays</h2>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C7654]">
                  {timeAwayItems.length} {timeAwayItems.length === 1 ? "Record" : "Records"}
                </span>
              </div>
              {timeAwayItems.length > 0 ? (
                <div className="space-y-1 max-h-[125px] overflow-hidden text-[9px]">
                  {timeAwayItems.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-0.5 border-b border-[#E5DCCB]/40"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[7.5px] font-bold uppercase ${item.isHoliday
                            ? "bg-[#EFE8DC] text-[#7A6241]"
                            : "bg-[#F6ECD8] text-[#8C6839]"
                            }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-[#8C7654] truncate">
                          {item.dateRangeText}
                        </span>
                      </div>
                      <span className="font-bold text-[#2C241B] shrink-0 ml-1.5">
                        {item.days}d
                      </span>
                    </div>
                  ))}
                  {timeAwayItems.length > 4 && (
                    <p className="text-[8px] text-[#8C7654] italic text-right pt-0.5">
                      +{timeAwayItems.length - 4} more records
                    </p>
                  )}
                </div>
              ) : (
                <div className="h-[105px] flex items-center justify-center text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#A59582]">
                    No time away in range
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bottom Section: Detailed Breakdown (2-column dense table) */}
        <section className="rounded-lg border border-[#E5DCCB] bg-white p-3">
          <div className="flex items-baseline justify-between border-b border-[#E5DCCB] pb-1.5 mb-2">
            <div>
              <h2 className="text-[12px] font-bold text-[#2C241B]">
                Detailed Daily Breakdown
              </h2>
              <p className="text-[9px] text-[#8C7654]">
                Status logs, declared holidays, and approved leave records
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#A59582]">
              {analytics.daily.length} days total
            </span>
          </div>

          <div
            className={`grid ${analytics.daily.length > 15 ? "grid-cols-2 gap-3" : "grid-cols-1"
              }`}
          >
            {[
              analytics.daily.length > 15
                ? analytics.daily.slice().reverse().slice(0, Math.ceil(analytics.daily.length / 2))
                : analytics.daily.slice().reverse(),
              ...(analytics.daily.length > 15
                ? [analytics.daily.slice().reverse().slice(Math.ceil(analytics.daily.length / 2))]
                : []),
            ].map((subList, subIdx) => (
              <table
                key={subIdx}
                className="w-full table-fixed border-collapse text-[8.5px]"
              >
                <thead>
                  <tr className="border-y border-[#E5DCCB] bg-[#FAF9F5] text-[8px] font-bold uppercase tracking-wider text-[#8C7654]">
                    <th className="w-[18%] px-1.5 py-0.5 text-left">Date</th>
                    <th className="w-[20%] px-1.5 py-0.5 text-left">Status</th>
                    <th className="w-[27%] px-1.5 py-0.5 text-left">New Dev</th>
                    <th className="w-[27%] px-1.5 py-0.5 text-left">Updates</th>
                    <th className="w-[8%] px-1.5 py-0.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {subList.map((day) => (
                    <tr
                      key={day.date}
                      className={`border-b border-[#E5DCCB]/50 align-middle ${day.leaves.length || day.isHoliday
                        ? "bg-[#C5A880]/[0.06]"
                        : ""
                        }`}
                    >
                      <td className="px-1.5 py-0.5 font-semibold whitespace-nowrap text-[#2C241B]">
                        {format(parseISO(day.date), "MMM d, EEE")}
                      </td>
                      <td className="px-1.5 py-0.5">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[7.5px] font-bold uppercase whitespace-nowrap ${day.leaves.length
                            ? "bg-[#F6ECD8] text-[#8C6839]"
                            : day.isHoliday
                              ? "bg-[#EFE8DC] text-[#7A6241]"
                              : !day.isWorkday
                                ? "bg-[#EEF0F5] text-[#657083]"
                                : day.submitted
                                  ? "bg-[#E7F1E7] text-[#527052]"
                                  : "border border-[#E5DCCB] text-[#A59582]"
                            }`}
                        >
                          {day.leaves.length
                            ? "On Leave"
                            : day.isHoliday
                              ? "Company Off"
                              : !day.isWorkday
                                ? "Week Off"
                                : day.submitted
                                  ? "Submitted"
                                  : "No Log"}
                        </span>
                      </td>
                      <td className="px-1.5 py-0.5 truncate text-[#8C7654]">
                        {day.newDevLinks.length
                          ? day.newDevLinks.map(getCaseKey).join(", ")
                          : "—"}
                      </td>
                      <td className="px-1.5 py-0.5 truncate text-[#8C7654]">
                        {day.updateLinks.length
                          ? day.updateLinks.map(getCaseKey).join(", ")
                          : "—"}
                      </td>
                      <td className="px-1.5 py-0.5 text-right font-bold text-[#2C241B]">
                        {day.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-2.5 pt-2 border-t border-[#E5DCCB] flex items-center justify-between text-[8px] text-[#A59582]">
          <span>Confidential · Generated via Wasp Insight Studio</span>
          <span>All metrics are synchronized with team status logs and schedule records.</span>
        </footer>
      </div>
    </div>
  );
};

const EmptyChart = ({ message }: { message: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center gap-2">
    <ShieldAlert className="w-8 h-8 text-[#C5A880]" />
    <span className="text-xs font-bold uppercase tracking-widest text-[#A59582]">
      {message}
    </span>
  </div>
);

const CaseLinks = ({ links }: { links: string[] }) =>
  links.length ? (
    <TableCell>
      <div className="space-y-1 min-w-[120px] max-w-[220px]">
        {links.map((link, index) => (
          <a
            key={`${link}-${index}`}
            href={link}
            target="_blank"
            rel="noreferrer"
            title={link}
            className="block text-xs font-semibold text-[#8C7654] hover:text-[#2C241B] hover:underline"
          >
            {getCaseKey(link)}
          </a>
        ))}
      </div>
    </TableCell>
  ) : (
    <TableCell>
      <span className="text-xs text-muted-foreground">—</span>
    </TableCell>
  );

export default AdvancedAnalytics;
