import { useState, useEffect } from 'react';
import { Plus, Trash2, Filter, Calendar, Send } from 'lucide-react';
import axios from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/Modal';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, [filterStatus]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await axios.get('/api/offers', { params });
      setOffers(response.data.offers);
    } catch (error) {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await axios.delete(`/api/offers/${offerId}`);
      toast.success('Offer deleted');
      fetchOffers();
    } catch (error) {
      toast.error('Failed to delete offer');
    }
  };

  const statusColors = {
    draft: 'bg-faint text-muted',
    sent: 'bg-mint-light text-mint',
    accepted: 'bg-green-light text-green',
    declined: 'bg-red-light text-red',
    expired: 'bg-faint text-muted',
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-mint"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="ml-auto flex items-center gap-2 px-6 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Offer
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-card rounded-card border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-faint">
            <tr className="text-left text-muted text-sm">
              <th className="px-6 py-4 font-medium">Patient</th>
              <th className="px-6 py-4 font-medium">Medicine</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Discount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Sent</th>
              <th className="px-6 py-4 font-medium">Channels</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-muted">
                  No offers found. Create your first offer to get started.
                </td>
              </tr>
            ) : (
              offers.map((offer) => (
                <tr key={offer._id} className="border-t border-border hover:bg-faint/50">
                  <td className="px-6 py-4 font-medium text-primary">
                    {offer.patientId?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-muted">{offer.medicineName}</td>
                  <td className="px-6 py-4 capitalize text-muted">{offer.offerType}</td>
                  <td className="px-6 py-4 text-muted">
                    {offer.discountPercent > 0 ? `${offer.discountPercent}%` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[offer.status]}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-muted text-sm">
                    {offer.channels?.join(', ') || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeleteOffer(offer._id)}
                      className="p-2 hover:bg-red-light text-muted hover:text-red rounded-full transition-colors"
                      title="Delete offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {offers.length === 0 ? (
          <div className="bg-card rounded-card border border-border p-12 text-center">
            <div className="w-16 h-16 bg-faint rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">No offers yet</h3>
            <p className="text-muted mb-6">Create your first offer to engage with your patients.</p>
            <button
              onClick={() => setShowComposer(true)}
              className="px-6 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90"
            >
              Create Offer
            </button>
          </div>
        ) : (
          offers.map((offer) => (
            <OfferCard key={offer._id} offer={offer} onDelete={() => handleDeleteOffer(offer._id)} />
          ))
        )}
      </div>

      {/* Offer Composer Modal */}
      {showComposer && (
        <OfferComposer
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            fetchOffers();
            setShowComposer(false);
          }}
        />
      )}
    </div>
  );
}

function OfferCard({ offer, onDelete }) {
  const statusColors = {
    draft: 'bg-faint text-muted',
    sent: 'bg-mint-light text-mint',
    accepted: 'bg-green-light text-green',
    declined: 'bg-red-light text-red',
    expired: 'bg-faint text-muted',
  };

  return (
    <div className="bg-card rounded-card border border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-primary">{offer.patientId?.name || 'Unknown Patient'}</h3>
          <p className="text-sm text-muted">{offer.medicineName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[offer.status]}`}>
            {offer.status}
          </span>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-light text-muted hover:text-red rounded-full transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Type:</span>
          <span className="text-primary capitalize">{offer.offerType}</span>
        </div>
        {offer.discountPercent > 0 && (
          <div className="flex justify-between">
            <span className="text-muted">Discount:</span>
            <span className="text-primary">{offer.discountPercent}%</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted">Sent:</span>
          <span className="text-primary">{offer.sentAt ? new Date(offer.sentAt).toLocaleDateString() : '-'}</span>
        </div>
      </div>

      {offer.shortMessage && (
        <p className="mt-4 text-sm text-muted line-clamp-2">{offer.shortMessage}</p>
      )}
    </div>
  );
}

function OfferComposer({ isOpen, onClose, onSuccess }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offerType, setOfferType] = useState('discount');
  const [discount, setDiscount] = useState(10);
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState(['in_app']);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [patientPreferences, setPatientPreferences] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const { pharmacist } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/dashboard/patients');
      setPatients(response.data.patients);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }
    try {
      setLoading(true);
      await axios.post('/api/offers', {
        patientId: selectedPatientId,
        medicineName: medicineName || 'Medicine',
        offerType,
        discountPercent: offerType === 'discount' ? discount : 0,
        title: `${offerType === 'discount' ? `${discount}% Off` : offerType} - ${medicineName || 'Special Offer'}`,
        fullMessage: emailBody || message,
        shortMessage: whatsappMessage || message.substring(0, 100),
        emailSubject: emailSubject || '',
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

  const handleGenerateEmail = async () => {
    if (!pharmacist?.isPremium) {
      toast.error('Premium feature');
      return;
    }
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }
    try {
      setLoading(true);
      const selectedPatient = patients.find(p => p._id === selectedPatientId);
      const response = await axios.post('/api/offers/generate-template', {
        medicineName: medicineName || 'Medicine',
        offerType,
        discountPercent: discount,
        patientName: selectedPatient?.name || 'Patient',
        patientPreferences,
        daysLeft: 7,
        additionalNotes,
      });
      const template = response.data.template;
      setEmailSubject(template.emailSubject || '');
      setEmailBody(template.emailBody || '');
      toast.success('Email content generated');
    } catch (error) {
      toast.error('Failed to generate email content');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWhatsApp = async () => {
    if (!pharmacist?.isPremium) {
      toast.error('Premium feature');
      return;
    }
    if (!selectedPatientId) {
      toast.error('Please select a patient first');
      return;
    }
    try {
      setLoading(true);
      const selectedPatient = patients.find(p => p._id === selectedPatientId);
      const response = await axios.post('/api/offers/generate-template', {
        medicineName: medicineName || 'Medicine',
        offerType,
        discountPercent: discount,
        patientName: selectedPatient?.name || 'Patient',
        patientPreferences,
        daysLeft: 7,
        additionalNotes,
      });
      const template = response.data.template;
      setWhatsappMessage(template.whatsappMessage || '');
      toast.success('WhatsApp message generated');
    } catch (error) {
      toast.error('Failed to generate WhatsApp message');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p._id === selectedPatientId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Offer" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">Patient *</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
            required
          >
            <option value="">Select a patient</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Medicine Name *</label>
          <input
            type="text"
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            placeholder="e.g., Metformin 500mg"
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
            required
          />
          {selectedPatient && selectedPatient.medicines?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedPatient.medicines.slice(0, 5).map((med) => (
                <button
                  key={med._id}
                  type="button"
                  onClick={() => setMedicineName(`${med.name} ${med.strength}${med.unit}`)}
                  className="text-xs px-2 py-1 bg-faint text-muted rounded-full hover:bg-mint-light hover:text-mint transition-colors"
                >
                  {med.name} {med.strength}{med.unit}
                </button>
              ))}
            </div>
          )}
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
          <label className="block text-sm font-medium text-primary mb-2">Patient Preferences / Notes</label>
          <textarea
            value={patientPreferences}
            onChange={(e) => setPatientPreferences(e.target.value)}
            rows={2}
            placeholder="e.g. elderly patient, budget-conscious, prefers Nepali language"
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Additional Context</label>
          <input
            type="text"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="e.g. repeat customer, diabetic patient"
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
          />
        </div>

        {/* Section A - Email Message */}
        <div className="border border-border rounded-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-primary">Email Content</h3>
          
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Subject Line</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">Email Body</label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={4}
              placeholder="Email body content..."
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateEmail}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-faint text-muted rounded-btn text-sm font-semibold hover:bg-faint/80 disabled:opacity-50"
          >
            ✨ Generate Email
            {!pharmacist?.isPremium && <span className="text-amber">● Premium</span>}
          </button>
        </div>

        {/* Section B - WhatsApp Message */}
        <div className="border border-border rounded-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-primary">
              WhatsApp Message
              {pharmacist?.isPremium ? <span className="ml-2 text-amber">· Coming Soon</span> : <span className="ml-2 text-amber">👑 Premium · Coming Soon</span>}
            </h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Message</label>
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="WhatsApp message..."
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint resize-none"
            />
            <p className="text-xs text-muted mt-1">{whatsappMessage.length}/300</p>
          </div>

          <button
            type="button"
            disabled={true}
            className="flex items-center gap-2 px-4 py-2 bg-faint text-muted rounded-btn text-sm font-semibold cursor-not-allowed"
            title="WhatsApp direct messaging coming soon"
          >
            ✨ Generate WhatsApp Message
            <span className="bg-border text-muted text-xs px-2 py-0.5 rounded-full">Coming Soon</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Channels</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={channels.includes('email')}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (!pharmacist?.isPremium) {
                      toast.error('Email sending requires Premium subscription');
                      return;
                    }
                    setChannels([...channels, 'email']);
                  } else {
                    setChannels(channels.filter(c => c !== 'email'));
                  }
                }}
                disabled={!pharmacist?.isPremium}
                className="w-4 h-4 accent-mint"
              />
              <span className="text-sm text-muted">
                Email {!pharmacist?.isPremium && <span className="text-amber ml-1">👑 Premium only</span>}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={channels.includes('in_app')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setChannels([...channels, 'in_app']);
                  } else {
                    setChannels(channels.filter(c => c !== 'in_app'));
                  }
                }}
                className="w-4 h-4 accent-mint"
              />
              <span className="text-sm text-muted">In-App</span>
            </label>
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
            title={!pharmacist?.isPremium && channels.includes('email') ? 'Upgrade to send emails' : ''}
          >
            {loading ? 'Sending...' : 'Send Offer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default OffersPage;
