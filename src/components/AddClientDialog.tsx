import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { clients, type Client } from "@/data/mockData";
import { toast } from "sonner";

interface AddClientDialogProps {
  trigger?: React.ReactNode;
  onClientAdded?: (client: Client) => void;
}

export default function AddClientDialog({ trigger, onClientAdded }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = () => {
    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();
    if (!trimFirst || !trimLast) {
      toast.error("First and last name are required");
      return;
    }
    if (trimFirst.length > 50 || trimLast.length > 50) {
      toast.error("Name must be under 50 characters");
      return;
    }

    const id = `${trimFirst.toLowerCase()}_${trimLast.toLowerCase()}`.replace(/\s+/g, "_");

    if (clients.find((c) => c.id === id)) {
      toast.error("A client with this name already exists");
      return;
    }

    const newClient: Client = {
      id,
      firstName: trimFirst,
      lastName: trimLast,
      phone: phone.trim(),
      totalVisits: 0,
      lastVisit: new Date().toISOString().split("T")[0],
    };

    clients.push(newClient);
    toast.success(`${trimFirst} ${trimLast} added as a new client`);
    onClientAdded?.(newClient);
    setOpen(false);
    setFirstName("");
    setLastName("");
    setPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" /> Add Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add New Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input placeholder="e.g. 201-555-0142" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          </div>
          <Button onClick={handleSubmit} className="w-full">Add Client</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
