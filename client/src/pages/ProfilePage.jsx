import { useState, useEffect } from 'react';
import { Crown, Check, X, Lock, Edit2, CreditCard, Sparkles } from 'lucide-react';
import axios from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import PremiumBadge from '../components/PremiumBadge';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

function ProfilePage() {
  const { pharmacist, setPharmacist } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    pharmacyName: '',
    pharmacyAddress: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        setPharmacist(response.data);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, [setPharmacist]);

  useEffect(() => {
    if (pharmacist) {
      setProfileForm({
        name: pharmacist.name || '',
        pharmacyName: pharmacist.pharmacyName || '',
        pharmacyAddress: pharmacist.pharmacyAddress || '',
        phone: pharmacist.phone || '',
      });
    }
  }, [pharmacist]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put('/api/auth/me', profileForm);
      setPharmacist(response.data);
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await axios.put('/api/auth/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (pin) => {
    if (pin === '1234') {
      try {
        setLoading(true);
        const response = await axios.post('/api/auth/upgrade');
        setPharmacist({ ...pharmacist, isPremium: true, premiumExpiresAt: response.data.premiumExpiresAt });
        toast.success('Upgraded to Premium!');
        setShowUpgradeModal(false);
      } catch (error) {
        toast.error('Failed to upgrade');
      } finally {
        setLoading(false);
      }
    } else {
      toast.error('Invalid PIN');
    }
  };

  if (!pharmacist) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Pharmacy Info Card */}
      <div className="bg-card rounded-card border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-primary">Pharmacy Information</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-2 px-4 py-2 bg-faint text-muted rounded-btn text-sm font-semibold hover:bg-faint/80 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            {editMode ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Pharmacy Name</label>
              <input
                type="text"
                value={profileForm.pharmacyName}
                onChange={(e) => setProfileForm({ ...profileForm, pharmacyName: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Pharmacy Address</label>
              <input
                type="text"
                value={profileForm.pharmacyAddress}
                onChange={(e) => setProfileForm({ ...profileForm, pharmacyAddress: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Phone</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 py-3 bg-faint text-muted rounded-btn font-semibold hover:bg-faint/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted">Name</span>
              <span className="text-primary font-medium">{pharmacist.name}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted">Email</span>
              <span className="text-primary font-medium">{pharmacist.email}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted">Pharmacy Name</span>
              <span className="text-primary font-medium">{pharmacist.pharmacyName}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted">Pharmacy Address</span>
              <span className="text-primary font-medium">{pharmacist.pharmacyAddress}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-border">
              <span className="text-muted">Phone</span>
              <span className="text-primary font-medium">{pharmacist.phone}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-muted">License Number</span>
              <span className="text-primary font-medium">{pharmacist.licenseNumber}</span>
            </div>
          </div>
        )}
      </div>

      {/* Security Card */}
      <div className="bg-card rounded-card border border-border p-6">
        <h2 className="text-xl font-semibold text-primary mb-6">Security</h2>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-3 px-4 py-3 bg-faint text-muted rounded-btn hover:bg-faint/80 transition-colors"
        >
          <Lock className="w-5 h-5" />
          <span>Change Password</span>
        </button>
      </div>

      {/* Subscription Card */}
      <div className="bg-card rounded-card border border-border p-6">
        {pharmacist.isPremium ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-light rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary">Premium Member ✨</h2>
                <p className="text-muted">
                  Expires: {pharmacist.premiumExpiresAt ? new Date(pharmacist.premiumExpiresAt).toLocaleDateString() : 'Lifetime'}
                </p>
              </div>
            </div>
            <div className="bg-mint-light rounded-lg p-4">
              <h3 className="font-semibold text-mint mb-2">Premium Features Active</h3>
              <ul className="space-y-2 text-sm text-primary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-mint" />
                  AI-powered offer generation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-mint" />
                  Advanced analytics dashboard
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-mint" />
                  Unlimited patient linking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-mint" />
                  Priority support
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-faint rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-muted" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary">Free Plan</h2>
                <p className="text-muted">Upgrade to unlock premium features</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-primary mb-3">Free Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-muted">
                    <Check className="w-4 h-4 text-green" />
                    Basic patient management
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <Check className="w-4 h-4 text-green" />
                    Manual offer creation
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <Check className="w-4 h-4 text-green" />
                    Stock alerts
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <Check className="w-4 h-4 text-green" />
                    Email notifications
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-3">Premium Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-muted">
                    <X className="w-4 h-4 text-red" />
                    AI offer generation
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <X className="w-4 h-4 text-red" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <X className="w-4 h-4 text-red" />
                    Unlimited patients
                  </li>
                  <li className="flex items-center gap-2 text-muted">
                    <X className="w-4 h-4 text-red" />
                    Priority support
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-4 bg-amber text-white rounded-btn font-semibold hover:bg-amber/90 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Upgrade to Premium
            </button>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
              required
              minLength={6}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="flex-1 py-3 bg-faint text-muted rounded-btn font-semibold hover:bg-faint/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgrade} />
    </div>
  );
}

function UpgradeModal({ isOpen, onClose, onUpgrade }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    onUpgrade(pin);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Premium">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-amber" />
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">Upgrade to Premium</h3>
          <p className="text-muted">Unlock all features with a one-time payment</p>
        </div>

        <div className="bg-amber rounded-lg p-4 text-white">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Premium Plan</span>
            <span className="text-2xl font-bold">NPR 999</span>
          </div>
          <p className="text-sm opacity-90">One-time payment, lifetime access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Enter PIN (Demo: 1234)</label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength="4"
              placeholder="••••"
              className="w-full px-4 py-3 border border-border rounded-btn text-center text-2xl tracking-[1em] focus:outline-none focus:border-mint"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-faint text-muted rounded-btn font-semibold hover:bg-faint/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-amber text-white rounded-btn font-semibold hover:bg-amber/90 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Pay & Upgrade'}
            </button>
          </div>
        </form>

        <p className="text-xs text-muted text-center">
          This is a demo. In production, integrate with a real payment gateway like eSewa or Khalti.
        </p>
      </div>
    </Modal>
  );
}

export default ProfilePage;
