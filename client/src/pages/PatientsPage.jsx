import { useState, useEffect } from 'react';
import { Search, Plus, Link2, Unlink, Send, Mail, Phone, MapPin, Edit2, X } from 'lucide-react';
import axios from '../lib/axios';
import StockBadge from '../components/StockBadge';
import Modal from '../components/Modal';
import SkeletonCard from '../components/SkeletonCard';
import toast from 'react-hot-toast';

function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [linkForm, setLinkForm] = useState({ qrToken: '', patientEmail: '', patientPhone: '', patientAddress: '' });
  const [contactForm, setContactForm] = useState({ patientEmail: '', patientPhone: '', patientAddress: '' });

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

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/dashboard/patients/link', linkForm);
      toast.success('Patient linked successfully');
      setShowLinkModal(false);
      setLinkForm({ qrToken: '', patientEmail: '', patientPhone: '', patientAddress: '' });
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to link patient');
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

  const openEditContact = (patient) => {
    setSelectedPatient(patient);
    setContactForm({
      patientEmail: patient.patientEmail || '',
      patientPhone: patient.patientPhone || '',
      patientAddress: patient.patientAddress || '',
    });
    setShowEditContactModal(true);
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientPhone?.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-btn focus:outline-none focus:border-mint"
          />
        </div>
        <button
          onClick={() => setShowLinkModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 transition-colors"
        >
          <Link2 className="w-5 h-5" />
          Link New Patient
        </button>
      </div>

      {/* Empty State */}
      {filteredPatients.length === 0 && !loading && (
        <div className="bg-card rounded-card border border-border shadow-card p-12 text-center">
          <div className="w-20 h-20 bg-faint rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-10 h-10 text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">No patients linked yet</h3>
          <p className="text-muted mb-6">Link your first patient using their QR token to get started.</p>
          <button
            onClick={() => setShowLinkModal(true)}
            className="px-6 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90"
          >
            Link Patient
          </button>
        </div>
      )}

      {/* Patient Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPatients.map((patient) => (
          <PatientCard
            key={patient._id}
            patient={patient}
            onUnlink={() => handleUnlinkPatient(patient._id)}
            onEditContact={() => openEditContact(patient)}
            onSendOffer={() => {/* Navigate to offers page with patient pre-selected */}}
          />
        ))}
      </div>

      {/* Link Patient Modal */}
      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Link Patient">
        <form onSubmit={handleLinkPatient} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">QR Token *</label>
            <input
              type="text"
              value={linkForm.qrToken}
              onChange={(e) => setLinkForm({ ...linkForm, qrToken: e.target.value })}
              placeholder="Enter patient's QR token"
              className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Email (optional)</label>
            <input
              type="email"
              value={linkForm.patientEmail}
              onChange={(e) => setLinkForm({ ...linkForm, patientEmail: e.target.value })}
              placeholder="Patient's email"
              className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Phone (optional)</label>
            <input
              type="tel"
              value={linkForm.patientPhone}
              onChange={(e) => setLinkForm({ ...linkForm, patientPhone: e.target.value })}
              placeholder="Patient's phone"
              className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Address (optional)</label>
            <input
              type="text"
              value={linkForm.patientAddress}
              onChange={(e) => setLinkForm({ ...linkForm, patientAddress: e.target.value })}
              placeholder="Patient's address"
              className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              className="flex-1 py-3 bg-faint text-muted rounded-btn font-semibold hover:bg-faint/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90"
            >
              Link Patient
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
              className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Phone</label>
            <input
              type="tel"
              value={contactForm.patientPhone}
              onChange={(e) => setContactForm({ ...contactForm, patientPhone: e.target.value })}
              placeholder="Patient's phone"
              className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Address</label>
            <input
              type="text"
              value={contactForm.patientAddress}
              onChange={(e) => setContactForm({ ...contactForm, patientAddress: e.target.value })}
              placeholder="Patient's address"
              className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
    </div>
  );
}

function PatientCard({ patient, onUnlink, onEditContact, onSendOffer }) {
  const alertColors = {
    red: 'bg-red-light text-red',
    amber: 'bg-amber-light text-amber',
    green: 'bg-mint-light text-mint',
  };

  return (
    <div className="bg-card rounded-card border border-border shadow-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center text-white font-semibold">
            {patient.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h3 className="font-semibold text-primary">{patient.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${alertColors[patient.alertLevel]}`}>
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
      <div className="space-y-2 mb-4 text-sm">
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

export default PatientsPage;
