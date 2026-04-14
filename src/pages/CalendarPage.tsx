import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Ban, X, Clock, Pencil, Trash2, CalendarDays, GripVertical, CalendarIcon } from "lucide-react";
import { COLOR_MAP, Visit } from "@/data/mockData";
import { useVisitsStore, TimeBlock } from "@/stores/visitsStore";
import VisitBadge from "@/components/VisitBadge";
import BookingDialog from "@/components/BookingDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── helpers ──
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y: number, m: number) { return new Date(y, m, 1).getDay(); }

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM – 7 PM
const SLOT_H = 60; // px per hour
const SNAP_MINUTES = 15; // snap drag to 15-min increments

function timeToY(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h - 8) * SLOT_H + (m / 60) * SLOT_H;
}

function yToMinutes(y: number) {
  return Math.round((y / SLOT_H) * 60) + 8 * 60;
}

function snapMinutes(mins: number) {
  return Math.round(mins / SNAP_MINUTES) * SNAP_MINUTES;
}

function minutesToTime(totalMins: number) {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function formatHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr} ${ampm}`;
}

function formatTime12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getVisitLane(v: Visit): "consultation" | "therapy" {
  const ct = v.colorId;
  if (ct === 0 || ct === 1 || ct === 3 || ct === 9) return "consultation";
  return "therapy";
}

// ── Time Picker Wheel Component (Apple-style) ──
function TimePickerWheel({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [h, m] = value.split(":").map(Number);
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8-19
  const minutes = [0, 15, 30, 45];

  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 40;

  useEffect(() => {
    if (hourRef.current) {
      const idx = hours.indexOf(h);
      hourRef.current.scrollTop = idx * ITEM_H;
    }
    if (minRef.current) {
      const idx = minutes.indexOf(m >= 45 ? 45 : m >= 30 ? 30 : m >= 15 ? 15 : 0);
      minRef.current.scrollTop = idx * ITEM_H;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHourScroll = () => {
    if (!hourRef.current) return;
    const idx = Math.round(hourRef.current.scrollTop / ITEM_H);
    const newH = hours[Math.min(idx, hours.length - 1)];
    if (newH !== h) onChange(`${newH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  };

  const handleMinScroll = () => {
    if (!minRef.current) return;
    const idx = Math.round(minRef.current.scrollTop / ITEM_H);
    const newM = minutes[Math.min(idx, minutes.length - 1)];
    if (newM !== (m >= 45 ? 45 : m >= 30 ? 30 : m >= 15 ? 15 : 0)) onChange(`${h.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`);
  };

  const setTime = (newH: number, newM: number) => {
    onChange(`${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`);
    if (hourRef.current) hourRef.current.scrollTo({ top: hours.indexOf(newH) * ITEM_H, behavior: "smooth" });
    if (minRef.current) minRef.current.scrollTo({ top: minutes.indexOf(newM) * ITEM_H, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col items-center">
      <Label className="text-xs text-muted-foreground mb-2">{label}</Label>
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 border border-border">
        {/* Hour wheel */}
        <div className="relative h-[120px] w-[56px] overflow-hidden">
          <div className="absolute inset-x-0 top-[40px] h-[40px] bg-primary/10 rounded-lg border border-primary/20 pointer-events-none z-10" />
          <div
            ref={hourRef}
            onScroll={handleHourScroll}
            className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
            style={{ scrollSnapType: "y mandatory", paddingTop: 40, paddingBottom: 40 }}
          >
            {hours.map((hr) => {
              const isActive = hr === h;
              const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
              return (
                <button
                  key={hr}
                  onClick={() => setTime(hr, m >= 45 ? 45 : m >= 30 ? 30 : m >= 15 ? 15 : 0)}
                  className={cn(
                    "w-full h-[40px] flex items-center justify-center text-sm snap-center transition-all",
                    isActive ? "font-bold text-primary scale-110" : "text-muted-foreground"
                  )}
                >
                  {display}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-lg font-bold text-muted-foreground">:</span>

        {/* Minute wheel */}
        <div className="relative h-[120px] w-[56px] overflow-hidden">
          <div className="absolute inset-x-0 top-[40px] h-[40px] bg-primary/10 rounded-lg border border-primary/20 pointer-events-none z-10" />
          <div
            ref={minRef}
            onScroll={handleMinScroll}
            className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
            style={{ scrollSnapType: "y mandatory", paddingTop: 40, paddingBottom: 40 }}
          >
            {minutes.map((mn) => {
              const closestM = m >= 45 ? 45 : m >= 30 ? 30 : m >= 15 ? 15 : 0;
              const isActive = mn === closestM;
              return (
                <button
                  key={mn}
                  onClick={() => setTime(h, mn)}
                  className={cn(
                    "w-full h-[40px] flex items-center justify-center text-sm snap-center transition-all",
                    isActive ? "font-bold text-primary scale-110" : "text-muted-foreground"
                  )}
                >
                  {mn.toString().padStart(2, "0")}
                </button>
              );
            })}
          </div>
        </div>

        {/* AM/PM */}
        <div className="flex flex-col gap-1 ml-1">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", h < 12 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground")}>AM</span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", h >= 12 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground")}>PM</span>
        </div>
      </div>
      <p className="text-sm font-semibold mt-2 text-foreground">{formatTime12(value)}</p>
    </div>
  );
}

// ── Main Component ──
export default function CalendarPage() {
  const visits = useVisitsStore((s) => s.visits);
  const blocks = useVisitsStore((s) => s.blocks);
  const updateVisit = useVisitsStore((s) => s.updateVisit);
  const deleteVisit = useVisitsStore((s) => s.deleteVisit);
  const addBlock = useVisitsStore((s) => s.addBlock);
  const removeBlock = useVisitsStore((s) => s.removeBlock);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState<"month" | "day">("day");

  // Edit dialog
  const [editVisit, setEditVisit] = useState<Visit | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Block dialog
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockLane, setBlockLane] = useState<"consultation" | "therapy" | "both">("both");
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("17:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockDateRange, setBlockDateRange] = useState<{ from: Date; to?: Date }>({
    from: new Date(),
  });
  const [blockFullDay, setBlockFullDay] = useState(true);

  // Drag state
  const [dragging, setDragging] = useState<{ visitId: number; startY: number; origStartMins: number; origDuration: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ top: number; height: number } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const dayVisits = useMemo(() => visits.filter((v) => v.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime)), [visits, selectedDate]);
  const dayBlocks = useMemo(() => blocks.filter((b) => b.date === selectedDate), [blocks, selectedDate]);

  const consultVisits = dayVisits.filter((v) => getVisitLane(v) === "consultation");
  const therapyVisits = dayVisits.filter((v) => getVisitLane(v) === "therapy");
  const consultBlocks = dayBlocks.filter((b) => b.lane === "consultation");
  const therapyBlocks = dayBlocks.filter((b) => b.lane === "therapy");

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const goToDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setViewMode("day");
  };

  // ── Edit handlers ──
  const openEdit = (v: Visit) => {
    if (dragging) return; // don't open on drag end
    setEditVisit(v);
    setEditStart(v.startTime);
    setEditEnd(v.endTime);
  };

  const saveEdit = () => {
    if (!editVisit) return;
    const [sh, sm] = editStart.split(":").map(Number);
    const [eh, em] = editEnd.split(":").map(Number);
    const dur = (eh * 60 + em) - (sh * 60 + sm);
    if (dur <= 0) { toast.error("End time must be after start time"); return; }
    updateVisit(editVisit.id, { startTime: editStart, endTime: editEnd, duration: dur });
    toast.success("Appointment updated");
    setEditVisit(null);
  };

  const cancelVisit = () => {
    if (!editVisit) return;
    updateVisit(editVisit.id, { colorId: 11 });
    toast.success("Appointment cancelled");
    setEditVisit(null);
  };

  const removeVisit = () => {
    if (!editVisit) return;
    deleteVisit(editVisit.id);
    toast.success("Appointment deleted");
    setEditVisit(null);
  };

  // ── Block handlers ──
  const saveBlock = () => {
    const start = blockFullDay ? "08:00" : blockStart;
    const end = blockFullDay ? "20:00" : blockEnd;
    if (start >= end) { toast.error("End time must be after start"); return; }
    if (!blockDateRange.from) { toast.error("Please select at least one date"); return; }

    const fromDate = new Date(blockDateRange.from);
    const toDate = blockDateRange.to ? new Date(blockDateRange.to) : fromDate;
    const lanes: ("consultation" | "therapy")[] = blockLane === "both" ? ["consultation", "therapy"] : [blockLane];
    
    let count = 0;
    const current = new Date(fromDate);
    while (current <= toDate) {
      const dateStr = current.toISOString().split("T")[0];
      for (const lane of lanes) {
        addBlock({ date: dateStr, startTime: start, endTime: end, lane, reason: blockReason || "Blocked" });
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    toast.success(`Blocked ${count} slot${count > 1 ? "s" : ""} across ${Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000) + 1} day(s)`);
    setBlockOpen(false);
    setBlockReason("");
    setBlockFullDay(true);
  };

  // ── Drag handlers ──
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, v: Visit) => {
    e.preventDefault();
    e.stopPropagation();
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const [sh, sm] = v.startTime.split(":").map(Number);
    setDragging({ visitId: v.id, startY: clientY, origStartMins: sh * 60 + sm, origDuration: v.duration });
    setDragPreview({ top: timeToY(v.startTime), height: (v.duration / 60) * SLOT_H });
  }, []);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragging.startY;
    const deltaMins = (deltaY / SLOT_H) * 60;
    const newStartMins = snapMinutes(dragging.origStartMins + deltaMins);
    const clampedStart = Math.max(8 * 60, Math.min(19 * 60 - dragging.origDuration, newStartMins));
    setDragPreview({
      top: ((clampedStart - 8 * 60) / 60) * SLOT_H,
      height: (dragging.origDuration / 60) * SLOT_H,
    });
  }, [dragging]);

  const handleDragEnd = useCallback(() => {
    if (!dragging || !dragPreview) { setDragging(null); setDragPreview(null); return; }
    const newStartMins = yToMinutes(dragPreview.top);
    const snapped = snapMinutes(newStartMins);
    const newStart = minutesToTime(snapped);
    const newEnd = minutesToTime(snapped + dragging.origDuration);

    // Check if dropping into a blocked slot
    const draggedVisit = visits.find((v) => v.id === dragging.visitId);
    if (draggedVisit) {
      const lane = getVisitLane(draggedVisit);
      const dayBlks = blocks.filter((b) => b.date === selectedDate && b.lane === lane);
      for (const b of dayBlks) {
        const [bh, bm] = b.startTime.split(":").map(Number);
        const [beh, bem] = b.endTime.split(":").map(Number);
        const bStart = bh * 60 + bm;
        const bEnd = beh * 60 + bem;
        if (snapped < bEnd && (snapped + dragging.origDuration) > bStart) {
          toast.error(`Can't move here — blocked (${b.reason}) from ${b.startTime} to ${b.endTime}`);
          setDragging(null);
          setDragPreview(null);
          return;
        }
      }
    }

    updateVisit(dragging.visitId, { startTime: newStart, endTime: newEnd });
    toast.success(`Moved to ${formatTime12(newStart)}`);
    setDragging(null);
    setDragPreview(null);
  }, [dragging, dragPreview, updateVisit, visits, blocks, selectedDate]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent | TouchEvent) => handleDragMove(e);
    const end = () => handleDragEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  // ── Render time grid lane ──
  const renderLane = (laneVisits: Visit[], laneBlocks: TimeBlock[], label: string) => (
    <div className="flex-1 min-w-0">
      <div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide py-2 border-b border-border bg-muted/30">
        {label}
      </div>
      <div className="relative" style={{ height: HOURS.length * SLOT_H }}>
        {/* Hour lines */}
        {HOURS.map((h) => (
          <div key={h} className="absolute w-full border-t border-border/40" style={{ top: (h - 8) * SLOT_H }} />
        ))}
        {/* Half-hour lines */}
        {HOURS.map((h) => (
          <div key={`half-${h}`} className="absolute w-full border-t border-border/20 border-dashed" style={{ top: (h - 8) * SLOT_H + SLOT_H / 2 }} />
        ))}

        {/* Blocks */}
        {laneBlocks.map((b) => {
          const top = timeToY(b.startTime);
          const height = timeToY(b.endTime) - top;
          return (
            <div
              key={`block-${b.id}`}
              className="absolute left-1 right-1 rounded-md bg-destructive/15 border border-destructive/30 flex items-center justify-between px-2 group cursor-default z-10"
              style={{ top, height: Math.max(height, 20) }}
            >
              <div className="flex items-center gap-1 min-w-0">
                <Ban className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[10px] text-destructive font-medium truncate">{b.reason}</span>
              </div>
              <button
                onClick={() => { removeBlock(b.id); toast("Block removed"); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-destructive" />
              </button>
            </div>
          );
        })}

        {/* Drag preview ghost */}
        {dragging && dragPreview && laneVisits.some((v) => v.id === dragging.visitId) && (
          <div
            className="absolute left-1 right-1 rounded-md bg-primary/20 border-2 border-primary border-dashed z-30 pointer-events-none flex items-center justify-center"
            style={{ top: dragPreview.top, height: Math.max(dragPreview.height, 24) }}
          >
            <span className="text-[10px] font-semibold text-primary">
              {formatTime12(minutesToTime(snapMinutes(yToMinutes(dragPreview.top))))}
            </span>
          </div>
        )}

        {/* Visits */}
        {laneVisits.map((v) => {
          const info = COLOR_MAP[v.colorId] || COLOR_MAP[0];
          const isDraggingThis = dragging?.visitId === v.id;
          const top = isDraggingThis && dragPreview ? dragPreview.top : timeToY(v.startTime);
          const height = (v.duration / 60) * SLOT_H;
          const isCancelled = v.colorId === 11;

          return (
            <div
              key={v.id}
              className={cn(
                "absolute left-1 right-1 rounded-md px-2 py-1 text-left transition-shadow z-20 group/visit",
                info.bg,
                isCancelled && "opacity-50 line-through",
                isDraggingThis && "opacity-70 shadow-lg ring-2 ring-primary scale-[1.02]",
                !isDraggingThis && "hover:ring-2 hover:ring-primary/40 cursor-pointer"
              )}
              style={{ top, height: Math.max(height, 24) }}
              onClick={() => !dragging && openEdit(v)}
            >
              {/* Drag handle */}
              {!isCancelled && (
                <div
                  className="absolute top-0 left-0 right-0 h-5 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover/visit:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleDragStart(e, v)}
                  onTouchStart={(e) => handleDragStart(e, v)}
                >
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <p className={`text-[11px] font-semibold truncate ${info.color}`}>{v.clientName}</p>
              {height >= 36 && (
                <p className={`text-[10px] ${info.color} opacity-70`}>{v.startTime} – {v.endTime}</p>
              )}
              {height >= 50 && v.visitType && (
                <p className={`text-[10px] ${info.color} opacity-60`}>{v.visitType}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBlockOpen(true)} className="gap-1.5">
            <Ban className="w-4 h-4" /> Block Time
          </Button>
          <BookingDialog defaultDate={selectedDate} />
        </div>
      </div>

      {/* View toggle + date nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "day" ? "default" : "outline"} size="sm" onClick={() => setViewMode("day")}>Day</Button>
          <Button variant={viewMode === "month" ? "default" : "outline"} size="sm" onClick={() => setViewMode("month")}>Month</Button>
        </div>
        {viewMode === "day" && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split("T")[0]);
            }}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="font-display font-semibold text-sm min-w-[180px] text-center">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split("T")[0]);
            }}><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" className="ml-2 text-xs" onClick={() => setSelectedDate(todayStr)}>Today</Button>
          </div>
        )}
        {viewMode === "month" && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="font-display font-semibold text-sm">{monthName}</span>
            <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </div>

      {/* ═══ MONTH VIEW ═══ */}
      {viewMode === "month" && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">{d}</div>
            ))}
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
              const dayV = visits.filter((v) => v.date === dateStr);
              const isSelected = dateStr === selectedDate;
              const isTodayCell = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => goToDate(dateStr)}
                  className={`relative p-2 h-20 rounded-lg text-sm text-left transition-colors ${
                    isSelected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"
                  } ${isTodayCell ? "font-bold" : ""}`}
                >
                  <span className={isTodayCell ? "text-primary" : ""}>{day}</span>
                  {dayV.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayV.slice(0, 3).map((v) => {
                        const info = COLOR_MAP[v.colorId] || COLOR_MAP[0];
                        return <div key={v.id} className={`w-2 h-2 rounded-full ${info.bg}`} />;
                      })}
                      {dayV.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{dayV.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ DAY VIEW ═══ */}
      {viewMode === "day" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {dayVisits.length} appointments</span>
            <span>{consultVisits.length} consultations</span>
            <span>{therapyVisits.length} therapies</span>
            {dayBlocks.length > 0 && <span className="text-destructive">{dayBlocks.length} blocked</span>}
            <span className="ml-auto text-[10px] italic">Drag appointments to reschedule</span>
          </div>

          <div className="flex overflow-x-auto">
            {/* Time gutter */}
            <div className="w-16 shrink-0 border-r border-border bg-muted/20">
              <div className="py-2 border-b border-border" style={{ height: 33 }} />
              {HOURS.map((h) => (
                <div key={h} className="relative" style={{ height: SLOT_H }}>
                  <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground font-medium">
                    {formatHour(h)}
                  </span>
                </div>
              ))}
            </div>

            {renderLane(consultVisits, consultBlocks, "Consultation")}
            <div className="w-px bg-border shrink-0" />
            {renderLane(therapyVisits, therapyBlocks, "Therapy")}
          </div>
        </div>
      )}

      {/* ═══ EDIT VISIT DIALOG ═══ */}
      <Dialog open={!!editVisit} onOpenChange={(o) => !o && setEditVisit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit Appointment
            </DialogTitle>
          </DialogHeader>
          {editVisit && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {editVisit.clientName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-medium text-sm">{editVisit.clientName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <VisitBadge colorId={editVisit.colorId} />
                    <span className="text-xs text-muted-foreground">{editVisit.date}</span>
                  </div>
                </div>
              </div>

              {/* Apple-style time pickers */}
              <div className="flex justify-center gap-8">
                <TimePickerWheel value={editStart} onChange={setEditStart} label="Start" />
                <TimePickerWheel value={editEnd} onChange={setEditEnd} label="End" />
              </div>

              {editVisit.packageType && (
                <p className="text-xs text-muted-foreground text-center">Package: {editVisit.packageType}</p>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={removeVisit} className="gap-1">
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
              {editVisit?.colorId !== 11 && (
                <Button variant="outline" size="sm" onClick={cancelVisit} className="gap-1 text-destructive border-destructive/30">
                  <X className="w-3 h-3" /> Cancel Visit
                </Button>
              )}
            </div>
            <Button size="sm" onClick={saveEdit} className="gap-1">
              <Clock className="w-3 h-3" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ BLOCK TIME DIALOG ═══ */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-4 h-4" /> Block Time Slot
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Date Range */}
            <div>
              <Label className="text-xs font-medium mb-2 block">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {blockDateRange.from ? (
                      blockDateRange.to ? (
                        <>
                          {format(blockDateRange.from, "MMM d, yyyy")} — {format(blockDateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(blockDateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span className="text-muted-foreground">Pick dates</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={blockDateRange}
                    onSelect={(range) => range && setBlockDateRange(range as { from: Date; to?: Date })}
                    numberOfMonths={2}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Lane selection */}
            <div>
              <Label className="text-xs font-medium mb-2 block">Block For</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "both", label: "Both", icon: "🔒" },
                  { value: "consultation", label: "Consultation", icon: "💬" },
                  { value: "therapy", label: "Therapy", icon: "💆" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBlockLane(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm",
                      blockLane === opt.value
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-card hover:border-primary/40 text-muted-foreground"
                    )}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Full day toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBlockFullDay(!blockFullDay)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  blockFullDay ? "bg-primary" : "bg-muted"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  blockFullDay ? "translate-x-[22px]" : "translate-x-0.5"
                )} />
              </button>
              <Label className="text-sm cursor-pointer" onClick={() => setBlockFullDay(!blockFullDay)}>
                Full day block
              </Label>
            </div>

            {/* Time selection (only when not full day) */}
            {!blockFullDay && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Time</Label>
                  <Input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">End Time</Label>
                  <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Reason</Label>
              <Input placeholder="e.g. Doctor on leave, Holiday, Maintenance" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
            </div>

            {/* Summary */}
            {blockDateRange.from && (
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm">Summary</p>
                <p>📅 {blockDateRange.to
                  ? `${Math.ceil((blockDateRange.to.getTime() - blockDateRange.from.getTime()) / 86400000) + 1} days`
                  : "1 day"
                }</p>
                <p>⏰ {blockFullDay ? "Full day (8 AM – 8 PM)" : `${blockStart} – ${blockEnd}`}</p>
                <p>🔒 {blockLane === "both" ? "Consultation & Therapy" : blockLane === "consultation" ? "Consultation only" : "Therapy only"}</p>
                {blockReason && <p>📝 {blockReason}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>Cancel</Button>
            <Button onClick={saveBlock} className="gap-1.5">
              <Ban className="w-3.5 h-3.5" /> Block Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
