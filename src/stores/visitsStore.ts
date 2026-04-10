import { create } from "zustand";
import { Visit, visits as initialVisits } from "@/data/mockData";

interface VisitsStore {
  visits: Visit[];
  addVisit: (visit: Omit<Visit, "id">) => void;
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
}));
