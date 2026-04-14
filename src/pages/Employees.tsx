import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Trash2, Shield, User } from "lucide-react";
import { toast } from "sonner";

interface EmployeeRow {
  user_id: string;
  display_name: string;
  role: "admin" | "employee" | "frontdesk";
}

export default function Employees() {
  const { role, user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "frontdesk">("frontdesk");
  const [creating, setCreating] = useState(false);

  const fetchEmployees = async () => {
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    if (profiles) {
      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role as "admin" | "employee" | "frontdesk"]) ?? []);
      setEmployees(
        profiles.map((p) => ({
          user_id: p.user_id,
          display_name: p.display_name,
          role: roleMap.get(p.user_id) ?? "employee",
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async () => {
    if (!email || !password || !displayName) {
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);

    // Use edge function to create employee (requires service role)
    const { data, error } = await supabase.functions.invoke("create-employee", {
      body: { email, password, displayName },
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to create employee");
    } else {
      toast.success(`${displayName} added as employee`);
      setOpen(false);
      setEmail("");
      setDisplayName("");
      setPassword("");
      await fetchEmployees();
    }
    setCreating(false);
  };

  const handleDelete = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("You can't remove yourself");
      return;
    }
    const { error } = await supabase.functions.invoke("delete-employee", {
      body: { userId },
    });
    if (error) {
      toast.error("Failed to remove employee");
    } else {
      toast.success("Employee removed");
      await fetchEmployees();
    }
  };

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Only admins can manage employees.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage staff accounts and roles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Display Name *</Label>
                <Input placeholder="Full name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="employee@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button onClick={handleCreateEmployee} className="w-full" disabled={creating}>
                {creating ? "Creating…" : "Create Employee"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-muted-foreground">Loading…</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Name</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Role</th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.user_id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        {emp.role === "admin" ? (
                          <Shield className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <span className="font-medium text-sm">{emp.display_name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={emp.role === "admin" ? "default" : "secondary"}>
                      {emp.role}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    {emp.user_id !== user?.id && emp.role !== "admin" && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(emp.user_id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
