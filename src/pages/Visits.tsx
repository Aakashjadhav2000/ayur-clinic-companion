import { useState } from "react";
import { COLOR_MAP, Visit } from "@/data/mockData";
import { useVisitsStore } from "@/stores/visitsStore";
import VisitBadge from "@/components/VisitBadge";
import BookingDialog from "@/components/BookingDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Visits() {
  const visits = useVisitsStore((s) => s.visits);
  const updateVisit = useVisitsStore((s) => s.updateVisit);
  const deleteVisit = useVisitsStore((s) => s.deleteVisit);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [editVisit, setEditVisit] = useState<Visit | null>(null);

  const filtered = visits
    .filter((v) => {
      const matchesSearch = v.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === null || v.colorId === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
    .slice(0, 50);

  const handleSaveEdit = () => {
    if (!editVisit) return;
    updateVisit(editVisit.id, {
      date: editVisit.date,
      startTime: editVisit.startTime,
      endTime: editVisit.endTime,
      duration: editVisit.duration,
      colorId: editVisit.colorId,
      visitType: editVisit.visitType,
      notes: editVisit.notes,
    });
    toast.success("Visit updated");
    setEditVisit(null);
  };

  const handleDelete = (id: number, name: string) => {
    deleteVisit(id);
    toast.success(`Visit for ${name} deleted`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Visits</h1>
          <p className="text-muted-foreground mt-1">Track all appointment visits</p>
        </div>
        <BookingDialog />
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
              <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
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
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditVisit({ ...visit })}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(visit.id, visit.clientName)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Visit Dialog */}
      <Dialog open={!!editVisit} onOpenChange={(o) => !o && setEditVisit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Visit</DialogTitle>
          </DialogHeader>
          {editVisit && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{editVisit.clientName}</p>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editVisit.date} onChange={(e) => setEditVisit({ ...editVisit, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={editVisit.startTime} onChange={(e) => setEditVisit({ ...editVisit, startTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Select value={String(editVisit.duration)} onValueChange={(v) => setEditVisit({ ...editVisit, duration: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[15, 30, 45, 60, 90, 120].map((d) => (
                        <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Visit Type</Label>
                <Select value={String(editVisit.colorId)} onValueChange={(v) => {
                  const cid = Number(v);
                  const info = COLOR_MAP[cid];
                  setEditVisit({ ...editVisit, colorId: cid, visitType: info?.label || editVisit.visitType });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(COLOR_MAP).map(([id, info]) => (
                      <SelectItem key={id} value={id}>{info.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editVisit.notes} onChange={(e) => setEditVisit({ ...editVisit, notes: e.target.value })} rows={2} />
              </div>
              <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
