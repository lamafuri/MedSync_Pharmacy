import { Crown } from 'lucide-react';

function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber text-white rounded-full text-xs font-semibold">
      <Crown className="w-3 h-3" />
      PREMIUM
    </span>
  );
}

export default PremiumBadge;
