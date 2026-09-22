import { Users, CalendarDays, Package, ClipboardList } from "lucide-react";
import StatCard from "@/components/StatCard";
import VisitBadge from "@/components/VisitBadge";
import BookingDialog from "@/components/BookingDialog";
import AssignPackageDialog from "@/components/AssignPackageDialog";
import { clients, getActivePackages } from "@/data/mockData";
import { useVisitsStore } from "@/stores/visitsStore";

export default function Dashboard() {
  const visits = useVisitsStore((s) => s.visits);
  const today = new Date().toISOString().split("T")[0];
  const todayVisits = visits.filter((v) => v.date === today).slice(0, 5);
  const activePackages = clients.filter((c) => getActivePackages(c).length > 0).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to your clinic overview</p>
        </div>
        <div className="flex gap-2">
          <AssignPackageDialog />
          <BookingDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={clients.length} icon={Users} subtitle="Registered patients" />
        <StatCard title="Today's Appointments" value={todayVisits.length} icon={CalendarDays} subtitle={today} />
        <StatCard title="Active Packages" value={activePackages} icon={Package} subtitle="Clients with packages" />
        <StatCard title="Total Visits" value={visits.length} icon={ClipboardList} subtitle="All time" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Today's Schedule</h2>
          {todayVisits.length === 0 ? (
            <p className="text-muted-foreground text-sm">No appointments today</p>
          ) : (
            <div className="space-y-3">
              {todayVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{visit.clientName}</p>
                    <p className="text-xs text-muted-foreground">{visit.startTime} - {visit.endTime} · {visit.duration}min</p>
                  </div>
                  <VisitBadge colorId={visit.colorId} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Recent Clients</h2>
          <div className="space-y-3">
            {clients.slice(0, 5).map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {client.firstName[0]}{client.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{client.firstName} {client.lastName}</p>
                    <p className="text-xs text-muted-foreground">{client.totalVisits} visits</p>
                  </div>
                </div>
                {getActivePackages(client).length > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{getActivePackages(client).length} pkg(s)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
