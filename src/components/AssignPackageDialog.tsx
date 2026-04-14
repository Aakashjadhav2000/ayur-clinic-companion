import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { clients, consultationPackages, massagePackages, specialtyPackages, MASSAGE_TYPES, massagePackagesByType, type ClientPackage } from "@/data/mockData";
import { toast } from "sonner";

let pkgIdCounter = 500;

interface AssignPackageDialogProps {
  trigger?: React.ReactNode;
  preselectedClientId?: string;
  onAssigned?: () => void;
}

export default function AssignPackageDialog({ trigger, preselectedClientId, onAssigned }: AssignPackageDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [selectedPkg, setSelectedPkg] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const filteredClients = clientSearch.trim()
    ? clients.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.phone.includes(clientSearch)
      )
    : clients;

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleAssign = () => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    let newPkg: ClientPackage;

    if (customMode) {
      if (!customName.trim()) {
        toast.error("Enter a package name");
        return;
      }
      newPkg = {
        id: `pkg_${pkgIdCounter++}`,
        name: customName.trim(),
        size: parseInt(customSize) || 1,
        visitsUsed: 0,
        price: parseInt(customPrice) || undefined,
      };
      toast.success(`Custom package "${customName.trim()}" added to ${client.firstName}`);
    } else {
      if (!selectedPkg) {
        toast.error("Please select a package");
        return;
      }
      const allPkgs = [...consultationPackages, ...massagePackages, ...specialtyPackages];
      const pkg = allPkgs.find((p) => p.name === selectedPkg);
      if (!pkg) return;
      newPkg = {
        id: `pkg_${pkgIdCounter++}`,
        name: pkg.name,
        size: pkg.size || 1,
        visitsUsed: 0,
        price: pkg.price,
      };
      toast.success(`"${pkg.name}" added to ${client.firstName}`);
    }

    client.packages.push(newPkg);
    onAssigned?.();
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    if (!preselectedClientId) setClientId("");
    setClientSearch("");
    setSelectedPkg("");
    setCustomMode(false);
    setCustomName("");
    setCustomSize("");
    setCustomPrice("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Package className="w-4 h-4" /> Assign Package
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Package to Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Client Selection */}
          {!preselectedClientId && (
            <div className="space-y-2">
              <Label>Client</Label>
              <Input
                placeholder="Search client..."
                value={clientId ? `${selectedClient?.firstName} ${selectedClient?.lastName}` : clientSearch}
                onChange={(e) => { setClientSearch(e.target.value); setClientId(""); }}
              />
              {!clientId && clientSearch && (
                <div className="max-h-32 overflow-y-auto border border-border rounded-md">
                  {filteredClients.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setClientId(c.id); setClientSearch(""); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between"
                    >
                      <span>{c.firstName} {c.lastName}</span>
                      <span className="text-xs text-muted-foreground">{c.packages.length} pkg(s)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Show existing packages */}
          {selectedClient && selectedClient.packages.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Current Packages</Label>
              <div className="space-y-1">
                {selectedClient.packages.map((p) => {
                  const left = Math.max(0, p.size - p.visitsUsed);
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                      <span>{p.name}</span>
                      <span className={left === 0 ? "text-destructive" : "text-primary"}>{left} left</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Package Selection */}
          {!customMode ? (
            <div className="space-y-2">
              <Label>Add Package</Label>
              <Select value={selectedPkg} onValueChange={setSelectedPkg}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Consultation</div>
                  {consultationPackages.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name} — ${p.price}</SelectItem>
                  ))}
                  {MASSAGE_TYPES.map((mt) => (
                    <div key={mt}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">{mt}</div>
                      {massagePackagesByType[mt].map((p) => (
                        <SelectItem key={p.name} value={p.name}>{p.name} — ${p.price}</SelectItem>
                      ))}
                    </div>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">Specialty</div>
                  {specialtyPackages.map((p) => (
                    <SelectItem key={p.name} value={p.name}>{p.name} — ${p.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCustomMode(true)}>
                + Custom Package
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Custom Package</Label>
              <Input placeholder="Package name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Sessions</Label>
                  <Input type="number" min="1" placeholder="e.g. 5" value={customSize} onChange={(e) => setCustomSize(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price ($)</Label>
                  <Input type="number" min="0" placeholder="e.g. 500" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} />
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCustomMode(false)}>
                ← Back to presets
              </Button>
            </div>
          )}

          <Button onClick={handleAssign} className="w-full">Add Package</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
