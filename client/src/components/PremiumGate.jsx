import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function PremiumGate({ feature, children }) {
  const { pharmacist } = useAuthStore();
  const navigate = useNavigate();

  if (pharmacist?.isPremium) {
    return children;
  }

  return (
    <div className="relative">
      <div className="blur-sm opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-card/50 rounded-card">
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-light rounded-full mb-4">
            <Crown className="w-8 h-8 text-amber" />
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">Premium Feature</h3>
          <p className="text-muted mb-4">{feature} is available for premium members only</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-amber text-white rounded-btn font-semibold hover:bg-amber/90 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );
}

export default PremiumGate;
