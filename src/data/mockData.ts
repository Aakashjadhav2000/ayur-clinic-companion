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
  email: string;
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
  duration?: number; // session duration in minutes
}

// Program types for specialty treatments
export type ProgramMode = "unlimited" | "combo";

export interface ProgramComponent {
  type: string; // e.g. "Abhyanga", "Consultation"
  sessions: number;
  duration: number; // minutes
}

export interface SpecialtyProgram {
  id: string;
  name: string;
  description: string;
  price: number;
  mode: ProgramMode;
  duration?: number; // per-session duration for unlimited programs
  components?: ProgramComponent[]; // for combo programs
}

export const consultationPackages: Package[] = [
  { category: "Consultation", name: "Single Visit", size: 1, price: 165, perSession: 165, complimentary: false, duration: 30 },
  { category: "Consultation", name: "Pack of 3 Visits", size: 3, price: 350, perSession: 116.67, complimentary: false, duration: 30 },
  { category: "Consultation", name: "Pack of 5 Visits", size: 5, price: 550, perSession: 110, complimentary: true, duration: 30 },
];

export const MASSAGE_TYPES = ["Abhyanga", "Shirodhara", "Nasya", "Eye Treatment"] as const;
export type MassageType = typeof MASSAGE_TYPES[number];

export interface MassagePackage extends Package {
  massageType: MassageType;
}

// Per-massage-type pricing (edit prices here)
export const massagePackagesByType: Record<MassageType, MassagePackage[]> = {
  Abhyanga: [
    { category: "Massage", massageType: "Abhyanga", name: "Abhyanga - Single", size: 1, price: 175, perSession: 175, complimentary: false, duration: 60 },
    { category: "Massage", massageType: "Abhyanga", name: "Abhyanga - Pack of 4", size: 4, price: 660, perSession: 165, complimentary: false, duration: 60 },
    { category: "Massage", massageType: "Abhyanga", name: "Abhyanga - Pack of 6", size: 6, price: 960, perSession: 160, complimentary: false, duration: 60 },
  ],
  Shirodhara: [
    { category: "Massage", massageType: "Shirodhara", name: "Shirodhara - Single", size: 1, price: 150, perSession: 150, complimentary: false, duration: 45 },
    { category: "Massage", massageType: "Shirodhara", name: "Shirodhara - Pack of 4", size: 4, price: 560, perSession: 140, complimentary: false, duration: 45 },
    { category: "Massage", massageType: "Shirodhara", name: "Shirodhara - Pack of 6", size: 6, price: 810, perSession: 135, complimentary: false, duration: 45 },
  ],
  Nasya: [
    { category: "Massage", massageType: "Nasya", name: "Nasya - Single", size: 1, price: 120, perSession: 120, complimentary: false, duration: 20 },
    { category: "Massage", massageType: "Nasya", name: "Nasya - Pack of 4", size: 4, price: 440, perSession: 110, complimentary: false, duration: 20 },
    { category: "Massage", massageType: "Nasya", name: "Nasya - Pack of 6", size: 6, price: 630, perSession: 105, complimentary: false, duration: 20 },
  ],
  "Eye Treatment": [
    { category: "Massage", massageType: "Eye Treatment", name: "Eye Treatment - Single", size: 1, price: 130, perSession: 130, complimentary: false, duration: 30 },
    { category: "Massage", massageType: "Eye Treatment", name: "Eye Treatment - Pack of 4", size: 4, price: 480, perSession: 120, complimentary: false, duration: 30 },
    { category: "Massage", massageType: "Eye Treatment", name: "Eye Treatment - Pack of 6", size: 6, price: 690, perSession: 115, complimentary: false, duration: 30 },
  ],
};

// Flat list of all massage packages (for backward compat)
export const massagePackages: MassagePackage[] = Object.values(massagePackagesByType).flat();

// Helper to get packages for a specific massage type
export function getMassagePackages(type: MassageType): MassagePackage[] {
  return massagePackagesByType[type] || [];
}

export const specialtyPackages: Package[] = [
  { category: "Specialty", name: "Garbhasanskar", size: 0, price: 1400, perSession: 0, complimentary: false, duration: 45 },
  { category: "Specialty", name: "Panchakarma", size: 0, price: 2500, perSession: 0, complimentary: false, duration: 60 },
];

export const specialtyPrograms: SpecialtyProgram[] = [
  {
    id: "garbhasanskar",
    name: "Garbhasanskar",
    description: "Prenatal wellness program — runs until pregnancy is completed. Sessions are unlimited.",
    price: 1400,
    mode: "unlimited",
    duration: 45,
  },
  {
    id: "panchakarma",
    name: "Panchakarma",
    description: "Full body cleansing program with a combination of therapies and consultations.",
    price: 2500,
    mode: "combo",
    components: [
      { type: "Consultation (Pre)", sessions: 1, duration: 30 },
      { type: "Abhyanga", sessions: 3, duration: 60 },
      { type: "Shirodhara", sessions: 2, duration: 45 },
      { type: "Consultation (Post)", sessions: 1, duration: 30 },
    ],
  },
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
  { id: "betty_simancas", firstName: "Betty", lastName: "Simancas", phone: "703-475-3000", email: "betty@example.com", totalVisits: 24, packages: [makePkg("Pack of 5 Visits", 5, 4, 550), makePkg("Single Session", 1, 0, 175)], lastVisit: "2024-12-15" },
  { id: "sreyashi_roy", firstName: "Sreyashi", lastName: "Roy", phone: "734-255-6000", email: "", totalVisits: 18, packages: [makePkg("Garbhasanskar", 1, 0, 1400)], lastVisit: "2024-12-20" },
  { id: "harsharan_dogra", firstName: "Harsharan", lastName: "Dogra", phone: "", email: "", totalVisits: 12, packages: [], lastVisit: "2024-11-30" },
  { id: "priya_sharma", firstName: "Priya", lastName: "Sharma", phone: "201-555-0142", email: "priya.sharma@email.com", totalVisits: 35, packages: [makePkg("Pack of 3 Visits", 3, 3, 350), makePkg("Pack of 4 Sessions", 4, 1, 660)], lastVisit: "2025-01-05" },
  { id: "anita_patel", firstName: "Anita", lastName: "Patel", phone: "646-555-0198", email: "anita.p@email.com", totalVisits: 8, packages: [makePkg("Panchakarma", 1, 0, 2500)], lastVisit: "2025-01-10" },
  { id: "maya_krishnan", firstName: "Maya", lastName: "Krishnan", phone: "510-555-0167", email: "", totalVisits: 42, packages: [], lastVisit: "2025-01-08" },
  { id: "deepa_nair", firstName: "Deepa", lastName: "Nair", phone: "408-555-0123", email: "deepa.nair@email.com", totalVisits: 15, packages: [makePkg("Pack of 5 Visits", 5, 2, 550)], lastVisit: "2025-01-12" },
  { id: "lakshmi_iyer", firstName: "Lakshmi", lastName: "Iyer", phone: "732-555-0145", email: "", totalVisits: 27, packages: [], lastVisit: "2024-12-28" },
  { id: "kavita_reddy", firstName: "Kavita", lastName: "Reddy", phone: "347-555-0189", email: "kavita.r@email.com", totalVisits: 6, packages: [makePkg("Single Visit", 1, 1, 165)], lastVisit: "2025-01-14" },
  { id: "sunita_gupta", firstName: "Sunita", lastName: "Gupta", phone: "917-555-0156", email: "sunita.g@email.com", totalVisits: 19, packages: [makePkg("Garbhasanskar", 1, 1, 1400), makePkg("Pack of 6 Sessions", 6, 3, 960)], lastVisit: "2025-01-13" },
  // Inactive clients for Reach Out testing (no visits generated for these)
  { id: "rekha_joshi", firstName: "Rekha", lastName: "Joshi", phone: "908-555-0134", email: "rekha.j@email.com", totalVisits: 10, packages: [], lastVisit: "2025-01-15" },
  { id: "meena_trivedi", firstName: "Meena", lastName: "Trivedi", phone: "732-555-0178", email: "", totalVisits: 5, packages: [], lastVisit: "2025-02-01" },
  { id: "pooja_desai", firstName: "Pooja", lastName: "Desai", phone: "646-555-0211", email: "pooja.d@email.com", totalVisits: 14, packages: [makePkg("Pack of 3 Visits", 3, 3, 350)], lastVisit: "2024-12-01" },
  { id: "nandini_rao", firstName: "Nandini", lastName: "Rao", phone: "", email: "nandini.rao@email.com", totalVisits: 22, packages: [], lastVisit: "2024-11-10" },
  { id: "shalini_mehta", firstName: "Shalini", lastName: "Mehta", phone: "201-555-0299", email: "shalini.m@email.com", totalVisits: 7, packages: [], lastVisit: "2025-02-15" },
];

// Helper: get active (non-exhausted) packages
export function getActivePackages(client: Client): ClientPackage[] {
  return client.packages.filter((p) => p.visitsUsed < p.size);
}

const visitTypes = ["Consultation", "Phone Consultation", "Therapy", "Garbhasanskar", "Panchakarma"];
const colorIds = [0, 0, 0, 1, 2, 3, 9, 10, 0, 0];

// IDs of clients to exclude from random visit generation (for Reach Out testing)
const inactiveClientIds = new Set(["rekha_joshi", "meena_trivedi", "pooja_desai", "nandini_rao", "shalini_mehta"]);

function generateVisits(): Visit[] {
  const visits: Visit[] = [];
  let id = 0;
  const now = new Date();
  const activeClients = clients.filter((c) => !inactiveClientIds.has(c.id));

  for (let dayOffset = -60; dayOffset <= 14; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    if (date.getDay() === 0) continue;

    const numVisits = Math.floor(Math.random() * 5) + 2;
    for (let v = 0; v < numVisits; v++) {
      const client = activeClients[Math.floor(Math.random() * activeClients.length)];
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
