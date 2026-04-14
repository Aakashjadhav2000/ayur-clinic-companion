import { useState } from "react";
import { consultationPackages, specialtyPackages, MASSAGE_TYPES, massagePackagesByType, type Package, type MassagePackage, type MassageType } from "@/data/mockData";
import { Check, X, PlusCircle, Sparkles, Hand, Pencil, Save, XCircle, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MASSAGE_DETAILS: Record<string, { description: string; duration: string; benefits: string }> = {
  "Abhyanga": { description: "Full-body warm oil massage", duration: "45-60 min", benefits: "Improves circulation, detox, relaxation" },
  "Shirodhara": { description: "Warm oil poured on forehead", duration: "30-45 min", benefits: "Stress relief, mental clarity, sleep" },
  "Nasya": { description: "Nasal oil therapy", duration: "15-20 min", benefits: "Sinus relief, mental clarity, headaches" },
  "Eye Treatment": { description: "Netra Basti — eye rejuvenation", duration: "20-30 min", benefits: "Eye strain, dryness, vision support" },
};

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

export default function Packages() {
  const [consulPkgs, setConsulPkgs] = useState<Package[]>([...consultationPackages]);
  const [allMassageTypes, setAllMassageTypes] = useState<string[]>([...MASSAGE_TYPES]);
  const [massageDetails, setMassageDetails] = useState<Record<string, { description: string; duration: string; benefits: string }>>({ ...MASSAGE_DETAILS });
  const [massagePkgsByType, setMassagePkgsByType] = useState<Record<string, MassagePackage[]>>(() => {
    const copy: Record<string, MassagePackage[]> = {};
    for (const mt of MASSAGE_TYPES) {
      copy[mt] = [...massagePackagesByType[mt]];
    }
    return copy;
  });
  const [customMassagePkgs, setCustomMassagePkgs] = useState<Package[]>([]);
  const [specialPkgs, setSpecialPkgs] = useState<Package[]>([...specialtyPackages]);
  const [editingPkg, setEditingPkg] = useState<{ key: string; name: string; price: string; size: string; duration: string } | null>(null);
  const [editingMassage, setEditingMassage] = useState<{ type: string; index: number; price: string; size: string; duration: string } | null>(null);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newType, setNewType] = useState({ name: "", description: "", duration: "30", benefits: "" });

  const handleAdd = (pkg: Package, section: string) => {
    if (section === "consultation") setConsulPkgs((p) => [...p, pkg]);
    else if (section === "massage") setCustomMassagePkgs((p) => [...p, pkg]);
    else setSpecialPkgs((p) => [...p, pkg]);
    toast.success(`"${pkg.name}" added`);
  };

  const handleAddMassageTypePkg = (mt: string, pkg: Package) => {
    const massagePkg: MassagePackage = { ...pkg, massageType: mt as MassageType, category: "Massage" };
    setMassagePkgsByType((prev) => ({
      ...prev,
      [mt]: [...(prev[mt] || []), massagePkg],
    }));
    toast.success(`"${pkg.name}" added to ${mt}`);
  };

  const handleAddMassageType = () => {
    const name = newType.name.trim();
    if (!name) return;
    if (allMassageTypes.includes(name)) { toast.error("Type already exists"); return; }
    setAllMassageTypes((prev) => [...prev, name]);
    setMassageDetails((prev) => ({ ...prev, [name]: { description: newType.description, duration: newType.duration + " min", benefits: newType.benefits } }));
    setMassagePkgsByType((prev) => ({ ...prev, [name]: [] }));
    toast.success(`"${name}" massage type added`);
    setNewType({ name: "", description: "", duration: "30", benefits: "" });
    setAddTypeOpen(false);
  };

  const handleDeleteMassageType = (mt: string) => {
    setAllMassageTypes((prev) => prev.filter((t) => t !== mt));
    setMassagePkgsByType((prev) => { const copy = { ...prev }; delete copy[mt]; return copy; });
    setMassageDetails((prev) => { const copy = { ...prev }; delete copy[mt]; return copy; });
    toast.success(`"${mt}" massage type removed`);
  };

  const handleEditSave = (section: string) => {
    if (!editingPkg) return;
    const update = (pkgs: Package[]) =>
      pkgs.map((p) => p.name === editingPkg.key ? {
        ...p,
        name: editingPkg.name || p.name,
        price: Number(editingPkg.price) || p.price,
        size: Number(editingPkg.size) ?? p.size,
        duration: Number(editingPkg.duration) || p.duration,
        perSession: (Number(editingPkg.size) || p.size) > 0 ? Math.round((Number(editingPkg.price) || p.price) / (Number(editingPkg.size) || p.size)) : 0,
      } : p);
    if (section === "consultation") setConsulPkgs(update);
    else if (section === "massage") setCustomMassagePkgs(update);
    else setSpecialPkgs(update);
    toast.success("Package updated");
    setEditingPkg(null);
  };

  const handleDeletePkg = (name: string, section: string) => {
    if (section === "consultation") setConsulPkgs((p) => p.filter((x) => x.name !== name));
    else if (section === "massage") setCustomMassagePkgs((p) => p.filter((x) => x.name !== name));
    else setSpecialPkgs((p) => p.filter((x) => x.name !== name));
    toast.success("Package removed");
  };

  const handleMassageSave = () => {
    if (!editingMassage) return;
    setMassagePkgsByType((prev) => {
      const copy = { ...prev };
      copy[editingMassage.type] = [...copy[editingMassage.type]];
      const pkg = copy[editingMassage.type][editingMassage.index];
      const newPrice = Number(editingMassage.price) || pkg.price;
      const newSize = Number(editingMassage.size) || pkg.size;
      const newDuration = Number(editingMassage.duration) || pkg.duration;
      copy[editingMassage.type][editingMassage.index] = {
        ...pkg,
        price: newPrice,
        size: newSize,
        duration: newDuration,
        perSession: newSize > 0 ? Math.round(newPrice / newSize) : 0,
      };
      return copy;
    });
    toast.success("Package updated");
    setEditingMassage(null);
  };

  const handleDeleteMassagePkg = (mt: string, idx: number) => {
    setMassagePkgsByType((prev) => ({
      ...prev,
      [mt]: prev[mt].filter((_, i) => i !== idx),
    }));
    toast.success("Package removed");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Packages</h1>
        <p className="text-muted-foreground mt-1">Treatment packages, pricing & services</p>
      </div>

      <Tabs defaultValue="consultation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consultation" className="gap-2">
            <Sparkles className="w-4 h-4" /> Consultation
          </TabsTrigger>
          <TabsTrigger value="massages" className="gap-2">
            <Hand className="w-4 h-4" /> Massages
          </TabsTrigger>
          <TabsTrigger value="specialty" className="gap-2">
            Specialty
          </TabsTrigger>
        </TabsList>

        {/* ── CONSULTATION TAB ── */}
        <TabsContent value="consultation" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Consultation Packages</h2>
              <p className="text-sm text-muted-foreground">Regular consultation visit packages</p>
            </div>
            <AddPackageDialog section="consultation" onAdd={(pkg) => handleAdd(pkg, "consultation")} />
          </div>
          <EditablePackageGrid
            packages={consulPkgs}
            section="consultation"
            editingPkg={editingPkg}
            onStartEdit={(p) => setEditingPkg({ key: p.name, name: p.name, price: String(p.price), size: String(p.size), duration: String(p.duration || "") })}
            onCancelEdit={() => setEditingPkg(null)}
            onSaveEdit={() => handleEditSave("consultation")}
            onEditChange={(field, val) => editingPkg && setEditingPkg({ ...editingPkg, [field]: val })}
            onDelete={(name) => handleDeletePkg(name, "consultation")}
          />
        </TabsContent>

        {/* ── MASSAGES TAB ── */}
        <TabsContent value="massages" className="space-y-4">
          <Tabs defaultValue="types" className="space-y-4">
            <TabsList>
              <TabsTrigger value="types">Massage Types</TabsTrigger>
              <TabsTrigger value="packages">Custom Packages</TabsTrigger>
            </TabsList>

            <TabsContent value="types" className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-semibold">Massage Types & Pricing</h2>
                <p className="text-sm text-muted-foreground">Hover to edit, or add new packages per type</p>
              </div>
              {MASSAGE_TYPES.map((mt) => {
                const detail = MASSAGE_DETAILS[mt];
                const pkgs = massagePkgsByType[mt];
                return (
                  <div key={mt} className="bg-card rounded-lg border border-border p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage/30 flex items-center justify-center">
                          <Hand className="w-5 h-5 text-sage-foreground" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold">{mt}</h3>
                          <p className="text-xs text-muted-foreground">{detail?.duration} · {detail?.description}</p>
                        </div>
                      </div>
                      <AddPackageDialog
                        section="massage-type"
                        massageTypeName={mt}
                        onAdd={(pkg) => handleAddMassageTypePkg(mt, pkg)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {pkgs.map((pkg, idx) => {
                        const isEditing = editingMassage?.type === mt && editingMassage?.index === idx;
                        return (
                          <div key={`${pkg.name}-${idx}`} className="p-4 rounded-lg bg-muted/50 border border-border relative group">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                              {isEditing ? (
                                <>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleMassageSave}>
                                    <Save className="w-3 h-3 text-primary" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingMassage(null)}>
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingMassage({ type: mt, index: idx, price: String(pkg.price), size: String(pkg.size), duration: String(pkg.duration || "") })}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteMassagePkg(mt, idx)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="space-y-2 pr-12">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-[10px]">Sessions</Label>
                                    <Input type="number" value={editingMassage!.size} onChange={(e) => setEditingMassage({ ...editingMassage!, size: e.target.value })} className="h-7 text-sm" />
                                  </div>
                                  <div>
                                    <Label className="text-[10px]">Price ($)</Label>
                                    <Input type="number" value={editingMassage!.price} onChange={(e) => setEditingMassage({ ...editingMassage!, price: e.target.value })} className="h-7 text-sm" autoFocus onKeyDown={(e) => e.key === "Enter" && handleMassageSave()} />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-[10px]">Duration (min)</Label>
                                  <Select value={editingMassage!.duration} onValueChange={(v) => setEditingMassage({ ...editingMassage!, duration: v })}>
                                    <SelectTrigger className="h-7 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {DURATION_OPTIONS.map((d) => (
                                        <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium">{pkg.size === 1 ? "Single Session" : `Pack of ${pkg.size}`}</p>
                                <p className="text-2xl font-bold text-primary mt-1">${pkg.price}</p>
                                {pkg.perSession > 0 && pkg.size > 1 && (
                                  <p className="text-xs text-muted-foreground">${pkg.perSession}/session</p>
                                )}
                                {pkg.duration && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" /> {pkg.duration} min
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold">Custom Massage Packages</h2>
                  <p className="text-sm text-muted-foreground">Add custom session bundles</p>
                </div>
                <AddPackageDialog section="massage" onAdd={(pkg) => handleAdd(pkg, "massage")} />
              </div>
              <EditablePackageGrid
                packages={customMassagePkgs}
                section="massage"
                editingPkg={editingPkg}
                onStartEdit={(p) => setEditingPkg({ key: p.name, name: p.name, price: String(p.price), size: String(p.size), duration: String(p.duration || "") })}
                onCancelEdit={() => setEditingPkg(null)}
                onSaveEdit={() => handleEditSave("massage")}
                onEditChange={(field, val) => editingPkg && setEditingPkg({ ...editingPkg, [field]: val })}
                onDelete={(name) => handleDeletePkg(name, "massage")}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── SPECIALTY TAB ── */}
        <TabsContent value="specialty" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Specialty Programs</h2>
              <p className="text-sm text-muted-foreground">Garbhasanskar, Panchakarma & more</p>
            </div>
            <AddPackageDialog section="specialty" onAdd={(pkg) => handleAdd(pkg, "specialty")} />
          </div>
          <EditablePackageGrid
            packages={specialPkgs}
            section="specialty"
            editingPkg={editingPkg}
            onStartEdit={(p) => setEditingPkg({ key: p.name, name: p.name, price: String(p.price), size: String(p.size), duration: String(p.duration || "") })}
            onCancelEdit={() => setEditingPkg(null)}
            onSaveEdit={() => handleEditSave("specialty")}
            onEditChange={(field, val) => editingPkg && setEditingPkg({ ...editingPkg, [field]: val })}
            onDelete={(name) => handleDeletePkg(name, "specialty")}
          />
        </TabsContent>
      </Tabs>

      {/* Color Code Reference */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Color Code Reference</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries({
            0: { label: "Blue — Consultation", desc: "Regular consultation visits", bg: "bg-blue-100" },
            1: { label: "Lavender — Phone", desc: "15min free phone calls", bg: "bg-lavender" },
            2: { label: "Sage — Massage/Therapy", desc: "Abhyanga, Shirodhara etc.", bg: "bg-sage" },
            9: { label: "Amber — Garbhasanskar", desc: "30-60min sessions", bg: "bg-amber-100" },
            10: { label: "Orange — Panchakarma", desc: "Multi-day treatment", bg: "bg-orange-100" },
            11: { label: "Red — Cancelled", desc: "Cancelled appointments", bg: "bg-red-50" },
          }).map(([id, info]) => (
            <div key={id} className={`p-3 rounded-lg ${info.bg}`}>
              <p className="text-xs font-medium">{info.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{info.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Editable Package Grid ── */
interface EditablePackageGridProps {
  packages: Package[];
  section: string;
  editingPkg: { key: string; name: string; price: string; size: string; duration: string } | null;
  onStartEdit: (pkg: Package) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditChange: (field: string, val: string) => void;
  onDelete: (name: string) => void;
}

function EditablePackageGrid({ packages, section, editingPkg, onStartEdit, onCancelEdit, onSaveEdit, onEditChange, onDelete }: EditablePackageGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {packages.map((pkg) => {
        const isEditing = editingPkg?.key === pkg.name;
        return (
          <div key={pkg.name} className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow relative group">
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSaveEdit}>
                    <Save className="w-3.5 h-3.5 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancelEdit}>
                    <XCircle className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onStartEdit(pkg)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(pkg.name)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>

            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{pkg.category}</span>

            {isEditing ? (
              <div className="space-y-2 mt-2">
                <Input value={editingPkg!.name} onChange={(e) => onEditChange("name", e.target.value)} className="h-8 text-sm font-semibold" placeholder="Name" />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Price ($)</Label>
                    <Input type="number" value={editingPkg!.price} onChange={(e) => onEditChange("price", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Sessions</Label>
                    <Input type="number" value={editingPkg!.size} onChange={(e) => onEditChange("size", e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Duration</Label>
                    <Select value={editingPkg!.duration} onValueChange={(v) => onEditChange("duration", v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="min" /></SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((d) => (
                          <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-display text-lg font-semibold mt-1">{pkg.name}</h3>
                <div className="mt-3 mb-2">
                  <span className="text-3xl font-bold text-primary">${pkg.price.toLocaleString()}</span>
                  {pkg.size > 0 && <span className="text-muted-foreground text-sm ml-1">/ {pkg.size} sessions</span>}
                </div>
                {pkg.perSession > 0 && (
                  <p className="text-sm text-muted-foreground">${pkg.perSession.toFixed(0)} per session</p>
                )}
                {pkg.duration && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {pkg.duration} min per session
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm mt-2">
                  {pkg.complimentary ? (
                    <span className="flex items-center gap-1 text-secondary-foreground">
                      <Check className="w-4 h-4 text-green-600" /> Complimentary visit included
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <X className="w-4 h-4" /> No complimentary visit
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Add Package Dialog ── */
function AddPackageDialog({ section, massageTypeName, onAdd }: { section: string; massageTypeName?: string; onAdd: (pkg: Package) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sessions, setSessions] = useState("");
  const [duration, setDuration] = useState("");
  const [complimentary, setComplimentary] = useState(false);

  const categoryMap: Record<string, string> = { consultation: "Consultation", massage: "Massage", "massage-type": "Massage", specialty: "Specialty" };

  const handleSubmit = () => {
    if (!name || !price) { toast.error("Name and price are required"); return; }
    const size = Number(sessions) || 0;
    onAdd({
      category: categoryMap[section] || section,
      name: massageTypeName ? `${massageTypeName} - ${name}` : name,
      size,
      price: Number(price),
      perSession: size > 0 ? Math.round(Number(price) / size) : 0,
      complimentary,
      duration: Number(duration) || undefined,
    });
    setOpen(false);
    setName(""); setPrice(""); setSessions(""); setDuration(""); setComplimentary(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><PlusCircle className="w-4 h-4" /> Add Package</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {massageTypeName ? `Add ${massageTypeName} Package` : "Add Custom Package"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Package Name *</Label>
            <Input placeholder={massageTypeName ? `e.g. Pack of 8` : "e.g. Premium Pack"} value={name} onChange={(e) => setName(e.target.value)} />
            {massageTypeName && name && (
              <p className="text-xs text-muted-foreground">Will be saved as: {massageTypeName} - {name}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Price ($) *</Label>
              <Input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sessions</Label>
              <Input type="number" placeholder="0" value={sessions} onChange={(e) => setSessions(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue placeholder="min" /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {Number(sessions) > 0 && Number(price) > 0 && (
            <p className="text-xs text-muted-foreground">≈ ${Math.round(Number(price) / Number(sessions))} per session</p>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={complimentary} onChange={(e) => setComplimentary(e.target.checked)} className="rounded border-border" />
            <span className="text-sm">Includes complimentary visit</span>
          </label>
          <Button onClick={handleSubmit} className="w-full">Add Package</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
