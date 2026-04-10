import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVisitsForDate, COLOR_MAP } from "@/data/mockData";
import VisitBadge from "@/components/VisitBadge";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedVisits = getVisitsForDate(selectedDate);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-1">View and manage appointments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prev} className="p-2 rounded-md hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-display text-lg font-semibold">{monthName}</h2>
            <button onClick={next} className="p-2 rounded-md hover:bg-muted transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">{d}</div>
            ))}
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
              const dayVisits = getVisitsForDate(dateStr);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split("T")[0];

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative p-2 h-20 rounded-lg text-sm text-left transition-colors ${
                    isSelected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"
                  } ${isToday ? "font-bold" : ""}`}
                >
                  <span className={`${isToday ? "text-primary" : ""}`}>{day}</span>
                  {dayVisits.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayVisits.slice(0, 3).map((v) => {
                        const info = COLOR_MAP[v.colorId] || COLOR_MAP[0];
                        return <div key={v.id} className={`w-2 h-2 rounded-full ${info.bg}`} />;
                      })}
                      {dayVisits.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{dayVisits.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-display font-semibold mb-4">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {selectedVisits.length === 0 ? (
            <p className="text-muted-foreground text-sm">No appointments</p>
          ) : (
            <div className="space-y-3">
              {selectedVisits.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((v) => (
                <div key={v.id} className="p-3 rounded-md bg-muted/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{v.clientName}</span>
                    <VisitBadge colorId={v.colorId} />
                  </div>
                  <p className="text-xs text-muted-foreground">{v.startTime} - {v.endTime} · {v.duration}min</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
