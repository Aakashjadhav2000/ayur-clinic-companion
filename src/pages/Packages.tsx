import { useState } from "react";
import { consultationPackages, massagePackages, specialtyPackages, MASSAGE_TYPES, type Package } from "@/data/mockData";
import { Check, X, Plus, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Packages() {
  const [consulPkgs, setConsulPkgs] = useState<Package[]>(consultationPackages);
  const [massagePkgs, setMassagePkgs] = useState<Package[]>(massagePackages);
  const [specialPkgs, setSpecialPkgs] = useState<Package[]>(specialtyPackages);

  const handleAdd = (pkg: Package, section: string) => {
    if (section === "consultation") setConsulPkgs((p) => [...p, pkg]);
    else if (section === "massage") setMassagePkgs((p) => [...p, pkg]);
    else setSpecialPkgs((p) => [...p, pkg]);
    toast.success(`"${pkg.name}" added`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Packages</h1>
        <p className="text-muted-foreground mt-1">Treatment packages, pricing & custom packages</p>
      </div>

      {/* Consultation Section */}
      <PackageSection
        title="Consultation Packages"
        description="Regular consultation visits"
        packages={consulPkgs}
        sectionKey="consultation"
        onAdd={handleAdd}
      />

      {/* Massage / Therapy Section */}
      <PackageSection
        title="Massage / Therapy Packages"
        description="Abhyanga, Shirodhara, Nasya, Eye Treatment"
        packages={massagePkgs}
        sectionKey="massage"
        onAdd={handleAdd}
      />

      {/* Specialty Section */}
      <PackageSection
        title="Specialty Programs"
        description="Garbhasanskar, Panchakarma & others"
        packages={specialPkgs}
        sectionKey="specialty"
        onAdd={handleAdd}
      />

      {/* Color Code Reference */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Color Code Reference</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries({
            0: { label: "Blue — Consultation", desc: "Regular consultation visits" },
            1: { label: "Lavender — Phone", desc: "15min free phone calls" },
            2: { label: "Sage — Massage/Therapy", desc: "Abhyanga, Shirodhara etc." },
            9: { label: "Amber — Garbhasanskar", desc: "30-60min sessions" },
            10: { label: "Orange — Panchakarma", desc: "Multi-day treatment" },
            11: { label: "Red — Cancelled", desc: "Cancelled appointments" },
          }).map(([id, info]) => {
            const bg = { 0: "bg-blue-100", 1: "bg-lavender", 2: "bg-sage", 9: "bg-amber-100", 10: "bg-orange-100", 11: "bg-red-50" }[id] || "bg-muted";
            return (
              <div key={id} className={`p-3 rounded-lg ${bg}`}>
                <p className="text-xs font-medium">{info.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{info.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Section Component ── */
function PackageSection({ title, description, packages, sectionKey, onAdd }: {
  title: string;
  description: string;
  packages: Package[];
  sectionKey: string;
  onAdd: (pkg: Package, section: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <AddPackageDialog section={sectionKey} onAdd={(pkg) => onAdd(pkg, sectionKey)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.name} className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{pkg.category}</span>
            <h3 className="font-display text-lg font-semibold mt-1">{pkg.name}</h3>
            <div className="mt-3 mb-2">
              <span className="text-3xl font-bold text-primary">${pkg.price.toLocaleString()}</span>
              {pkg.size > 0 && <span className="text-muted-foreground text-sm ml-1">/ {pkg.size} sessions</span>}
            </div>
            {pkg.perSession > 0 && (
              <p className="text-sm text-muted-foreground mb-3">${pkg.perSession.toFixed(0)} per session</p>
            )}
            <div className="flex items-center gap-2 text-sm">
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
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Add Package Dialog ── */
function AddPackageDialog({ section, onAdd }: { section: string; onAdd: (pkg: Package) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sessions, setSessions] = useState("");
  const [complimentary, setComplimentary] = useState(false);

  const categoryMap: Record<string, string> = { consultation: "Consultation", massage: "Massage", specialty: "Specialty" };

  const handleSubmit = () => {
    if (!name || !price) { toast.error("Name and price are required"); return; }
    const size = Number(sessions) || 0;
    onAdd({
      category: categoryMap[section] || section,
      name,
      size,
      price: Number(price),
      perSession: size > 0 ? Math.round(Number(price) / size) : 0,
      complimentary,
    });
    setOpen(false);
    setName(""); setPrice(""); setSessions(""); setComplimentary(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PlusCircle className="w-4 h-4" /> Add Package
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Custom Package</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Package Name *</Label>
            <Input placeholder="e.g. Premium Pack" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price ($) *</Label>
              <Input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sessions</Label>
              <Input type="number" placeholder="0" value={sessions} onChange={(e) => setSessions(e.target.value)} />
            </div>
          </div>
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
