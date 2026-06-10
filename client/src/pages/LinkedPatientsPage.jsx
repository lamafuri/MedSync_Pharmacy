import { useState } from 'react';
import toast from 'react-hot-toast';
import { linkViaOtp, linkViaQr } from '../api/pharmacistLinkApi';
import QrScanner from '../components/QrScanner';

function LinkedPatientsPage() {
  const [linkMethod, setLinkMethod] = useState('otp');
  const [otp, setOtp] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [linking, setLinking] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to link via QR');
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-bg p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">Link Patients</h1>

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
