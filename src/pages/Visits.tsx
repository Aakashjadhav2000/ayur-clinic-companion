import { useState } from "react";
import { visits, COLOR_MAP } from "@/data/mockData";
import VisitBadge from "@/components/VisitBadge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Visits() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<number | null>(null);

  const filtered = visits
    .filter((v) => {
      const matchesSearch = v.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === null || v.colorId === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
    .slice(0, 50);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Visits</h1>
        <p className="text-muted-foreground mt-1">Track all appointment visits</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search client..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              typeFilter === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {Object.entries(COLOR_MAP).filter(([k]) => k !== "11" && k !== "8").map(([id, info]) => (
            <button
              key={id}
              onClick={() => setTypeFilter(Number(id))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === Number(id) ? `${info.bg} ${info.color}` : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Date</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Client</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Time</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Duration</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Type</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((visit) => (
              <tr key={visit.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="p-4 text-sm">{visit.date}</td>
                <td className="p-4 text-sm font-medium">{visit.clientName}</td>
                <td className="p-4 text-sm text-muted-foreground">{visit.startTime} - {visit.endTime}</td>
                <td className="p-4 text-sm">{visit.duration}min</td>
                <td className="p-4"><VisitBadge colorId={visit.colorId} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
