import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Link2, Unlink, Send, Mail, Phone, MapPin, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import axios from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import StockBadge from '../components/StockBadge';
import Modal from '../components/Modal';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [medicineFilter, setMedicineFilter] = useState('');
  const [selectedPatients, setSelectedPatients] = useState([]);
  
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [contactForm, setContactForm] = useState({ patientEmail: '', patientPhone: '', patientAddress: '' });
  const [bulkEmailForm, setBulkEmailForm] = useState({ subject: '', message: '' });
  
  const [showOfferComposer, setShowOfferComposer] = useState(false);
  const [offerPatient, setOfferPatient] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (userId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/patients');
      setPatients(response.data.patients);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };


  const handleUnlinkPatient = async (patientId) => {
    if (!confirm('Are you sure you want to unlink this patient?')) return;
    try {
      await axios.delete(`/api/dashboard/patients/${patientId}/unlink`);
      toast.success('Patient unlinked successfully');
      fetchPatients();
    } catch (error) {
      toast.error('Failed to unlink patient');
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/dashboard/patients/${selectedPatient._id}/contact`, contactForm);
      toast.success('Contact info updated');
      setShowEditContactModal(false);
      fetchPatients();
    } catch (error) {
      toast.error('Failed to update contact info');
    }
  };

  const handleSendBulkEmail = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/dashboard/patients/bulk-email', {
        patientIds: selectedPatients,
        subject: bulkEmailForm.subject,
        message: bulkEmailForm.message,
      });
      toast.success(`Email sent to ${selectedPatients.length} patients successfully`);
      setShowBulkEmailModal(false);
      setBulkEmailForm({ subject: '', message: '' });
      setSelectedPatients([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send bulk email');
    }
  };

  const openEditContact = (patient) => {
    setSelectedPatient(patient);
    setContactForm({
      patientEmail: patient.patientEmail || '',
      patientPhone: patient.patientPhone || '',
      patientAddress: patient.patientAddress || '',
    });
    setShowEditContactModal(true);
  };

  const handleSendOffer = (patient) => {
    setOfferPatient(patient);
    setShowOfferComposer(true);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientPhone?.includes(searchQuery);

    const matchesLocation = locationFilter === '' || p.patientAddress?.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesMedicine = medicineFilter === '' || p.medicines?.some(m => m.name.toLowerCase().includes(medicineFilter.toLowerCase()));

    return matchesSearch && matchesLocation && matchesMedicine;
  });

  const togglePatientSelection = (patientId) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) ? prev.filter(id => id !== patientId) : [...prev, patientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map(p => p._id));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div>
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-mint"
          />
        </div>
        <div className="relative flex-1 md:w-48 md:flex-none">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Filter Location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-mint"
          />
        </div>
        <div className="relative flex-1 md:w-48 md:flex-none">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted flex items-center justify-center font-bold text-xs border border-muted rounded-full">Rx</div>
          <input
            type="text"
            placeholder="Filter Medicine..."
            value={medicineFilter}
            onChange={(e) => setMedicineFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:border-mint"
          />
        </div>
        <button
          onClick={() => navigate('/link-patients')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 transition-colors whitespace-nowrap"
        >
          <Link2 className="w-5 h-5" />
          Link Patient
        </button>
      </div>

      {/* Bulk Actions */}
      {filteredPatients.length > 0 && (
        <div className="flex items-center justify-between bg-card border border-border rounded-card p-4 mb-6">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-border text-mint focus:ring-mint cursor-pointer"
            />
            <span className="text-sm font-medium text-primary">
              {selectedPatients.length} selected
            </span>
          </div>
          {selectedPatients.length > 0 && (
            <button
              onClick={() => setShowBulkEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-mint text-white rounded-btn text-sm font-semibold hover:bg-mint/90 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send Bulk Email
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredPatients.length === 0 && !loading && (
        <div className="bg-card rounded-card border border-border p-12 text-center">
          <div className="w-20 h-20 bg-faint rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-10 h-10 text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">No patients found</h3>
          <p className="text-muted mb-6">Adjust your filters or link a new patient.</p>
        </div>
      )}

      {/* Patient Grid (Hierarchical) */}
      <div className="space-y-4">
        {Object.entries(
          filteredPatients.reduce((acc, patient) => {
            const key = patient.userId || patient._id;
            if (!acc[key]) {
              acc[key] = {
                mainAccountName: patient.mainAccountName || patient.name,
                members: []
              };
            }
            acc[key].members.push(patient);
            return acc;
          }, {})
        ).map(([userId, group]) => (
          <div key={userId} className="bg-card rounded-card border border-border overflow-hidden">
            <button
              onClick={() => toggleGroup(userId)}
              className="w-full flex items-center justify-between p-4 hover:bg-faint transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center text-white font-semibold">
                  {group.mainAccountName?.charAt(0) || 'P'}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-primary text-lg">{group.mainAccountName}'s Account</h3>
                  <p className="text-sm text-muted">{group.members.length} Profile{group.members.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="text-muted">
                {expandedGroups[userId] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>
            
            {expandedGroups[userId] && (
              <div className="p-4 border-t border-border bg-faint/30">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {group.members.map((patient) => (
                    <PatientCard
                      key={patient._id}
                      patient={patient}
                      isSelected={selectedPatients.includes(patient._id)}
                      onSelectToggle={() => togglePatientSelection(patient._id)}
                      onUnlink={() => handleUnlinkPatient(patient._id)}
                      onEditContact={() => openEditContact(patient)}
                      onSendOffer={() => handleSendOffer(patient)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bulk Email Modal */}
      <Modal isOpen={showBulkEmailModal} onClose={() => setShowBulkEmailModal(false)} title="Send Bulk Email">
        <form onSubmit={handleSendBulkEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Subject *</label>
            <input
              type="text"
              value={bulkEmailForm.subject}
              onChange={(e) => setBulkEmailForm({ ...bulkEmailForm, subject: e.target.value })}
              placeholder="Email subject"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Message *</label>
            <textarea
              value={bulkEmailForm.message}
              onChange={(e) => setBulkEmailForm({ ...bulkEmailForm, message: e.target.value })}
              placeholder="Type your message here..."
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint h-32 resize-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowBulkEmailModal(false)}
              className="flex-1 py-3 bg-faint text-muted rounded-btn font-semibold hover:bg-faint/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send to {selectedPatients.length} Patients
            </button>
          </div>
        </form>
      </Modal>


      {/* Edit Contact Modal */}
      <Modal isOpen={showEditContactModal} onClose={() => setShowEditContactModal(false)} title="Edit Contact Info">
        <form onSubmit={handleUpdateContact} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Email</label>
            <input
              type="email"
              value={contactForm.patientEmail}
              onChange={(e) => setContactForm({ ...contactForm, patientEmail: e.target.value })}
              placeholder="Patient's email"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Phone</label>
            <input
              type="tel"
              value={contactForm.patientPhone}
              onChange={(e) => setContactForm({ ...contactForm, patientPhone: e.target.value })}
              placeholder="Patient's phone"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Address</label>
            <input
              type="text"
              value={contactForm.patientAddress}
              onChange={(e) => setContactForm({ ...contactForm, patientAddress: e.target.value })}
              placeholder="Patient's address"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEditContactModal(false)}
              className="flex-1 py-3 bg-faint text-muted rounded-btn font-semibold hover:bg-faint/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Offer Composer Modal */}
      {showOfferComposer && offerPatient && (
        <OfferComposer
          isOpen={showOfferComposer}
          onClose={() => {
            setShowOfferComposer(false);
            setOfferPatient(null);
          }}
          patient={offerPatient}
          medicine={null}
          onSuccess={() => {
            setShowOfferComposer(false);
            setOfferPatient(null);
          }}
        />
      )}
    </div>
  );
}

function PatientCard({ patient, onUnlink, onEditContact, onSendOffer, isSelected, onSelectToggle }) {
  const alertColors = {
    red: 'bg-red-light text-red',
    amber: 'bg-amber-light text-amber',
    green: 'bg-mint-light text-mint',
  };

  return (
    <div className={`bg-card rounded-card border ${isSelected ? 'border-mint ring-1 ring-mint' : 'border-border'} p-6 transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={onSelectToggle}
            className="w-5 h-5 rounded border-border text-mint focus:ring-mint cursor-pointer mt-1"
          />
          <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center text-white font-semibold">
            {patient.name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-primary">{patient.name}</h3>
              {patient.relation && patient.relation !== 'self' && (
                <span className="px-1.5 py-0.5 bg-faint text-muted rounded text-[10px] font-medium uppercase tracking-wider">
                  {patient.relation}
                </span>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold inline-block mt-1 ${alertColors[patient.alertLevel]}`}>
              {patient.alertLevel === 'red' ? 'Critical' : patient.alertLevel === 'amber' ? 'Warning' : 'Healthy'}
            </span>
          </div>
        </div>
        <button
          onClick={onUnlink}
          className="p-2 hover:bg-red-light text-muted hover:text-red rounded-full transition-colors"
          title="Unlink patient"
        >
          <Unlink className="w-4 h-4" />
        </button>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4 text-sm pl-8">
        {patient.patientEmail && (
          <div className="flex items-center gap-2 text-muted">
            <Mail className="w-4 h-4" />
            <span className="truncate">{patient.patientEmail}</span>
          </div>
        )}
        {patient.patientPhone && (
          <div className="flex items-center gap-2 text-muted">
            <Phone className="w-4 h-4" />
            <span>{patient.patientPhone}</span>
          </div>
        )}
        {patient.patientAddress && (
          <div className="flex items-center gap-2 text-muted">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{patient.patientAddress}</span>
          </div>
        )}
      </div>

      <div className="pl-8">
        <button
          onClick={onEditContact}
          className="flex items-center gap-2 text-sm text-muted hover:text-mint mb-4 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Edit Contact Info
        </button>

        {/* Medicines Grid */}
        <div className="border-t border-border pt-4">
          <h4 className="font-semibold text-primary mb-3 text-sm">Medicines ({patient.medicines?.length || 0})</h4>
          <div className="grid grid-cols-2 gap-2">
            {patient.medicines?.slice(0, 4).map((med) => (
              <MedicineMiniCard key={med._id} medicine={med} />
            ))}
          </div>
          {patient.medicines?.length > 4 && (
            <p className="text-xs text-muted mt-2">+{patient.medicines.length - 4} more medicines</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <button
            onClick={onSendOffer}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-mint text-white rounded-btn text-sm font-semibold hover:bg-mint/90 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Offer
          </button>
        </div>
      </div>
    </div>
  );
}

function MedicineMiniCard({ medicine }) {
  const progressPercent = Math.min(100, (medicine.daysLeft / 30) * 100);
  const progressColor = medicine.stockStatus === 'red' ? 'bg-red' : medicine.stockStatus === 'amber' ? 'bg-amber' : 'bg-mint';

  return (
    <div className="bg-faint rounded-lg p-3">
      <p className="font-medium text-primary text-xs truncate">{medicine.name}</p>
      <p className="text-xs text-muted">{medicine.strength} {medicine.unit}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-semibold text-primary">{medicine.daysLeft}d</span>
        <StockBadge status={medicine.stockStatus} />
      </div>
      <div className="w-full bg-border rounded-full h-1.5 mt-2">
        <div className={`h-1.5 rounded-full ${progressColor}`} style={{ width: `${progressPercent}%` }} />
      </div>
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
    let testPin = null;
    if (!pharmacist?.isPremium) {
      testPin = window.prompt("This is a Premium feature. Enter demo pin '1234' to test:");
      if (testPin !== '1234') {
        toast.error('Premium required');
        return;
      }
    }
    
    try {
      setLoading(true);
      const response = await axios.post('/api/offers/generate-template', {
        medicineName: medicine?.name || 'Medicine',
        offerType,
        discountPercent: discount,
        testPin,
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
            <p className="text-sm text-muted">{medicine?.name || 'General Offer'}</p>
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

export default PatientsPage;
