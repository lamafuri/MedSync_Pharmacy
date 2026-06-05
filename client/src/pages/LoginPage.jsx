import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import axios from '../lib/axios';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  pharmacyName: z.string().min(2, 'Pharmacy name is required'),
  pharmacyAddress: z.string().min(5, 'Pharmacy address is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  licenseNumber: z.string().min(5, 'License number is required'),
});

const otpSchema = z.object({
  email: z.string().email('Valid email is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [tab, setTab] = useState('signin');
  const [showOTP, setShowOTP] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState('request');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [resetOtpValue, setResetOtpValue] = useState('');
  const [loading, setLoading] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
  });

  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetPasswordForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    if (pendingEmail) {
      resetPasswordForm.setValue('email', pendingEmail);
      otpForm.setValue('email', pendingEmail);
    }
  }, [pendingEmail, resetPasswordForm, otpForm]);

  const handleLogin = async (data) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', data);
      
      if (response.data.needsVerification) {
        setPendingEmail(response.data.email);
        setShowOTP(true);
        toast.success('Please verify your email');
        return;
      }

      login(response.data.pharmacist, response.data.token);
      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/register', data);
      setPendingEmail(data.email);
      setOtpValue('');
      setShowOTP(true);
      
      if (response.data.needsResend) {
        toast.error('Email service unavailable. Please click Resend OTP.');
      } else {
        toast.success('Registration successful. Check your email for OTP.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (data) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/verify-email', data);
      login(response.data.pharmacist, response.data.token);
      setOtpValue('');
      toast.success('Email verified successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/send-verify-otp', { email: pendingEmail });
      toast.success('OTP resent successfully');
    } catch (error) {
      if (error.response?.status === 503) {
        toast.error('Email service unavailable. Please try again later.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to resend OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (data) => {
    try {
      setLoading(true);
      await axios.post('/api/auth/forgot-password/request-otp', data);
      setPendingEmail(data.email);
      setResetStep('reset');
      setResetOtpValue('');
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data) => {
    try {
      setLoading(true);
      await axios.post('/api/auth/forgot-password/reset', data);
      setShowForgotPassword(false);
      setResetStep('request');
      setResetOtpValue('');
      toast.success('Password reset successful');
      setTab('signin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (showOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="w-full max-w-md bg-card rounded-card border border-border p-8">
          <button
            onClick={() => {
              setShowOTP(false);
              setOtpValue('');
            }}
            className="text-muted hover:text-primary mb-6 flex items-center gap-2"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-primary mb-2">Verify Your Email</h2>
          <p className="text-muted mb-6">Enter the 6-digit code sent to {pendingEmail}</p>
          
          <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
            <div className="flex gap-2 justify-center">
              {[...Array(6)].map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-12 h-14 text-center text-2xl font-bold font-mono border-2 border-border rounded-lg focus:border-mint focus:outline-none bg-transparent transition-colors"
                  value={otpValue[i] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newOtp = otpValue.split('');
                    newOtp[i] = val;
                    const finalOtp = newOtp.join('');
                    setOtpValue(finalOtp);
                    otpForm.setValue('otp', finalOtp);
                    if (val && i < 5) {
                      const inputs = e.target.parentElement.querySelectorAll('input');
                      if (inputs[i + 1]) inputs[i + 1].focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otpValue[i] && i > 0) {
                      const inputs = e.target.parentElement.querySelectorAll('input');
                      if (inputs[i - 1]) inputs[i - 1].focus();
                    }
                  }}
                  onPaste={e => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                    if (pastedData) {
                      setOtpValue(pastedData);
                      otpForm.setValue('otp', pastedData);
                      const nextIndex = Math.min(pastedData.length, 5);
                      setTimeout(() => {
                        const inputs = e.target.parentElement.querySelectorAll('input');
                        if (inputs[nextIndex]) inputs[nextIndex].focus();
                      }, 0);
                    }
                  }}
                />
              ))}
            </div>
            {otpForm.formState.errors.otp && (
              <p className="text-red text-sm mt-1 text-center">{otpForm.formState.errors.otp.message}</p>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full py-3 text-muted hover:text-primary disabled:opacity-50"
            >
              Resend OTP
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="w-full max-w-md bg-card rounded-card border border-border p-8">
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setResetStep('request');
              setResetOtpValue('');
            }}
            className="text-muted hover:text-primary mb-6 flex items-center gap-2"
          >
            ← Back
          </button>
          
          {resetStep === 'request' ? (
            <>
              <h2 className="text-2xl font-bold text-primary mb-2">Reset Password</h2>
              <p className="text-muted mb-6">Enter your email to receive a reset code</p>
              
              <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPasswordRequest)} className="space-y-4">
                <div>
                  <input
                    {...forgotPasswordForm.register('email')}
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                  />
                  {forgotPasswordForm.formState.errors.email && (
                    <p className="text-red text-sm mt-1">{forgotPasswordForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-primary mb-2">Enter Reset Code</h2>
              <p className="text-muted mb-6">Enter the code sent to {pendingEmail}</p>
              
              <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <div className="flex gap-2 justify-center">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={`reset-${i}`}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-12 h-14 text-center text-2xl font-bold font-mono border-2 border-border rounded-lg focus:border-mint focus:outline-none bg-transparent transition-colors"
                      value={resetOtpValue[i] || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        const newOtp = resetOtpValue.split('');
                        newOtp[i] = val;
                        const finalOtp = newOtp.join('');
                        setResetOtpValue(finalOtp);
                        resetPasswordForm.setValue('otp', finalOtp);
                        if (val && i < 5) {
                          const inputs = e.target.parentElement.querySelectorAll('input');
                          if (inputs[i + 1]) inputs[i + 1].focus();
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !resetOtpValue[i] && i > 0) {
                          const inputs = e.target.parentElement.querySelectorAll('input');
                          if (inputs[i - 1]) inputs[i - 1].focus();
                        }
                      }}
                      onPaste={e => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        if (pastedData) {
                          setResetOtpValue(pastedData);
                          resetPasswordForm.setValue('otp', pastedData);
                          const nextIndex = Math.min(pastedData.length, 5);
                          setTimeout(() => {
                            const inputs = e.target.parentElement.querySelectorAll('input');
                            if (inputs[nextIndex]) inputs[nextIndex].focus();
                          }, 0);
                        }
                      }}
                    />
                  ))}
                </div>
                {resetPasswordForm.formState.errors.otp && (
                  <p className="text-red text-sm mt-1 text-center">{resetPasswordForm.formState.errors.otp.message}</p>
                )}
                
                <div>
                  <input
                    {...resetPasswordForm.register('newPassword')}
                    type="password"
                    placeholder="New Password"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                  />
                  {resetPasswordForm.formState.errors.newPassword && (
                    <p className="text-red text-sm mt-1">{resetPasswordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-center p-16">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-mint rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-mint font-semibold text-lg">PHARMACIST PORTAL</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-6">
            Connect with patients. Grow your pharmacy.
          </h1>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {['Real-time alerts', 'AI offers', 'Patient notifications', 'Analytics'].map((feature) => (
              <span
                key={feature}
                className="px-3 py-1.5 rounded-full border border-white/20 text-white text-xs font-medium"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-mint rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-mint font-semibold text-lg">PHARMACIST PORTAL</span>
          </div>

          <div className="bg-card rounded-card border border-border p-8">
            {/* Tab Switcher */}
            <div className="flex mb-8 bg-faint rounded-xl p-1">
              <button
                onClick={() => setTab('signin')}
                className={`flex-1 py-2 rounded-xl font-semibold transition-colors ${
                  tab === 'signin' ? 'bg-white text-primary shadow-sm' : 'text-muted'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 py-2 rounded-xl font-semibold transition-colors ${
                  tab === 'register' ? 'bg-white text-primary shadow-sm' : 'text-muted'
                }`}
              >
                Register
              </button>
            </div>

            {tab === 'signin' ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red text-sm mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <input
                    {...loginForm.register('password')}
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red text-sm mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-muted hover:text-mint"
                >
                  Forgot password?
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      {...registerForm.register('name')}
                      type="text"
                      placeholder="Full Name"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                    />
                    {registerForm.formState.errors.name && (
                      <p className="text-red text-sm mt-1">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      {...registerForm.register('phone')}
                      type="tel"
                      placeholder="Phone"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                    />
                    {registerForm.formState.errors.phone && (
                      <p className="text-red text-sm mt-1">{registerForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <input
                    {...registerForm.register('email')}
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red text-sm mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <input
                    {...registerForm.register('password')}
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-red text-sm mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <div>
                  <input
                    {...registerForm.register('pharmacyName')}
                    type="text"
                    placeholder="Pharmacy Name"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                  />
                  {registerForm.formState.errors.pharmacyName && (
                    <p className="text-red text-sm mt-1">{registerForm.formState.errors.pharmacyName.message}</p>
                  )}
                </div>
                
                <div>
                  <input
                    {...registerForm.register('pharmacyAddress')}
                    type="text"
                    placeholder="Pharmacy Address"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                  />
                  {registerForm.formState.errors.pharmacyAddress && (
                    <p className="text-red text-sm mt-1">{registerForm.formState.errors.pharmacyAddress.message}</p>
                  )}
                </div>
                
                <div>
                  <input
                    {...registerForm.register('licenseNumber')}
                    type="text"
                    placeholder="License Number"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-mint"
                  />
                  {registerForm.formState.errors.licenseNumber && (
                    <p className="text-red text-sm mt-1">{registerForm.formState.errors.licenseNumber.message}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-mint text-white rounded-btn font-semibold hover:bg-mint/90 disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
