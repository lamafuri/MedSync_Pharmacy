import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Gift, Clock, ChevronDown, ChevronUp, Send } from 'lucide-react';
import axios from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import StockBadge from '../components/StockBadge';
import Modal from '../components/Modal';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [showOfferComposer, setShowOfferComposer] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/patients');
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = data?.patients?.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'critical') return p.alertLevel === 'red';
    if (filter === 'warning') return p.alertLevel === 'amber';
    if (filter === 'healthy') return p.alertLevel === 'green';
    return true;
  }) || [];

  const handleSendOffer = (patient, medicine = null) => {
    setSelectedPatient(patient);
    setSelectedMedicine(medicine);
    setShowOfferComposer(true);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Total Patients"
          value={stats.totalPatients || 0}
          color="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Stock"
          value={stats.criticalCount || 0}
          color="red"
        />
        <StatCard
          icon={Gift}
          label="Offers Sent Today"
          value={stats.offersSentToday || 0}
          color="mint"
        />
        <StatCard
          icon={Clock}
          label="Pending Actions"
          value={stats.warningCount || 0}
          color="amber"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterChip
          label={`All (${stats.totalPatients || 0})`}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterChip
          label="🔴 Critical"
          active={filter === 'critical'}
          onClick={() => setFilter('critical')}
        />
        <FilterChip
          label="🟡 Warning"
          active={filter === 'warning'}
          onClick={() => setFilter('warning')}
        />
        <FilterChip
          label="🟢 Healthy"
          active={filter === 'healthy'}
          onClick={() => setFilter('healthy')}
        />
      </div>

      {/* Patient Alert List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <div className="bg-card rounded-card border border-border p-8 text-center">
            <p className="text-muted">No patients found. Link your first patient to get started.</p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <PatientCard
              key={patient._id}
              patient={patient}
              isExpanded={expandedPatient === patient._id}
              onToggle={() => setExpandedPatient(expandedPatient === patient._id ? null : patient._id)}
              onSendOffer={(medicine) => handleSendOffer(patient, medicine)}
            />
          ))
        )}
      </div>

      {/* Offer Composer Modal */}
      {showOfferComposer && (
        <OfferComposer
          isOpen={showOfferComposer}
          onClose={() => {
            setShowOfferComposer(false);
            setSelectedPatient(null);
            setSelectedMedicine(null);
          }}
          patient={selectedPatient}
          medicine={selectedMedicine}
          onSuccess={() => {
            fetchDashboardData();
            setShowOfferComposer(false);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-mint-light text-mint',
    red: 'bg-red-light text-red',
    mint: 'bg-mint-light text-mint',
    amber: 'bg-amber-light text-amber',
  };

  return (
    <div className="bg-card rounded-card border border-border p-6">
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-muted text-sm">{label}</p>
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-btn text-sm font-semibold transition-colors ${
        active ? 'bg-mint text-white' : 'bg-faint text-muted hover:bg-faint/80'
      }`}
    >
      {label}
    </button>
  );
}

function PatientCard({ patient, isExpanded, onToggle, onSendOffer }) {
  const alertColors = {
    red: 'bg-red-light text-red',
    amber: 'bg-amber-light text-amber',
    green: 'bg-mint-light text-mint',
  };

  return (
    <div className="bg-card rounded-card border border-border overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-navy rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
            {patient.name?.charAt(0) || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-primary truncate">{patient.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${alertColors[patient.alertLevel]}`}>
                {patient.alertLevel === 'red' ? 'Critical' : patient.alertLevel === 'amber' ? 'Warning' : 'Healthy'}
              </span>
            </div>
            <p className="text-sm text-muted truncate">{patient.patientAddress || 'No address'}</p>
            <p className="text-sm text-muted">{patient.patientPhone || 'No phone'}</p>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-faint rounded-full transition-colors flex-shrink-0"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
          </button>
        </div>

        {patient.medicinesNeedingRefill > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {patient.medicines.slice(0, 3).map((med) => (
              med.stockStatus !== 'green' && (
                <span key={med._id} className="text-xs px-2 py-1 rounded-full bg-faint text-muted">
                  {med.name} · {med.daysLeft}d
                </span>
              )
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSendOffer()}
            className="flex items-center gap-2 px-4 py-2 bg-mint text-white rounded-btn text-sm font-semibold hover:bg-mint/90 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Offer
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border p-6 bg-faint/50">
          <h4 className="font-semibold text-primary mb-4">Medicines</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Strength</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Daily</th>
                  <th className="pb-3 font-medium">Days Left</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {patient.medicines.map((med) => (
                  <tr key={med._id} className="border-t border-border">
                    <td className="py-3">{med.name}</td>
                    <td className="py-3">{med.strength} {med.unit}</td>
                    <td className="py-3">{med.currentStock}</td>
                    <td className="py-3">{med.frequencyPerDay * med.dosePerIntake}</td>
                    <td className="py-3">{med.daysLeft}</td>
                    <td className="py-3">
                      <StockBadge status={med.stockStatus} />
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => onSendOffer(med)}
                        className="text-mint hover:text-mint/80 text-xs font-semibold"
                      >
                        Quick Offer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
            <div>
              <span className="text-muted">Email: </span>
              <span className="text-primary">{patient.patientEmail || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-muted">Phone: </span>
              <span className="text-primary">{patient.patientPhone || 'Not provided'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OfferComposer({ isOpen, onClose, patient, medicine, onSuccess }) {
  const [offerType, setOfferType] = useState('discount');
  const [discount, setDiscount] = useState(10);
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState(['email', 'in_app']);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const { pharmacist } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('/api/offers', {
        patientId: patient._id,
        medicineName: medicine?.name || 'Medicine',
        offerType,
        discountPercent: offerType === 'discount' ? discount : 0,
        title: `${offerType === 'discount' ? `${discount}% Off` : offerType} - ${medicine?.name || 'Special Offer'}`,
        fullMessage: message,
        shortMessage: message.substring(0, 100),
        channels,
        expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.success('Offer sent successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!pharmacist?.isPremium) {
      toast.error('Premium feature');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post('/api/offers/generate-template', {
        medicineName: medicine?.name || 'Medicine',
        offerType,
        discountPercent: discount,
      });
      const template = response.data.template;
      setMessage(template.fullMessage || '');
      toast.success('AI template generated');
    } catch (error) {
      toast.error('Failed to generate template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Offer" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center text-white font-semibold">
            {patient.name?.charAt(0) || 'P'}
          </div>
          <div>
            <p className="font-semibold text-primary">{patient.name}</p>
            <p className="text-sm text-muted">{medicine?.name || 'Select a medicine'}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Offer Type</label>
          <div className="flex gap-2">
            {['discount', 'buy2get1', 'bundle', 'custom'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOfferType(type)}
                className={`px-4 py-2 rounded-btn text-sm font-semibold capitalize transition-colors ${
                  offerType === type ? 'bg-mint text-white' : 'bg-faint text-muted'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {offerType === 'discount' && (
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Discount: {discount}%</label>
            <input
              type="range"
              min="5"
              max="50"
              value={discount}
              onChange={(e) => setDiscount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Write your offer message..."
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint resize-none"
          />
          <p className="text-xs text-muted mt-1">{message.length}/500</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-faint text-muted rounded-btn text-sm font-semibold hover:bg-faint/80 disabled:opacity-50"
          >
            ✨ Generate with AI
            {!pharmacist?.isPremium && <span className="text-amber">● Premium</span>}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Channels</label>
          <div className="flex gap-4">
            {['email', 'sms', 'in_app'].map((channel) => (
              <label key={channel} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.includes(channel)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setChannels([...channels, channel]);
                    } else {
                      setChannels(channels.filter(c => c !== channel));
                    }
                  }}
                  disabled={channel === 'email' && !patient.patientEmail}
                  className="w-4 h-4 accent-mint"
                />
                <span className="text-sm text-muted capitalize">{channel}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Expires At</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
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
            className="flex-1 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Offer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default DashboardPage;
