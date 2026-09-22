import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, ClipboardList, Package, PhoneOutgoing, UserCog, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function AppSidebar() {
  const location = useLocation();
  const { role, user, signOut } = useAuth();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/clients", icon: Users, label: "Clients" },
    { to: "/visits", icon: ClipboardList, label: "Visits" },
    { to: "/calendar", icon: CalendarDays, label: "Calendar" },
    { to: "/packages", icon: Package, label: "Packages" },
    { to: "/reach-out", icon: PhoneOutgoing, label: "Reach Out" },
    ...(role === "admin" ? [{ to: "/employees", icon: UserCog, label: "Employees" }] : []),
  ];

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="font-display text-xl font-bold text-sidebar-primary">
          🌿 Ayur Clinic
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Management System</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="text-xs text-sidebar-foreground/60 truncate">
          {user?.email}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
        <p className="text-xs text-sidebar-foreground/40">© 2025 Ayur Clinic</p>
      </div>
    </aside>
  );
}
