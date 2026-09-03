// components/custom/CalendarWithDots.tsx
import * as React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarWithDotsProps {
    selected?: Date;
    onSelect?: (date: Date) => void;
    onMonthChange?: (date: Date) => void;
    monthStats: Record<string, { total: number }>; // yyyy-MM-dd → count
    holidays?: Record<string, string>; // yyyy-MM-dd → Holiday Name
    className?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarWithDots({
    selected,
    onSelect,
    onMonthChange,
    monthStats,
    holidays,
    className,
}: CalendarWithDotsProps) {
    const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());

    React.useEffect(() => {
        if (selected) {
            setCurrentMonth(selected);
        }
    }, [selected]);

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add empty cells for days before month start
    const firstDayOfWeek = start.getDay();
    const leadingDays = Array(firstDayOfWeek).fill(null);

    const prevMonth = () => {
        const newMonth = subMonths(currentMonth, 1);
        setCurrentMonth(newMonth);
        onMonthChange?.(newMonth);
    };

    // const nextMonth = () => {
    //     const newMonth = addMonths(currentMonth, 1);
    //     setCurrentMonth(newMonth);
    //     onMonthChange?.(newMonth);
    // };

    const hasData = (date: Date) => {
        const key = format(date, "yyyy-MM-dd");
        return monthStats[key]?.total > 0;
    };

    const getHolidayName = (date: Date) => {
        const key = format(date, "yyyy-MM-dd");
        return holidays?.[key];
    };

    const today = new Date();
    const isCurrentMonth = isSameMonth(currentMonth, today);

    const nextMonth = () => {
        // Don't allow navigating beyond the current month
        if (isCurrentMonth) return;

        const newMonth = addMonths(currentMonth, 1);
        setCurrentMonth(newMonth);
        onMonthChange?.(newMonth);
    };


    return (
        <div className={cn("w-full  mx-auto  rounded-lg  ", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-0 ">
                <button
                    onClick={prevMonth}
                    className="p-2 rounded-full hover:bg-[#E3DAC9] transition-colors hover:text-white border border-[#E3DAC9]"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold">
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <button
                    onClick={nextMonth}
                    disabled={isCurrentMonth}
                    className={cn(
                        "p-2 rounded-full border border-[#E3DAC9] transition-colors",
                        !isCurrentMonth && "hover:bg-[#E3DAC9] hover:text-white",
                        isCurrentMonth && "opacity-30 cursor-not-allowed"
                    )}
                    aria-label="Next month"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 p-3">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1 px-3 pb-4">
                {/* Leading empty cells */}
                {leadingDays.map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {/* Actual days */}
                {days.map((day) => {
                    const isSelected = selected && isSameDay(day, selected);
                    const isToday = isSameDay(day, new Date());
                    const dataExists = hasData(day);
                    const holidayName = getHolidayName(day);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isFutureDate = day > today;

                    return (
                        <button
                            key={day.toISOString()}
                            disabled={isFutureDate}
                            onClick={() => onSelect?.(day)}
                            className={cn(
                                "relative flex items-center justify-center w-full aspect-square max-w-10 mx-auto rounded-full text-sm transition-all",
                                !isFutureDate && "hover:bg-[#997C53] hover:text-accent-foreground",
                                isFutureDate && "opacity-30 cursor-not-allowed",
                                isSelected && "bg-[#2C241B] text-primary-foreground font-bold shadow-md",
                                isToday && !isSelected && "font-bold text-[#2C241B] ring-2 ring-[#997C53]/50",
                                dataExists && !isSelected && "font-bold text-[#2C241B]",
                                isWeekend && !isSelected && !dataExists && "text-muted-foreground/40 bg-muted/30",
                                holidayName && !isSelected && "text-orange-500 font-bold bg-orange-500/10"
                            )}
                            title={
                                isFutureDate
                                    ? "Future date"
                                    : holidayName || (isWeekend ? "Weekend Off" : undefined)
                            }
                            aria-label={format(day, "PPP")}
                        >
                            {format(day, "d")}

                            {/* Dot indicator for activity */}
                            {dataExists && (
                                <span
                                    className={cn(
                                        "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                                        isSelected ? "bg-primary-foreground" : "bg-[#997C53]"
                                    )}
                                />
                            )}

                            {/* Dot indicator for holiday */}
                            {holidayName && !dataExists && (
                                <span
                                    className={cn(
                                        "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                                        isSelected ? "bg-primary-foreground" : "bg-orange-500"
                                    )}
                                />
                            )}

                            {/* Holiday Bubble Indicator */}
                            {holidayName && !dataExists && !isSelected && (
                                <span className="absolute -top-1 -right-3 text-[8px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full uppercase border border-orange-200 shadow-sm z-10">
                                    Off
                                </span>
                            )}

                            {/* Weekend indicator if no data and not a holiday */}
                            {isWeekend && !dataExists && !isSelected && !holidayName && (
                                <span className="absolute -top-1 -right-1 text-[8px] font-bold text-muted-foreground/30 px-1 rounded-full uppercase">
                                    Off
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}