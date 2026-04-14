import { useState } from "react";
import { Search, Phone, Calendar, Package, History, Clock, ExternalLink } from "lucide-react";
import { clients, getClientVisits, getActivePackages } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VisitBadge from "@/components/VisitBadge";
import AddClientDialog from "@/components/AddClientDialog";
import AssignPackageDialog from "@/components/AssignPackageDialog";

function ClientDetail({ selected, pastVisits, futureVisits, compact = false, onRefresh }: {
  selected: typeof clients[0];
  pastVisits: ReturnType<typeof getClientVisits>;
  futureVisits: ReturnType<typeof getClientVisits>;
  compact?: boolean;
  onRefresh?: () => void;
}) {
  const pastLimit = compact ? 5 : 20;
  const activePackages = getActivePackages(selected);
  const exhaustedPackages = selected.packages.filter((p) => p.visitsUsed >= p.size);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`${compact ? "w-10 h-10 text-base" : "w-14 h-14 text-xl"} rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary`}>
          {selected.firstName[0]}{selected.lastName[0]}
        </div>
        <div>
          <h3 className={`font-display font-semibold ${compact ? "" : "text-lg"}`}>{selected.firstName} {selected.lastName}</h3>
          {selected.phone && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" /> {selected.phone}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={`grid ${compact ? "grid-cols-2" : "grid-cols-3"} gap-3`}>
        <div className="p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">Total Visits</p>
          <p className="text-lg font-bold">{selected.totalVisits}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">Upcoming</p>
          <p className="text-lg font-bold">{futureVisits.length}</p>
        </div>
        {!compact && (
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">Last Visit</p>
            <p className="text-sm font-bold">{selected.lastVisit}</p>
          </div>
        )}
      </div>

      {/* All Packages */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Packages ({selected.packages.length})</span>
          </div>
        </div>

        {activePackages.length > 0 && (
          <div className="space-y-2">
            {activePackages.map((pkg) => {
              const left = Math.max(0, pkg.size - pkg.visitsUsed);
              const progress = Math.round((pkg.visitsUsed / pkg.size) * 100);
              return (
                <div key={pkg.id} className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{pkg.name}</span>
                    <Badge variant="secondary" className="text-xs">{left} left</Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{pkg.visitsUsed} used</span>
                    <span>{pkg.size} total</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}

        {exhaustedPackages.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Completed</p>
            {exhaustedPackages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                <span className="text-muted-foreground">{pkg.name}</span>
                <span className="text-destructive">Done</span>
              </div>
            ))}
          </div>
        )}

        {selected.packages.length === 0 && (
          <p className="text-xs text-muted-foreground">No packages assigned</p>
        )}

        <AssignPackageDialog
          preselectedClientId={selected.id}
          onAssigned={onRefresh}
          trigger={
            <Button variant="outline" size="sm" className="w-full gap-1 mt-1 text-xs">
              <Package className="w-3 h-3" /> Add Package
            </Button>
          }
        />
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
              pastVisits.slice(0, pastLimit).map((v) => (
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
            {pastVisits.length > pastLimit && (
              <p className="text-xs text-muted-foreground text-center">+ {pastVisits.length - pastLimit} more visits</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Clients() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [fullViewClient, setFullViewClient] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((n) => n + 1);

  const filtered = clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const today = new Date().toISOString().split("T")[0];

  function getVisitData(clientId: string) {
    const allVisits = getClientVisits(clientId);
    const pastVisits = allVisits.filter((v) => v.date <= today).sort((a, b) => b.date.localeCompare(a.date));
    const futureVisits = allVisits.filter((v) => v.date > today).sort((a, b) => a.date.localeCompare(b.date));
    const client = clients.find((c) => c.id === clientId)!;
    return { pastVisits, futureVisits, client };
  }

  const sidebarData = selectedClient ? getVisitData(selectedClient) : null;
  const fullViewData = fullViewClient ? getVisitData(fullViewClient) : null;

  return (
    <div className="space-y-6 animate-fade-in" key={refreshKey}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your patient directory</p>
        </div>
        <AddClientDialog onClientAdded={refresh} />
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
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Packages</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const active = getActivePackages(client);
                return (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClient(client.id)}
                    onDoubleClick={() => setFullViewClient(client.id)}
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
                      {active.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {active.map((p) => (
                            <span key={p.id} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {p.name} ({Math.max(0, p.size - p.visitsUsed)})
                            </span>
                          ))}
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

        {/* Sidebar compact view */}
        <div className="bg-card rounded-lg border border-border p-6 max-h-[80vh] overflow-y-auto">
          {sidebarData ? (
            <div>
              <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setFullViewClient(selectedClient)}>
                  <ExternalLink className="w-3 h-3" /> Full View
                </Button>
              </div>
              <ClientDetail
                selected={sidebarData.client}
                pastVisits={sidebarData.pastVisits}
                futureVisits={sidebarData.futureVisits}
                onRefresh={refresh}
                compact
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">Select a client to view details</p>
          )}
        </div>
      </div>

      {/* Full view dialog */}
      <Dialog open={!!fullViewClient} onOpenChange={(open) => !open && setFullViewClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Client Profile</DialogTitle>
          </DialogHeader>
          {fullViewData && (
            <ClientDetail
              selected={fullViewData.client}
              pastVisits={fullViewData.pastVisits}
              futureVisits={fullViewData.futureVisits}
              onRefresh={refresh}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
