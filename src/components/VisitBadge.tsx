import { COLOR_MAP } from "@/data/mockData";

export default function VisitBadge({ colorId }: { colorId: number }) {
  const info = COLOR_MAP[colorId] || COLOR_MAP[0];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.bg} ${info.color}`}>
      {info.label}
    </span>
  );
}
