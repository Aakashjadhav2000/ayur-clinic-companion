import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { clients, COLOR_MAP } from "@/data/mockData";
import { useVisitsStore } from "@/stores/visitsStore";
import { toast } from "sonner";

interface BookingDialogProps {
  defaultDate?: string;
}

const VISIT_TYPES = [
  { colorId: 0, label: "Consultation", defaultDuration: 30 },
  { colorId: 1, label: "Phone Consultation", defaultDuration: 15 },
  { colorId: 2, label: "Therapy (Shirodhara etc.)", defaultDuration: 60 },
  { colorId: 9, label: "Garbhasanskar", defaultDuration: 45 },
  { colorId: 10, label: "Panchakarma", defaultDuration: 60 },
];

export default function BookingDialog({ defaultDate }: BookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState<Date | undefined>(defaultDate ? new Date(defaultDate + "T12:00:00") : undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [visitTypeIdx, setVisitTypeIdx] = useState("0");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const addVisit = useVisitsStore((s) => s.addVisit);

  const filteredClients = clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.lastName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  );

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedType = VISIT_TYPES[Number(visitTypeIdx)];

  const handleTypeChange = (idx: string) => {
    setVisitTypeIdx(idx);
    setDuration(String(VISIT_TYPES[Number(idx)].defaultDuration));
  };

  const handleSubmit = () => {
    if (!clientId || !date || !startTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const client = clients.find((c) => c.id === clientId)!;
    const dur = Number(duration);
    const [h, m] = startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + dur;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    addVisit({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      date: format(date, "yyyy-MM-dd"),
      startTime,
      endTime,
      duration: dur,
      colorId: selectedType.colorId,
      visitType: selectedType.label,
      notes,
    });

    toast.success(`Appointment booked for ${client.firstName} ${client.lastName}`);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setClientId("");
    setDate(defaultDate ? new Date(defaultDate + "T12:00:00") : undefined);
    setStartTime("09:00");
    setVisitTypeIdx("0");
    setDuration("30");
    setNotes("");
    setClientSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Book New Appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Client *</Label>
            {selectedClient ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedClient.firstName} {selectedClient.lastName}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient.phone || "No phone"}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setClientId("")}>Change</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Search client by name or phone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                {clientSearch && (
                  <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">No clients found</p>
                    ) : (
                      filteredClients.slice(0, 8).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setClientId(c.id); setClientSearch(""); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-muted-foreground">{c.phone || "No phone"}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} minutes</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visit Type */}
          <div className="space-y-2">
            <Label>Visit Type</Label>
            <Select value={visitTypeIdx} onValueChange={handleTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VISIT_TYPES.map((t, i) => (
                  <SelectItem key={i} value={String(i)}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="Add any notes for this appointment..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} className="w-full">
            Confirm Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
