import { Crown } from "lucide-react";

export function PremiumBadge() {
  return (
    <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold rounded-full">
      <Crown className="w-3 h-3" />
      Premium
    </div>
  );
}
