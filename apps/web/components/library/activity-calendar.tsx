"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@tabchatdotlive/convex";
import type { Id } from "@tabchatdotlive/convex";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ActivityCalendarProps {
  userId: Id<"users">;
}

export function ActivityCalendar({ userId }: ActivityCalendarProps) {
  const links = useQuery(
    api.links.getByUser,
    userId ? { userId } : "skip"
  );

  // Calculate activity data
  const activityData = useMemo(() => {
    if (!links) return new Map<string, number>();

    const activity = new Map<string, number>();
    
    links.forEach((link) => {
      const date = new Date(link.createdAt);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
      activity.set(dateKey, (activity.get(dateKey) || 0) + 1);
    });

    return activity;
  }, [links]);

  // Generate calendar data for last 6 months
  const calendarData = useMemo(() => {
    const months: Array<{
      name: string;
      shortName: string;
      weeks: Array<Array<{ date: Date; isActive: boolean; count: number } | null>>;
    }> = [];

    const today = new Date();
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString("default", { month: "long" });
      const shortName = monthDate.toLocaleString("default", { month: "short" });

      // Get first day of month
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      // Convert to Monday = 0, Tuesday = 1, etc.
      let firstDayOfWeek = firstDay.getDay() - 1;
      if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Sunday becomes 6

      // Get last day of month
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const daysInMonth = lastDay.getDate();

      // Create weeks array
      const weeks: Array<Array<{ date: Date; isActive: boolean; count: number } | null>> = [];
      let currentWeek: Array<{ date: Date; isActive: boolean; count: number } | null> = [];

      // Add nulls for days before the first day of the month
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }

      // Add all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        const dateKey = date.toISOString().split("T")[0];
        const count = activityData.get(dateKey) || 0;
        const isActive = count > 0;

        currentWeek.push({ date, isActive, count });

        // Start new week if we've filled 7 days
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // Fill remaining days of last week with nulls
      while (currentWeek.length < 7 && currentWeek.length > 0) {
        currentWeek.push(null);
      }
      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }
      
      months.push({ name: monthName, shortName, weeks });
    }

    return { months, daysOfWeek };
  }, [activityData]);

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 hover:bg-gray-200";
    if (count === 1) return "bg-emerald-200 hover:bg-emerald-300";
    if (count <= 3) return "bg-emerald-300 hover:bg-emerald-400";
    if (count <= 5) return "bg-emerald-400 hover:bg-emerald-500";
    return "bg-emerald-500 hover:bg-emerald-600";
  };

  if (links === undefined) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-32 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm w-full">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">You need to read more...</h2>
      </div>
      
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex justify-between min-w-[800px] px-1">
          {/* Days of week labels - vertical on left */}
          <div className="flex flex-col justify-between mt-[38px] pr-4 sticky left-0 bg-white z-10 h-[140px]">
            {calendarData.daysOfWeek.map((day) => (
              <div
                key={day}
                className="h-4 flex items-center text-xs text-gray-400 font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          <TooltipProvider>
            {/* Calendar months */}
            <div className="flex flex-1 justify-between gap-8">
              {calendarData.months.map((month, monthIdx) => (
                <div key={monthIdx} className="flex flex-col gap-4">
                  {/* Month header */}
                  <div className="text-sm font-medium text-gray-600 text-center">
                    {month.name}
                  </div>

                  {/* Calendar grid */}
                  <div className="flex gap-1.5 h-[140px]">
                    {/* Render weeks as columns */}
                    {month.weeks.map((week, weekIdx) => (
                      <div key={weekIdx} className="flex flex-col justify-between h-full">
                        {/* Render 7 day rows */}
                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                          const day = week[dayIndex];
                          
                          return (
                            <Tooltip key={dayIndex}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-[3px] transition-colors cursor-pointer",
                                    day === null ? "bg-transparent" : getColor(day.count)
                                  )}
                                />
                              </TooltipTrigger>
                              {day && (
                                <TooltipContent>
                                  <div className="text-xs">
                                    <span className="font-medium">
                                      {day.count} link{day.count !== 1 ? "s" : ""}
                                    </span>
                                    <span className="text-gray-400 mx-1">•</span>
                                    {day.date.toLocaleDateString(undefined, { 
                                      weekday: 'long', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-6 mt-6 text-xs text-gray-500">
        <span className="mr-2">Less</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-[3px] bg-gray-100" />
          <div className="w-4 h-4 rounded-[3px] bg-emerald-200" />
          <div className="w-4 h-4 rounded-[3px] bg-emerald-300" />
          <div className="w-4 h-4 rounded-[3px] bg-emerald-400" />
          <div className="w-4 h-4 rounded-[3px] bg-emerald-500" />
        </div>
        <span className="ml-2">More</span>
      </div>
    </div>
  );
}
