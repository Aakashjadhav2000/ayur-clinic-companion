import { useState } from "react";
import { Search, Phone, Calendar, Package, History, Clock } from "lucide-react";
import { clients, getClientVisits } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import VisitBadge from "@/components/VisitBadge";
import AddClientDialog from "@/components/AddClientDialog";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const filtered = clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const today = new Date().toISOString().split("T")[0];
  const allVisits = selectedClient ? getClientVisits(selectedClient) : [];
  const pastVisits = allVisits.filter((v) => v.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  const futureVisits = allVisits.filter((v) => v.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const selected = clients.find((c) => c.id === selectedClient);

  const visitsLeft = selected?.packageSize && selected?.visitsUsed !== undefined
    ? Math.max(0, selected.packageSize - selected.visitsUsed)
    : null;
  const packageProgress = selected?.packageSize
    ? Math.round(((selected.visitsUsed || 0) / selected.packageSize) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your patient directory</p>
        </div>
        <AddClientDialog onClientAdded={() => forceUpdate((n) => n + 1)} />
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
              {filtered.map((client) => {
                const left = client.packageSize && client.visitsUsed !== undefined
                  ? Math.max(0, client.packageSize - client.visitsUsed)
                  : null;
                return (
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{client.activePackage}</span>
                          {left !== null && (
                            <span className={`text-xs font-medium ${left === 0 ? "text-destructive" : "text-primary"}`}>
                              {left} left
                            </span>
                          )}
                        </div>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{client.lastVisit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 max-h-[80vh] overflow-y-auto">
          {selected ? (
            <div className="space-y-4">
              {/* Header */}
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

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                  <p className="text-lg font-bold">{selected.totalVisits}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                  <p className="text-lg font-bold">{futureVisits.length}</p>
                </div>
              </div>

              {/* Active Package */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Active Package</span>
                  </div>
                  {selected.activePackage && (
                    <Badge variant="secondary">{selected.activePackage}</Badge>
                  )}
                </div>
                {selected.activePackage && selected.packageSize ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{selected.visitsUsed || 0} used</span>
                      <span>{visitsLeft} remaining</span>
                    </div>
                    <Progress value={packageProgress} className="h-2" />
                    {visitsLeft === 0 && (
                      <p className="text-xs text-destructive font-medium mt-1">
                        Package completed — time to renew
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No active package</p>
                )}
              </div>

              {/* Visits Tabs */}
              <Tabs defaultValue="past">
                <TabsList className="w-full">
                  <TabsTrigger value="upcoming" className="flex-1 gap-1 text-xs">
                    <Clock className="w-3 h-3" /> Upcoming ({futureVisits.length})
                  </TabsTrigger>
                  <TabsTrigger value="past" className="flex-1 gap-1 text-xs">
                    <History className="w-3 h-3" /> Past ({pastVisits.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  <div className="space-y-2">
                    {futureVisits.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No upcoming appointments</p>
                    ) : (
                      futureVisits.map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span>{v.date}</span>
                            <span className="text-xs text-muted-foreground">{v.startTime}</span>
                          </div>
                          <VisitBadge colorId={v.colorId} />
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="past">
                  <div className="space-y-2">
                    {pastVisits.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No past visits</p>
                    ) : (
                      pastVisits.slice(0, 15).map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span>{v.date}</span>
                            <span className="text-xs text-muted-foreground">{v.startTime}</span>
                          </div>
                          <VisitBadge colorId={v.colorId} />
                        </div>
                      ))
                    )}
                    {pastVisits.length > 15 && (
                      <p className="text-xs text-muted-foreground text-center">+ {pastVisits.length - 15} more visits</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">Select a client to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
