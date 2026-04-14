import { useState, useMemo, useEffect } from "react";
import { Phone, PhoneOff, PhoneMissed, CalendarCheck, Clock, Mail, RotateCcw } from "lucide-react";
import { clients, type Client } from "@/data/mockData";
import { useVisitsStore } from "@/stores/visitsStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import BookingDialog from "@/components/BookingDialog";

interface DismissedEntry {
  clientId: string;
  dismissedAt: string; // ISO string for JSON serialization
  reason: "no_answer" | "not_interested";
}

const INACTIVE_DAYS = 45;
const RETRY_DAYS = 15;
const STORAGE_KEY = "reachout_dismissed";

function loadDismissed(): DismissedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function ReachOut() {
  const [dismissed, setDismissed] = useState<DismissedEntry[]>(loadDismissed);
  const [refreshKey, setRefreshKey] = useState(0);

  // Persist dismissed list to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
  }, [dismissed]);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Compute clients needing reach-out
  const { toCall, didntAnswer } = useMemo(() => {
    const toCallList: (Client & { daysSince: number })[] = [];
    const didntAnswerList: (Client & { daysSince: number; dismissedAt: string; retryIn: number })[] = [];

    clients.forEach((client) => {
      const allVisits = getClientVisits(client.id);
      const hasFuture = allVisits.some((v) => v.date > todayStr);
      if (hasFuture) return; // has upcoming appointment — skip

      // Days since last visit
      const lastDate = client.lastVisit ? new Date(client.lastVisit) : null;
      if (!lastDate) return;
      const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < INACTIVE_DAYS) return;

      // Check if dismissed
      const entry = dismissed.find((d) => d.clientId === client.id);
      if (entry) {
        const daysSinceDismiss = Math.floor((today.getTime() - new Date(entry.dismissedAt).getTime()) / (1000 * 60 * 60 * 24));
        const retryIn = RETRY_DAYS - daysSinceDismiss;
        if (retryIn > 0) {
          didntAnswerList.push({ ...client, daysSince, dismissedAt: entry.dismissedAt, retryIn });
        } else {
          // Time to retry — move back to call list
          toCallList.push({ ...client, daysSince });
        }
      } else {
        toCallList.push({ ...client, daysSince });
      }
    });

    toCallList.sort((a, b) => b.daysSince - a.daysSince);
    didntAnswerList.sort((a, b) => a.retryIn - b.retryIn);

    return { toCall: toCallList, didntAnswer: didntAnswerList };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr, dismissed, refreshKey]);

  const markDidntAnswer = (clientId: string) => {
    setDismissed((prev) => [
      ...prev.filter((d) => d.clientId !== clientId),
      { clientId, dismissedAt: new Date().toISOString(), reason: "no_answer" },
    ]);
    toast("Moved to Didn't Answer — will retry in 15 days");
  };

  const moveBackToCall = (clientId: string) => {
    setDismissed((prev) => prev.filter((d) => d.clientId !== clientId));
    toast.success("Moved back to call list");
  };

  const onBooked = () => {
    setRefreshKey((n) => n + 1);
    toast.success("Client booked — removed from reach-out list");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Reach Out</h1>
        <p className="text-muted-foreground mt-1">
          Clients with no upcoming appointments and {INACTIVE_DAYS}+ days since last visit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-lg border border-border">
          <p className="text-xs text-muted-foreground uppercase">To Call</p>
          <p className="text-2xl font-bold text-primary">{toCall.length}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border border-border">
          <p className="text-xs text-muted-foreground uppercase">Didn't Answer</p>
          <p className="text-2xl font-bold text-amber-600">{didntAnswer.length}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border border-border">
          <p className="text-xs text-muted-foreground uppercase">Total Inactive</p>
          <p className="text-2xl font-bold">{toCall.length + didntAnswer.length}</p>
        </div>
      </div>

      <Tabs defaultValue="to-call">
        <TabsList>
          <TabsTrigger value="to-call" className="gap-1.5">
            <Phone className="w-4 h-4" /> To Call ({toCall.length})
          </TabsTrigger>
          <TabsTrigger value="didnt-answer" className="gap-1.5">
            <PhoneMissed className="w-4 h-4" /> Didn't Answer ({didntAnswer.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="to-call">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {toCall.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">
                🎉 All clients are active or have upcoming appointments!
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Client</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Contact</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Last Visit</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Days Inactive</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {toCall.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {client.firstName[0]}{client.lastName[0]}
                          </div>
                          <span className="font-medium text-sm">{client.firstName} {client.lastName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          {client.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {client.phone}
                            </p>
                          )}
                          {client.email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {client.email}
                            </p>
                          )}
                          {!client.phone && !client.email && (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{client.lastVisit}</td>
                      <td className="p-4">
                        <Badge variant={client.daysSince > 90 ? "destructive" : "secondary"}>
                          {client.daysSince} days
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <BookingDialog
                            preselectedClientId={client.id}
                            onBooked={onBooked}
                            trigger={
                              <Button variant="default" size="sm" className="gap-1 text-xs">
                                <CalendarCheck className="w-3 h-3" /> Book
                              </Button>
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => markDidntAnswer(client.id)}
                          >
                            <PhoneOff className="w-3 h-3" /> No Answer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="didnt-answer">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {didntAnswer.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">
                No pending retries
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Client</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Contact</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Days Inactive</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Retry In</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {didntAnswer.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                            {client.firstName[0]}{client.lastName[0]}
                          </div>
                          <span className="font-medium text-sm">{client.firstName} {client.lastName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          {client.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {client.phone}
                            </p>
                          )}
                          {client.email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {client.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{client.daysSince} days</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" /> {client.retryIn} days
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <BookingDialog
                            preselectedClientId={client.id}
                            onBooked={onBooked}
                            trigger={
                              <Button variant="default" size="sm" className="gap-1 text-xs">
                                <CalendarCheck className="w-3 h-3" /> Book
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => moveBackToCall(client.id)}
                          >
                            <RotateCcw className="w-3 h-3" /> Move to Call
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
