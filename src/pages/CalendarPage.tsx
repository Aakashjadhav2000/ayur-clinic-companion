import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Ban, X, Clock, Pencil, Trash2, CalendarDays } from "lucide-react";
import { COLOR_MAP, Visit } from "@/data/mockData";
import { useVisitsStore, TimeBlock } from "@/stores/visitsStore";
import VisitBadge from "@/components/VisitBadge";
import BookingDialog from "@/components/BookingDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ── helpers ──
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y: number, m: number) { return new Date(y, m, 1).getDay(); }

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM – 7 PM
const SLOT_H = 60; // px per hour

function timeToY(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h - 8) * SLOT_H + (m / 60) * SLOT_H;
}

function formatHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr} ${ampm}`;
}

// ── Visit lane helper ──
function getVisitLane(v: Visit): "consultation" | "therapy" {
  const ct = v.colorId;
  // 0 = consultation, 1/3 = phone consult, 9 = garbhasanskar
  if (ct === 0 || ct === 1 || ct === 3 || ct === 9) return "consultation";
  return "therapy";
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
  const [blockLane, setBlockLane] = useState<"consultation" | "therapy">("consultation");
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("10:00");
  const [blockReason, setBlockReason] = useState("");

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
    if (blockStart >= blockEnd) { toast.error("End time must be after start"); return; }
    addBlock({ date: selectedDate, startTime: blockStart, endTime: blockEnd, lane: blockLane, reason: blockReason || "Blocked" });
    toast.success(`${blockLane === "consultation" ? "Consultation" : "Therapy"} blocked`);
    setBlockOpen(false);
    setBlockReason("");
  };

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

        {/* Visits */}
        {laneVisits.map((v) => {
          const info = COLOR_MAP[v.colorId] || COLOR_MAP[0];
          const top = timeToY(v.startTime);
          const height = (v.duration / 60) * SLOT_H;
          const isCancelled = v.colorId === 11;

          return (
            <button
              key={v.id}
              onClick={() => openEdit(v)}
              className={`absolute left-1 right-1 rounded-md px-2 py-1 text-left transition-all hover:ring-2 hover:ring-primary/40 z-20 ${info.bg} ${isCancelled ? "opacity-50 line-through" : ""}`}
              style={{ top, height: Math.max(height, 24) }}
            >
              <p className={`text-[11px] font-semibold truncate ${info.color}`}>{v.clientName}</p>
              {height >= 36 && (
                <p className={`text-[10px] ${info.color} opacity-70`}>{v.startTime} – {v.endTime}</p>
              )}
              {height >= 50 && v.visitType && (
                <p className={`text-[10px] ${info.color} opacity-60`}>{v.visitType}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Current time indicator ──
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const isToday = selectedDate === todayStr;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowY = ((now.getHours() - 8) * SLOT_H) + (now.getMinutes() / 60) * SLOT_H;

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

      {/* ═══ DAY VIEW — Google Calendar style ═══ */}
      {viewMode === "day" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {/* Summary bar */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {dayVisits.length} appointments</span>
            <span>{consultVisits.length} consultations</span>
            <span>{therapyVisits.length} therapies</span>
            {dayBlocks.length > 0 && <span className="text-destructive">{dayBlocks.length} blocked</span>}
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

            {/* Consultation lane */}
            {renderLane(consultVisits, consultBlocks, "Consultation")}

            {/* Divider */}
            <div className="w-px bg-border shrink-0" />

            {/* Therapy lane */}
            {renderLane(therapyVisits, therapyBlocks, "Therapy")}
          </div>

          {/* Current time line */}
          {isToday && nowMinutes >= 480 && nowMinutes <= 1200 && (
            <div className="pointer-events-none absolute" style={{ top: 0 }}>
              {/* Rendered via CSS in the lanes above would be ideal, but simplified here */}
            </div>
          )}
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
            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Time</Label>
                  <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">End Time</Label>
                  <Input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                </div>
              </div>

              {editVisit.packageType && (
                <p className="text-xs text-muted-foreground">Package: {editVisit.packageType}</p>
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-4 h-4" /> Block Time Slot
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Block a time frame on <strong>{new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong> to prevent bookings.
            </p>
            <div>
              <Label className="text-xs">Lane</Label>
              <Select value={blockLane} onValueChange={(v) => setBlockLane(v as "consultation" | "therapy")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="therapy">Therapy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start</Label>
                <Input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Reason</Label>
              <Input placeholder="e.g. Doctor on leave" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>Cancel</Button>
            <Button onClick={saveBlock} className="gap-1"><Ban className="w-3 h-3" /> Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
