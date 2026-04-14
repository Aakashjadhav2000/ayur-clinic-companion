import { create } from "zustand";
import { Visit, visits as initialVisits } from "@/data/mockData";

interface VisitsStore {
  visits: Visit[];
  addVisit: (visit: Omit<Visit, "id">) => void;
  updateVisit: (id: number, updates: Partial<Omit<Visit, "id">>) => void;
  deleteVisit: (id: number) => void;
}

export const useVisitsStore = create<VisitsStore>((set) => ({
  visits: initialVisits,
  addVisit: (visit) =>
    set((state) => ({
      visits: [
        ...state.visits,
        { ...visit, id: Math.max(0, ...state.visits.map((v) => v.id)) + 1 },
      ],
    })),
  updateVisit: (id, updates) =>
    set((state) => ({
      visits: state.visits.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),
  deleteVisit: (id) =>
    set((state) => ({
      visits: state.visits.filter((v) => v.id !== id),
    })),
}));
