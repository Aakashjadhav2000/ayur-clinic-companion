import { consultationPackages, massagePackages, specialtyPackages, MASSAGE_TYPES } from "@/data/mockData";
const packages = [...consultationPackages, ...massagePackages, ...specialtyPackages];
import { Check, X } from "lucide-react";

export default function Packages() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Packages</h1>
        <p className="text-muted-foreground mt-1">Treatment packages and pricing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.name} className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{pkg.category}</span>
                <h3 className="font-display text-lg font-semibold mt-1">{pkg.name}</h3>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary">${pkg.price.toLocaleString()}</span>
              {pkg.size > 0 && <span className="text-muted-foreground text-sm ml-1">/ {pkg.size} sessions</span>}
            </div>
            {pkg.perSession > 0 && (
              <p className="text-sm text-muted-foreground mb-4">${pkg.perSession.toFixed(2)} per session</p>
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

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Color Code Reference</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries({
            0: { label: "Blue — Consultation", desc: "Regular consultation visits" },
            1: { label: "Lavender — Phone/Panchakarma", desc: "15min calls or 30-90min Panchakarma" },
            2: { label: "Sage — Therapy", desc: "Shirodhara & other therapies" },
            3: { label: "Grape — Phone/Panchakarma", desc: "Same as Lavender" },
            9: { label: "Color 9 — Garbhasanskar", desc: "30-60min sessions" },
            10: { label: "Color 10 — Panchakarma", desc: "Multi-day treatment program" },
            11: { label: "Color 11 — Cancelled", desc: "Cancelled appointments" },
          }).map(([id, info]) => {
            const colorInfo = { 0: "bg-blue-100", 1: "bg-lavender", 2: "bg-sage", 3: "bg-grape", 9: "bg-amber-100", 10: "bg-orange-100", 11: "bg-red-50" }[id] || "bg-muted";
            return (
              <div key={id} className={`p-3 rounded-lg ${colorInfo}`}>
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
