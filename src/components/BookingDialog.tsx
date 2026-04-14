import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, AlertTriangle, CheckCircle, UserPlus, Layers, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { clients, MASSAGE_TYPES, getActivePackages, type ClientPackage, type MassageType, type PackageComponent } from "@/data/mockData";
import { useVisitsStore } from "@/stores/visitsStore";
import { toast } from "sonner";
import AddClientDialog from "@/components/AddClientDialog";

// Match visit type to a Panchakarma component
function findMatchingComponent(pkg: ClientPackage, visitLabel: string, category: string): PackageComponent | null {
  if (!pkg.components) return null;
  
  // Map visit sub-types to component type keywords
  const labelLower = visitLabel.toLowerCase();
  
  for (const comp of pkg.components) {
    const compLower = comp.type.toLowerCase();
    if (comp.used >= comp.total) continue; // already exhausted
    
    // Direct match
    if (compLower.includes(labelLower) || labelLower.includes(compLower)) return comp;
    
    // Consultation matching
    if (category === "consultation" && compLower.includes("consultation")) return comp;
    
    // Therapy matching
    if (labelLower === "abhyanga" && compLower.includes("abhyanga")) return comp;
    if (labelLower === "shirodhara" && compLower.includes("shirodhara")) return comp;
    if (labelLower === "nasya" && compLower.includes("nasya")) return comp;
    if (labelLower === "eye treatment" && compLower.includes("eye")) return comp;
  }
  return null;
}

// Check if a Panchakarma package has a matching available component
function hasMatchingComponent(pkg: ClientPackage, visitLabel: string, category: string): boolean {
  return findMatchingComponent(pkg, visitLabel, category) !== null;
}

interface BookingDialogProps {
  defaultDate?: string;
  trigger?: React.ReactNode;
  preselectedClientId?: string;
  onBooked?: () => void;
}

// Visit categories with durations
const CONSULTATION_TYPES = [
  { id: "consultation", label: "Consultation", colorId: 0, duration: 30 },
  { id: "phone", label: "Phone Consultation (Free)", colorId: 1, duration: 15 },
];

const THERAPY_TYPES = [
  { id: "abhyanga", label: "Abhyanga", colorId: 2, duration: 60 },
  { id: "shirodhara", label: "Shirodhara", colorId: 2, duration: 45 },
  { id: "nasya", label: "Nasya", colorId: 2, duration: 20 },
  { id: "eye_treatment", label: "Eye Treatment", colorId: 2, duration: 30 },
  { id: "garbhasanskar", label: "Garbhasanskar", colorId: 9, duration: 45 },
  { id: "panchakarma", label: "Panchakarma", colorId: 10, duration: 60 },
];

type VisitCategory = "consultation" | "therapy";

export default function BookingDialog({ defaultDate, trigger, preselectedClientId, onBooked }: BookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [date, setDate] = useState<Date | undefined>(defaultDate ? new Date(defaultDate + "T12:00:00") : undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [visitCategory, setVisitCategory] = useState<VisitCategory>("consultation");
  const [visitSubType, setVisitSubType] = useState("consultation"); // id from the type arrays
  const [notes, setNotes] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedPkgId, setSelectedPkgId] = useState(""); // existing package or "ntp"

  const addVisit = useVisitsStore((s) => s.addVisit);
  const visits = useVisitsStore((s) => s.visits);

  const filteredClients = clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.lastName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  );

  const selectedClient = clients.find((c) => c.id === clientId);
  const activeClientPkgs = selectedClient ? getActivePackages(selectedClient) : [];

  // Get current visit type info
  const allTypes = [...CONSULTATION_TYPES, ...THERAPY_TYPES];
  const currentType = allTypes.find((t) => t.id === visitSubType) || CONSULTATION_TYPES[0];
  const isPhone = currentType.id === "phone";
  const isNTP = selectedPkgId === "ntp";

  // Check for scheduling conflicts
  const checkOverlap = (): string | null => {
    if (!date || !startTime) return null;
    const dateStr = format(date, "yyyy-MM-dd");
    const dur = currentType.duration;
    const [h, m] = startTime.split(":").map(Number);
    const startMin = h * 60 + m;
    const endMin = startMin + dur;

    const dayVisits = visits.filter((v) => v.date === dateStr);

    for (const v of dayVisits) {
      const [vh, vm] = v.startTime.split(":").map(Number);
      const vStart = vh * 60 + vm;
      const vEnd = vStart + v.duration;

      // Check if times overlap
      if (startMin < vEnd && endMin > vStart) {
        const isNewConsultation = visitCategory === "consultation";
        const isExistingConsultation = v.colorId === 0 || v.colorId === 1;
        const isNewTherapy = visitCategory === "therapy";
        const isExistingTherapy = v.colorId === 2 || v.colorId === 9 || v.colorId === 10;

        // Consultations can't overlap with other consultations
        if (isNewConsultation && isExistingConsultation) {
          return `Consultation overlaps with ${v.clientName}'s ${v.visitType} at ${v.startTime}`;
        }

        // Same therapy types can't overlap
        if (isNewTherapy && isExistingTherapy) {
          const newLabel = currentType.label;
          if (v.visitType === newLabel || v.visitType === `Massage - ${newLabel}`) {
            return `${newLabel} overlaps with ${v.clientName}'s slot at ${v.startTime}`;
          }
        }
      }
    }
    return null;
  };

  const handleCategoryChange = (cat: VisitCategory) => {
    setVisitCategory(cat);
    setVisitSubType(cat === "consultation" ? "consultation" : "abhyanga");
    setSelectedPkgId("");
  };

  const handleSubmit = () => {
    if (!clientId || !date || !startTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!isPhone && !selectedPkgId) {
      toast.error("Please select a package or NTP");
      return;
    }

    // Check overlap
    const overlap = checkOverlap();
    if (overlap) {
      toast.error(overlap);
      return;
    }

    const client = clients.find((c) => c.id === clientId)!;
    const dur = currentType.duration;
    const [h, m] = startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + dur;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    // Deduct from package if using existing package
    let pkgName = "";
    if (selectedPkgId && selectedPkgId !== "ntp") {
      const pkg = client.packages.find((p) => p.id === selectedPkgId);
      if (pkg) {
        // If Panchakarma with components, deduct from the matching component
        if (pkg.components && pkg.components.length > 0) {
          const matchingComp = findMatchingComponent(pkg, currentType.label, visitCategory);
          if (matchingComp) {
            matchingComp.used += 1;
            pkg.visitsUsed += 1;
            pkgName = `${pkg.name} [${matchingComp.type}]`;
          } else {
            toast.error(`No matching ${currentType.label} component in this Panchakarma package`);
            return;
          }
        } else {
          pkg.visitsUsed += 1;
          pkgName = pkg.name;
        }
      }
    } else if (isNTP) {
      pkgName = "NTP";
    }

    addVisit({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      date: format(date, "yyyy-MM-dd"),
      startTime,
      endTime,
      duration: dur,
      colorId: currentType.colorId,
      visitType: currentType.label,
      notes,
      packageType: pkgName || undefined,
    });

    toast.success(`Appointment booked for ${client.firstName} ${client.lastName}`);
    setOpen(false);
    resetForm();
    onBooked?.();
  };

  const resetForm = () => {
    setClientId("");
    setDate(defaultDate ? new Date(defaultDate + "T12:00:00") : undefined);
    setStartTime("09:00");
    setVisitCategory("consultation");
    setVisitSubType("consultation");
    setNotes("");
    setClientSearch("");
    setSelectedPkgId("");
  };

  const overlapWarning = date && startTime ? checkOverlap() : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Book Appointment
          </Button>
        )}
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
                <Button variant="ghost" size="sm" onClick={() => { setClientId(""); setSelectedPkgId(""); }}>Change</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input placeholder="Search client by name or phone..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                {clientSearch && (
                  <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">No clients found</p>
                    ) : (
                      filteredClients.slice(0, 8).map((c) => (
                        <button key={c.id} onClick={() => { setClientId(c.id); setClientSearch(""); setSelectedPkgId(""); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left">
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
                <AddClientDialog
                  trigger={
                    <Button variant="outline" size="sm" className="w-full gap-2 mt-1">
                      <UserPlus className="w-4 h-4" /> New Client
                    </Button>
                  }
                  onClientAdded={(c) => { setClientId(c.id); setClientSearch(""); }}
                />
              </div>
            )}
          </div>

          {/* Visit Category: Consultation or Therapy */}
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCategoryChange("consultation")}
                className={cn(
                  "p-3 rounded-lg border text-center text-sm font-medium transition-all",
                  visitCategory === "consultation"
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                Consultation
              </button>
              <button
                onClick={() => handleCategoryChange("therapy")}
                className={cn(
                  "p-3 rounded-lg border text-center text-sm font-medium transition-all",
                  visitCategory === "therapy"
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                Therapy
              </button>
            </div>
          </div>

          {/* Sub-type selection */}
          <div className="space-y-2">
            <Label>{visitCategory === "consultation" ? "Consultation Type" : "Therapy Type"}</Label>
            <Select value={visitSubType} onValueChange={(v) => { setVisitSubType(v); setSelectedPkgId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {visitCategory === "consultation"
                  ? CONSULTATION_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label} — {t.duration} min</SelectItem>
                    ))
                  : THERAPY_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label} — {t.duration} min</SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Duration: {currentType.duration} minutes</p>
          </div>

          {/* Phone consultation — free, no package needed */}
          {isPhone && selectedClient && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-primary">Free Phone Consultation</p>
                <p className="text-xs text-muted-foreground">Complimentary — doesn't require a package</p>
              </div>
            </div>
          )}

          {/* Package Selection: existing package or NTP */}
          {selectedClient && !isPhone && (
            <div className="space-y-2">
              <Label>Package</Label>
              <div className="grid gap-2">
                {/* Existing active packages */}
                {activeClientPkgs.map((pkg) => {
                  const left = Math.max(0, pkg.size - pkg.visitsUsed);
                  return (
                    <button key={pkg.id} onClick={() => setSelectedPkgId(pkg.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                        selectedPkgId === pkg.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:bg-muted"
                      )}>
                      <div>
                        <p className="text-sm font-medium">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">{pkg.visitsUsed} used · {left} remaining</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">{left} left</span>
                        {selectedPkgId === pkg.id && <CheckCircle className="w-4 h-4 text-primary" />}
                      </div>
                    </button>
                  );
                })}

                {/* NTP Option */}
                <button onClick={() => setSelectedPkgId("ntp")}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                    selectedPkgId === "ntp" ? "border-destructive bg-destructive/10 ring-1 ring-destructive" : "border-border hover:bg-muted"
                  )}>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">NTP — Need To Pay</p>
                      <p className="text-xs text-muted-foreground">No package, client pays for this visit</p>
                    </div>
                  </div>
                  {selectedPkgId === "ntp" && <CheckCircle className="w-4 h-4 text-destructive" />}
                </button>
              </div>
            </div>
          )}

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

          {/* Start Time */}
          <div className="space-y-2">
            <Label>Start Time *</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>

          {/* Overlap Warning */}
          {overlapWarning && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{overlapWarning}</p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="Add any notes for this appointment..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <Button onClick={handleSubmit} className="w-full">Confirm Booking</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
