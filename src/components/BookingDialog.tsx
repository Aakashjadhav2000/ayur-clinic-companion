import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, AlertTriangle, Package, CheckCircle, PlusCircle, UserPlus, Layers } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { clients, consultationPackages, massagePackages, specialtyPackages, specialtyPrograms, packages as allPackages, MASSAGE_TYPES, getActivePackages, getMassagePackages, type ClientPackage, type MassageType, type ProgramComponent } from "@/data/mockData";
import { useVisitsStore } from "@/stores/visitsStore";
import { toast } from "sonner";
import AddClientDialog from "@/components/AddClientDialog";

interface BookingDialogProps {
  defaultDate?: string;
}

const VISIT_TYPES = [
  { colorId: 0, label: "Consultation", defaultDuration: 30, section: "consultation" },
  { colorId: 1, label: "Phone Consultation", defaultDuration: 15, section: "consultation" },
  { colorId: 2, label: "Massage / Therapy", defaultDuration: 60, section: "massage" },
  { colorId: 9, label: "Garbhasanskar", defaultDuration: 45, section: "specialty" },
  { colorId: 10, label: "Panchakarma", defaultDuration: 60, section: "specialty" },
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
  const [selectedPkgId, setSelectedPkgId] = useState(""); // client package id to use
  const [selectedNewPkg, setSelectedNewPkg] = useState(""); // new package from catalog
  const [massageType, setMassageType] = useState("");
  const [massageSessions, setMassageSessions] = useState("1");
  const [showCustomPackage, setShowCustomPackage] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customSessions, setCustomSessions] = useState("");
  // Panchakarma program components
  const panchakarmaProgram = specialtyPrograms.find((p) => p.id === "panchakarma");
  const [panchaComps, setPanchaComps] = useState<ProgramComponent[]>(
    () => panchakarmaProgram?.components?.map((c) => ({ ...c })) || []
  );
  const addVisit = useVisitsStore((s) => s.addVisit);

  const filteredClients = clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.lastName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  );

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedType = VISIT_TYPES[Number(visitTypeIdx)];
  const isPhoneVisit = selectedType.colorId === 1 || selectedType.colorId === 3;
  const isMassage = selectedType.section === "massage";
  const isSpecialty = selectedType.section === "specialty";
  const isPanchakarma = selectedType.colorId === 10;

  const activeClientPkgs = selectedClient ? getActivePackages(selectedClient) : [];

  const relevantPackages = isMassage
    ? (massageType ? getMassagePackages(massageType as MassageType) : [])
    : isSpecialty
    ? specialtyPackages
    : consultationPackages;

  const handleTypeChange = (idx: string) => {
    setVisitTypeIdx(idx);
    setDuration(String(VISIT_TYPES[Number(idx)].defaultDuration));
    setSelectedPkgId("");
    setSelectedNewPkg("");
    setShowCustomPackage(false);
    // Reset panchakarma components when switching to Panchakarma
    if (VISIT_TYPES[Number(idx)].colorId === 10 && panchakarmaProgram?.components) {
      setPanchaComps(panchakarmaProgram.components.map((c) => ({ ...c })));
    }
  };

  const handleSubmit = () => {
    if (!clientId || !date || !startTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (isMassage && !massageType) {
      toast.error("Please select a massage type");
      return;
    }

    const client = clients.find((c) => c.id === clientId)!;
    const dur = Number(duration);
    const [h, m] = startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + dur;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

    // Determine package name for the visit
    let pkgName = "";
    if (selectedPkgId) {
      const pkg = client.packages.find((p) => p.id === selectedPkgId);
      if (pkg) {
        pkg.visitsUsed += 1;
        pkgName = pkg.name;
      }
    } else if (selectedNewPkg) {
      pkgName = selectedNewPkg;
      // Add new package to client
      const catalogPkg = allPackages.find((p) => p.name === selectedNewPkg);
      if (catalogPkg) {
        const newPkg: ClientPackage = {
          id: `pkg_${Date.now()}`,
          name: catalogPkg.name,
          size: catalogPkg.size || 1,
          visitsUsed: 1,
          price: catalogPkg.price,
        };
        client.packages.push(newPkg);
      }
    } else if (showCustomPackage && customName) {
      pkgName = `Custom: ${customName}`;
      const newPkg: ClientPackage = {
        id: `pkg_${Date.now()}`,
        name: customName,
        size: parseInt(customSessions) || 1,
        visitsUsed: 1,
        price: parseInt(customPrice) || undefined,
      };
      client.packages.push(newPkg);
    }

    // Build notes with Panchakarma details if applicable
    let finalNotes = notes;
    if (isPanchakarma && panchaComps.length > 0) {
      const compSummary = panchaComps.map((c) => `${c.sessions}× ${c.type} (${c.duration}min)`).join(", ");
      finalNotes = `Panchakarma Program: ${compSummary}${notes ? " | " + notes : ""}`;
    }

    addVisit({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      date: format(date, "yyyy-MM-dd"),
      startTime,
      endTime,
      duration: dur,
      colorId: selectedType.colorId,
      visitType: isMassage ? `Massage - ${massageType}` : selectedType.label,
      notes: isMassage ? `${massageType} | ${massageSessions} session(s) | ${notes}` : finalNotes,
      packageType: pkgName || undefined,
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
    setSelectedPkgId("");
    setSelectedNewPkg("");
    setMassageType("");
    setMassageSessions("1");
    setShowCustomPackage(false);
    setCustomName("");
    setCustomPrice("");
    setCustomSessions("");
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
                <Button variant="ghost" size="sm" onClick={() => { setClientId(""); setSelectedPkgId(""); setSelectedNewPkg(""); }}>Change</Button>
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
                        <button key={c.id} onClick={() => { setClientId(c.id); setClientSearch(""); setSelectedPkgId(""); setSelectedNewPkg(""); }}
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

          {/* Visit Type */}
          <div className="space-y-2">
            <Label>Visit Type</Label>
            <Select value={visitTypeIdx} onValueChange={handleTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="font-medium text-blue-700">Consultation</SelectItem>
                <SelectItem value="1" className="text-muted-foreground">Phone Consultation (Free)</SelectItem>
                <SelectItem value="2" className="font-medium text-sage-foreground">Massage / Therapy</SelectItem>
                <SelectItem value="3" className="font-medium text-amber-700">Garbhasanskar</SelectItem>
                <SelectItem value="4" className="font-medium text-orange-700">Panchakarma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone consultation */}
          {selectedClient && isPhoneVisit && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-primary">Free Phone Consultation</p>
                <p className="text-xs text-muted-foreground">Complimentary — doesn't count as a package visit</p>
              </div>
            </div>
          )}

          {/* Massage details */}
          {isMassage && selectedClient && (
            <div className="rounded-lg border border-sage/50 bg-sage/10 p-4 space-y-4">
              <p className="text-sm font-semibold text-sage-foreground flex items-center gap-2">
                <Package className="w-4 h-4" /> Massage Details
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Massage Type *</Label>
                <Select value={massageType} onValueChange={setMassageType}>
                  <SelectTrigger><SelectValue placeholder="Select massage..." /></SelectTrigger>
                  <SelectContent>
                    {MASSAGE_TYPES.map((mt) => (
                      <SelectItem key={mt} value={mt}>{mt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Number of Sessions</Label>
                <Select value={massageSessions} onValueChange={setMassageSessions}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} session{n > 1 ? "s" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Package Selection - for all non-phone visits */}
          {selectedClient && !isPhoneVisit && (
            <div className="space-y-3">
              {/* Existing client packages */}
              {activeClientPkgs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Use Existing Package</Label>
                  <div className="grid gap-2">
                    {activeClientPkgs.map((pkg) => {
                      const left = Math.max(0, pkg.size - pkg.visitsUsed);
                      return (
                        <button key={pkg.id} onClick={() => { setSelectedPkgId(pkg.id); setSelectedNewPkg(""); setShowCustomPackage(false); }}
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
                  </div>
                </div>
              )}

              {/* Buy new package */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  {activeClientPkgs.length > 0 ? "Or Add New Package" : "Select Package *"}
                </Label>
                <PackageGrid
                  packages={relevantPackages}
                  selectedPackage={selectedNewPkg}
                  onSelect={(name) => { setSelectedNewPkg(name); setSelectedPkgId(""); }}
                  showCustomPackage={showCustomPackage}
                  onShowCustom={() => { setShowCustomPackage(true); setSelectedNewPkg(""); setSelectedPkgId(""); }}
                  customName={customName}
                  customPrice={customPrice}
                  customSessions={customSessions}
                  onCustomName={setCustomName}
                  onCustomPrice={setCustomPrice}
                  onCustomSessions={setCustomSessions}
                />
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

/* ── Reusable Package Grid ── */
import type { Package as PkgType } from "@/data/mockData";

interface PackageGridProps {
  packages: PkgType[];
  selectedPackage: string;
  onSelect: (name: string) => void;
  showCustomPackage: boolean;
  onShowCustom: () => void;
  customName: string;
  customPrice: string;
  customSessions: string;
  onCustomName: (v: string) => void;
  onCustomPrice: (v: string) => void;
  onCustomSessions: (v: string) => void;
}

function PackageGrid({
  packages, selectedPackage, onSelect,
  showCustomPackage, onShowCustom,
  customName, customPrice, customSessions,
  onCustomName, onCustomPrice, onCustomSessions,
}: PackageGridProps) {
  return (
    <div className="grid gap-2">
      {packages.map((pkg) => (
        <button key={pkg.name} onClick={() => onSelect(pkg.name)}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
            selectedPackage === pkg.name ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:bg-muted"
          )}>
          <div>
            <p className="text-sm font-medium">{pkg.name}</p>
            <p className="text-xs text-muted-foreground">
              {pkg.size > 0 ? `${pkg.size} session${pkg.size !== 1 ? "s" : ""}` : pkg.category}
              {pkg.perSession > 0 ? ` · $${pkg.perSession.toFixed(0)}/session` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">${pkg.price.toLocaleString()}</span>
            {selectedPackage === pkg.name && <CheckCircle className="w-4 h-4 text-primary" />}
          </div>
        </button>
      ))}

      {!showCustomPackage ? (
        <button onClick={onShowCustom}
          className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:bg-muted transition-all text-left">
          <PlusCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Custom Package</span>
        </button>
      ) : (
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
          <p className="text-xs font-medium text-primary">Custom Package</p>
          <Input placeholder="Package name" value={customName} onChange={(e) => onCustomName(e.target.value)} className="h-8 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Price ($)" type="number" value={customPrice} onChange={(e) => onCustomPrice(e.target.value)} className="h-8 text-sm" />
            <Input placeholder="Sessions" type="number" value={customSessions} onChange={(e) => onCustomSessions(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
