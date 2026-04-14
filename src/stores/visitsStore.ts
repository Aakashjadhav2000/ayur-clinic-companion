import { create } from "zustand";
import { Visit, visits as initialVisits } from "@/data/mockData";

export interface TimeBlock {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  lane: "consultation" | "therapy";
  reason: string;
}

interface VisitsStore {
  visits: Visit[];
  blocks: TimeBlock[];
  addVisit: (visit: Omit<Visit, "id">) => void;
  updateVisit: (id: number, updates: Partial<Omit<Visit, "id">>) => void;
  deleteVisit: (id: number) => void;
  addBlock: (block: Omit<TimeBlock, "id">) => void;
  removeBlock: (id: number) => void;
}

export const useVisitsStore = create<VisitsStore>((set) => ({
  visits: initialVisits,
  blocks: [],
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
  addBlock: (block) =>
    set((state) => ({
      blocks: [
        ...state.blocks,
        { ...block, id: Math.max(0, ...state.blocks.map((b) => b.id)) + 1 },
      ],
    })),
  removeBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
    })),
}));
