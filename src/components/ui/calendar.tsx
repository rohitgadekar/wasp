import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-[#FDFDFB] rounded-xl font-inter", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold tracking-wide text-[#2C241B]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-full border border-[#E3DAC9] bg-white p-0",
          "text-[#8C7654] transition-colors hover:bg-[#FAF9F5] hover:text-[#2C241B]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]/30"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-[#8C7654] rounded-md w-9 font-bold text-[10px] uppercase tracking-[0.12em]",
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative",
          // mid-range cells: flat band background
          "[&:has([aria-selected]:not(.day-range-start):not(.day-range-end))]:bg-[#C5A880]/15",
          // start cell: only left half rounded → pill left cap
          "[&:has(.day-range-start)]:rounded-l-full [&:has(.day-range-start)]:bg-[#C5A880]/15",
          // end cell: only right half rounded → pill right cap
          "[&:has(.day-range-end)]:rounded-r-full [&:has(.day-range-end)]:bg-[#C5A880]/15",
          // edge of row: cap the band
          "first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
          "[&:has([aria-selected].day-outside)]:bg-[#C5A880]/8"
        ),
        day: cn(
          "inline-flex items-center justify-center h-9 w-9 p-0 text-sm font-medium rounded-full transition-colors relative z-10",
          "text-[#2C241B] hover:bg-[#C5A880]/25 hover:text-[#2C241B]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]/40",
          "aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#2C241B] text-[#FDFDFB] hover:bg-[#2C241B] hover:text-[#FDFDFB] focus:bg-[#2C241B] focus:text-[#FDFDFB] font-semibold rounded-full",
        day_today:
          "bg-[#C5A880]/15 text-[#2C241B] font-bold ring-2 ring-[#C5A880]/35 aria-selected:bg-[#2C241B] aria-selected:text-[#FDFDFB] aria-selected:ring-[#2C241B]",
        day_outside:
          "day-outside text-[#A59582]/40 aria-selected:bg-transparent aria-selected:text-[#8C7654]/60 aria-selected:opacity-100",
        day_disabled: "text-[#A59582]/30 hover:bg-transparent cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-transparent aria-selected:text-[#2C241B] aria-selected:hover:bg-[#C5A880]/25 rounded-full",
        day_hidden: "invisible",
        ...classNames,
      }}
      modifiersClassNames={{
        hasData: "has-data",
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
