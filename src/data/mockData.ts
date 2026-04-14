export interface ClientPackage {
  id: string;
  name: string;
  size: number;
  visitsUsed: number;
  price?: number;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  totalVisits: number;
  packages: ClientPackage[];
  lastVisit: string;
  // Legacy compat helpers
  activePackage?: string;
  packageSize?: number;
  visitsUsed?: number;
}

export interface Visit {
  id: number;
  clientId: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  colorId: number;
  visitType: string;
  notes: string;
  packageType?: string;
}

export interface Package {
  category: string;
  name: string;
  size: number;
  price: number;
  perSession: number;
  complimentary: boolean;
}

export const MASSAGE_TYPES = ["Abhyanga", "Shirodhara", "Nasya", "Eye Treatment"] as const;
export type MassageType = typeof MASSAGE_TYPES[number];

export const consultationPackages: Package[] = [
  { category: "Consultation", name: "Single Visit", size: 1, price: 165, perSession: 165, complimentary: false },
  { category: "Consultation", name: "Pack of 3 Visits", size: 3, price: 350, perSession: 116.67, complimentary: false },
  { category: "Consultation", name: "Pack of 5 Visits", size: 5, price: 550, perSession: 110, complimentary: true },
];

export const massagePackages: Package[] = [
  { category: "Massage", name: "Single Session", size: 1, price: 175, perSession: 175, complimentary: false },
  { category: "Massage", name: "Pack of 4 Sessions", size: 4, price: 660, perSession: 165, complimentary: false },
  { category: "Massage", name: "Pack of 6 Sessions", size: 6, price: 960, perSession: 160, complimentary: false },
];

export const specialtyPackages: Package[] = [
  { category: "Specialty", name: "Garbhasanskar", size: 0, price: 1400, perSession: 0, complimentary: false },
  { category: "Specialty", name: "Panchakarma", size: 0, price: 2500, perSession: 0, complimentary: false },
];

export const packages: Package[] = [...consultationPackages, ...massagePackages, ...specialtyPackages];

export const COLOR_MAP: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "Consultation", color: "text-blue-700", bg: "bg-blue-100" },
  1: { label: "Phone/Panchakarma", color: "text-lavender-foreground", bg: "bg-lavender" },
  2: { label: "Therapy", color: "text-sage-foreground", bg: "bg-sage" },
  3: { label: "Phone/Panchakarma", color: "text-grape-foreground", bg: "bg-grape" },
  9: { label: "Garbhasanskar", color: "text-amber-800", bg: "bg-amber-100" },
  10: { label: "Panchakarma", color: "text-orange-800", bg: "bg-orange-100" },
  11: { label: "Cancelled", color: "text-destructive", bg: "bg-red-50" },
};

let pkgIdCounter = 100;
function makePkg(name: string, size: number, used: number, price?: number): ClientPackage {
  return { id: `pkg_${pkgIdCounter++}`, name, size, visitsUsed: used, price };
}

export const clients: Client[] = [
  { id: "betty_simancas", firstName: "Betty", lastName: "Simancas", phone: "703-475-3000", totalVisits: 24, packages: [makePkg("Pack of 5 Visits", 5, 4, 550), makePkg("Single Session", 1, 0, 175)], lastVisit: "2024-12-15" },
  { id: "sreyashi_roy", firstName: "Sreyashi", lastName: "Roy", phone: "734-255-6000", totalVisits: 18, packages: [makePkg("Garbhasanskar", 1, 0, 1400)], lastVisit: "2024-12-20" },
  { id: "harsharan_dogra", firstName: "Harsharan", lastName: "Dogra", phone: "", totalVisits: 12, packages: [], lastVisit: "2024-11-30" },
  { id: "priya_sharma", firstName: "Priya", lastName: "Sharma", phone: "201-555-0142", totalVisits: 35, packages: [makePkg("Pack of 3 Visits", 3, 3, 350), makePkg("Pack of 4 Sessions", 4, 1, 660)], lastVisit: "2025-01-05" },
  { id: "anita_patel", firstName: "Anita", lastName: "Patel", phone: "646-555-0198", totalVisits: 8, packages: [makePkg("Panchakarma", 1, 0, 2500)], lastVisit: "2025-01-10" },
  { id: "maya_krishnan", firstName: "Maya", lastName: "Krishnan", phone: "510-555-0167", totalVisits: 42, packages: [], lastVisit: "2025-01-08" },
  { id: "deepa_nair", firstName: "Deepa", lastName: "Nair", phone: "408-555-0123", totalVisits: 15, packages: [makePkg("Pack of 5 Visits", 5, 2, 550)], lastVisit: "2025-01-12" },
  { id: "lakshmi_iyer", firstName: "Lakshmi", lastName: "Iyer", phone: "732-555-0145", totalVisits: 27, packages: [], lastVisit: "2024-12-28" },
  { id: "kavita_reddy", firstName: "Kavita", lastName: "Reddy", phone: "347-555-0189", totalVisits: 6, packages: [makePkg("Single Visit", 1, 1, 165)], lastVisit: "2025-01-14" },
  { id: "sunita_gupta", firstName: "Sunita", lastName: "Gupta", phone: "917-555-0156", totalVisits: 19, packages: [makePkg("Garbhasanskar", 1, 1, 1400), makePkg("Pack of 6 Sessions", 6, 3, 960)], lastVisit: "2025-01-13" },
];

// Helper: get active (non-exhausted) packages
export function getActivePackages(client: Client): ClientPackage[] {
  return client.packages.filter((p) => p.visitsUsed < p.size);
}

const visitTypes = ["Consultation", "Phone Consultation", "Therapy", "Garbhasanskar", "Panchakarma"];
const colorIds = [0, 0, 0, 1, 2, 3, 9, 10, 0, 0];

function generateVisits(): Visit[] {
  const visits: Visit[] = [];
  let id = 0;
  const now = new Date();

  for (let dayOffset = -60; dayOffset <= 14; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    if (date.getDay() === 0) continue;

    const numVisits = Math.floor(Math.random() * 5) + 2;
    for (let v = 0; v < numVisits; v++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const hour = 9 + Math.floor(Math.random() * 9);
      const colorId = colorIds[Math.floor(Math.random() * colorIds.length)];
      const duration = colorId === 1 || colorId === 3 ? 15 : colorId === 2 ? 60 : 30;
      const visitType = colorId === 0 ? "Consultation" : colorId === 1 || colorId === 3 ? "Phone Consultation" : colorId === 2 ? "Therapy" : colorId === 9 ? "Garbhasanskar" : colorId === 10 ? "Panchakarma" : "Consultation";

      visits.push({
        id: id++,
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        date: date.toISOString().split("T")[0],
        startTime: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + Math.ceil(duration / 60)).toString().padStart(2, "0")}:00`,
        duration,
        colorId,
        visitType,
        notes: "",
      });
    }
  }
  return visits;
}

export const visits: Visit[] = generateVisits();

export function getVisitsForDate(date: string): Visit[] {
  return visits.filter((v) => v.date === date);
}

export function getClientVisits(clientId: string): Visit[] {
  return visits.filter((v) => v.clientId === clientId);
}

export function getTodayStats() {
  const today = new Date().toISOString().split("T")[0];
  const todayVisits = getVisitsForDate(today);
  return {
    totalClients: clients.length,
    todayAppointments: todayVisits.length,
    activePackages: clients.filter((c) => getActivePackages(c).length > 0).length,
    totalVisits: visits.length,
  };
}
