import { useState } from "react";
import { Search, Phone } from "lucide-react";
import { clients, getClientVisits } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import VisitBadge from "@/components/VisitBadge";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const clientVisits = selectedClient ? getClientVisits(selectedClient).slice(0, 10) : [];
  const selected = clients.find((c) => c.id === selectedClient);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Clients</h1>
        <p className="text-muted-foreground mt-1">Manage your patient directory</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Name</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Phone</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Visits</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Package</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => setSelectedClient(client.id)}
                  className={`border-b border-border cursor-pointer transition-colors hover:bg-muted/30 ${
                    selectedClient === client.id ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <span className="font-medium text-sm">{client.firstName} {client.lastName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{client.phone || "—"}</td>
                  <td className="p-4 text-sm">{client.totalVisits}</td>
                  <td className="p-4">
                    {client.activePackage ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{client.activePackage}</span>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{client.lastVisit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                  {selected.firstName[0]}{selected.lastName[0]}
                </div>
                <div>
                  <h3 className="font-display font-semibold">{selected.firstName} {selected.lastName}</h3>
                  {selected.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selected.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                  <p className="text-lg font-bold">{selected.totalVisits}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Package</p>
                  <p className="text-sm font-medium">{selected.activePackage || "None"}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Visits</h4>
                <div className="space-y-2">
                  {clientVisits.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <span>{v.date}</span>
                      <VisitBadge colorId={v.colorId} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">Select a client to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
