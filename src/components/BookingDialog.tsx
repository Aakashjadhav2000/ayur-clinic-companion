import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, AlertTriangle, Package, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { clients, packages as packagesList } from "@/data/mockData";
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
  const [showPackageSelect, setShowPackageSelect] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("");
  const addVisit = useVisitsStore((s) => s.addVisit);

  const filteredClients = clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.lastName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  );

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedType = VISIT_TYPES[Number(visitTypeIdx)];

  // Package tracking
  const hasPackage = selectedClient?.activePackage && selectedClient?.packageSize;
  const visitsUsed = selectedClient?.visitsUsed ?? 0;
  const packageSize = selectedClient?.packageSize ?? 0;
  const visitsRemaining = hasPackage ? packageSize - visitsUsed : 0;
  const isPackageExhausted = hasPackage && visitsRemaining <= 0;
  const noPackage = selectedClient && !hasPackage;
  const nextVisitNumber = hasPackage ? visitsUsed + 1 : undefined;

  const handleTypeChange = (idx: string) => {
    setVisitTypeIdx(idx);
    setDuration(String(VISIT_TYPES[Number(idx)].defaultDuration));
  };

  const handleSubmit = () => {
    if (!clientId || !date || !startTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if ((isPackageExhausted || noPackage) && !selectedPackage) {
      toast.error("Please select a package or payment option first");
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
      packageType: selectedPackage || selectedClient?.activePackage,
    });

    // Update visits used on client (mock — in real app this goes to DB)
    if (hasPackage && !isPackageExhausted) {
      client.visitsUsed = (client.visitsUsed ?? 0) + 1;
    }
    if (selectedPackage) {
      const pkg = packagesList.find((p) => p.name === selectedPackage);
      if (pkg) {
        client.activePackage = pkg.name;
        client.packageSize = pkg.size || 1;
        client.visitsUsed = 1;
      }
    }

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
    setShowPackageSelect(false);
    setSelectedPackage("");
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
                <Button variant="ghost" size="sm" onClick={() => { setClientId(""); setShowPackageSelect(false); setSelectedPackage(""); }}>Change</Button>
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
                          onClick={() => { setClientId(c.id); setClientSearch(""); setShowPackageSelect(false); setSelectedPackage(""); }}
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

          {/* Package Status Banner */}
          {selectedClient && (
            <PackageStatusBanner
              client={selectedClient}
              hasPackage={!!hasPackage}
              visitsUsed={visitsUsed}
              packageSize={packageSize}
              visitsRemaining={visitsRemaining}
              isExhausted={!!isPackageExhausted}
              nextVisitNumber={nextVisitNumber}
              showPackageSelect={showPackageSelect || !!noPackage}
              onShowPackageSelect={() => setShowPackageSelect(true)}
              selectedPackage={selectedPackage}
              onSelectPackage={setSelectedPackage}
            />
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

/* ── Package Status Banner ── */
interface PackageStatusBannerProps {
  client: { firstName: string; activePackage?: string };
  hasPackage: boolean;
  visitsUsed: number;
  packageSize: number;
  visitsRemaining: number;
  isExhausted: boolean;
  nextVisitNumber?: number;
  showPackageSelect: boolean;
  onShowPackageSelect: () => void;
  selectedPackage: string;
  onSelectPackage: (pkg: string) => void;
}

function PackageStatusBanner({
  client, hasPackage, visitsUsed, packageSize, visitsRemaining,
  isExhausted, nextVisitNumber, showPackageSelect, onShowPackageSelect,
  selectedPackage, onSelectPackage,
}: PackageStatusBannerProps) {
  // Active package with visits remaining
  if (hasPackage && !isExhausted) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{client.activePackage}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-foreground">
              This will be <span className="font-bold">Visit {nextVisitNumber} of {packageSize}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {visitsRemaining} visit{visitsRemaining !== 1 ? "s" : ""} remaining after this booking
            </p>
          </div>
          {/* Visit dots */}
          <div className="flex gap-1">
            {Array.from({ length: packageSize }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full border-2",
                  i < visitsUsed
                    ? "bg-primary border-primary"
                    : i === visitsUsed
                    ? "bg-primary/40 border-primary animate-pulse"
                    : "bg-muted border-border"
                )}
              />
            ))}
          </div>
        </div>

        {/* Last visit warning */}
        {visitsRemaining === 1 && (
          <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-accent/20 border border-accent/30">
            <AlertTriangle className="w-4 h-4 text-accent" />
            <p className="text-xs text-accent-foreground font-medium">
              This is the last visit in the current package
            </p>
          </div>
        )}
      </div>
    );
  }

  // Package exhausted or no package
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="text-sm font-semibold text-destructive">
          {isExhausted ? "Package Completed" : "No Active Package"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {isExhausted
          ? `All ${packageSize} visits in "${client.activePackage}" have been used. Select a new package or single visit payment.`
          : `${client.firstName} doesn't have an active package. Please select a package or single visit.`}
      </p>

      {!showPackageSelect ? (
        <Button variant="outline" size="sm" onClick={onShowPackageSelect} className="w-full gap-2">
          <Package className="w-4 h-4" />
          Select Package / Payment
        </Button>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Choose Package *</Label>
          <div className="grid gap-2">
            {packagesList.map((pkg) => (
              <button
                key={pkg.name}
                onClick={() => onSelectPackage(pkg.name)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                  selectedPackage === pkg.name
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                <div>
                  <p className="text-sm font-medium">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pkg.size > 0 ? `${pkg.size} visit${pkg.size !== 1 ? "s" : ""}` : pkg.category}
                    {pkg.perSession > 0 ? ` · $${pkg.perSession}/session` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">${pkg.price}</span>
                  {selectedPackage === pkg.name && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
