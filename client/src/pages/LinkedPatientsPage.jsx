import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { linkViaOtp, linkViaQr, getLinkedPatients, unlinkPatient } from '../api/pharmacistLinkApi';
import QrScanner from '../components/QrScanner';

function LinkedPatientsPage() {
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkMethod, setLinkMethod] = useState('otp');
  const [otp, setOtp] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [linking, setLinking] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const fetchLinkedPatients = async () => {
    try {
      setLoading(true);
      const data = await getLinkedPatients();
      setLinkedPatients(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch linked patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkedPatients();
  }, []);

  const handleLinkViaOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 8) {
      toast.error('OTP must be 8 digits');
      return;
    }

    try {
      setLinking(true);
      await linkViaOtp(otp);
      toast.success('Successfully linked to patient');
      setOtp('');
      fetchLinkedPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to link via OTP');
    } finally {
      setLinking(false);
    }
  };

  const handleLinkViaQr = async (e) => {
    e.preventDefault();
    if (!qrToken.trim()) {
      toast.error('QR token is required');
      return;
    }

    try {
      setLinking(true);
      await linkViaQr(qrToken);
      toast.success('Successfully linked to patient');
      setQrToken('');
      fetchLinkedPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to link via QR');
    } finally {
      setLinking(false);
    }
  };

  const handleScanSuccess = async (scannedToken) => {
    setScannerOpen(false);
    if (!scannedToken) return;
    try {
      setLinking(true);
      await linkViaQr(scannedToken);
      toast.success('Successfully linked to patient');
      fetchLinkedPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to link via QR');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (linkId) => {
    if (!window.confirm('Are you sure you want to unlink this patient?')) {
      return;
    }

    try {
      await unlinkPatient(linkId);
      toast.success('Successfully unlinked patient');
      fetchLinkedPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unlink patient');
    }
  };

  return (
    <>
    <div className="min-h-screen bg-bg p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">Linked Patients</h1>

        {/* Link New Patient Section */}
        <div className="bg-card rounded-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Link New Patient</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setLinkMethod('otp')}
              className={`px-4 py-2 rounded-btn font-medium transition-colors ${
                linkMethod === 'otp' ? 'bg-mint text-white' : 'bg-faint text-muted'
              }`}
            >
              Link via OTP
            </button>
            <button
              onClick={() => setLinkMethod('qr')}
              className={`px-4 py-2 rounded-btn font-medium transition-colors ${
                linkMethod === 'qr' ? 'bg-mint text-white' : 'bg-faint text-muted'
              }`}
            >
              Link via QR Token
            </button>
          </div>

          {linkMethod === 'otp' ? (
            <form onSubmit={handleLinkViaOtp} className="flex gap-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Enter 8-digit OTP"
                maxLength={8}
                className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
              />
              <button
                type="submit"
                disabled={linking || otp.length !== 8}
                className="px-6 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
              >
                {linking ? 'Linking...' : 'Link'}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                disabled={linking}
                className="w-full py-3 bg-navy text-white rounded-btn font-semibold hover:bg-navy/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/>
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>
                </svg>
                Scan QR Code with Camera
              </button>

              <div className="flex items-center gap-3 text-muted text-sm">
                <div className="flex-1 h-px bg-border" />
                <span>or enter token manually</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleLinkViaQr} className="flex gap-4">
                <input
                  type="text"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  placeholder="Paste QR token"
                  className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                />
                <button
                  type="submit"
                  disabled={linking || !qrToken.trim()}
                  className="px-6 py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
                >
                  {linking ? 'Linking...' : 'Link'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Linked Patients List */}
        <div className="bg-card rounded-card p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Your Linked Patients</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-mint" />
            </div>
          ) : linkedPatients.length === 0 ? (
            <p className="text-muted text-center py-8">No linked patients yet</p>
          ) : (
            <div className="space-y-4">
              {linkedPatients.map((link) => (
                <div key={link._id} className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-primary">
                        User ID: {link.userId}
                      </p>
                      <p className="text-sm text-muted">
                        Linked on: {new Date(link.linkedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted">
                        Method: {link.linkMethod === 'otp' ? 'OTP' : 'QR Token'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlink(link._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-btn text-sm hover:bg-red-600"
                    >
                      Unlink
                    </button>
                  </div>

                  {link.patients && link.patients.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-primary mb-2">Family Members:</p>
                      <div className="space-y-2">
                        {link.patients.map((patient) => (
                          <div key={patient._id} className="bg-faint rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-navy">{patient.name}</p>
                                <p className="text-sm text-muted">Relation: {patient.relation}</p>
                                {patient.allergies && (
                                  <p className="text-sm text-red-500">Allergies: {patient.allergies}</p>
                                )}
                              </div>
                            </div>

                            {patient.medicines && patient.medicines.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-navy mb-1">Medicines:</p>
                                <div className="space-y-1">
                                  {patient.medicines.map((medicine) => (
                                    <div key={medicine._id} className="text-sm text-muted bg-white rounded p-2">
                                      <p className="font-medium">{medicine.name}</p>
                                      <p className="text-xs">
                                        Stock: {medicine.currentStock} / {medicine.totalStock}
                                      </p>
                                      <p className="text-xs">
                                        Dosage: {medicine.dosage}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {scannerOpen && (
      <QrScanner
        onScan={handleScanSuccess}
        onClose={() => setScannerOpen(false)}
      />
    )}
    </>
  );
}

export default LinkedPatientsPage;
