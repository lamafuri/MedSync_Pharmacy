import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: pendingEmail },
  });

  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetPasswordForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

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
      setShowOTP(true);
      toast.success('Registration successful. Check your email for OTP.');
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
      await axios.post('/api/auth/send-verify-otp', { email: pendingEmail });
      toast.success('OTP resent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
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
        <div className="w-full max-w-md bg-card rounded-card shadow-modal p-8">
          <button
            onClick={() => setShowOTP(false)}
            className="text-muted hover:text-primary mb-6 flex items-center gap-2"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-primary mb-2">Verify Your Email</h2>
          <p className="text-muted mb-6">Enter the 6-digit code sent to {pendingEmail}</p>
          
          <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
            <div>
              <input
                {...otpForm.register('otp')}
                type="text"
                maxLength="6"
                placeholder="000000"
                className="w-full px-4 py-3 border border-border rounded-btn text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-mint"
              />
              {otpForm.formState.errors.otp && (
                <p className="text-red text-sm mt-1">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>
            
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
        <div className="w-full max-w-md bg-card rounded-card shadow-modal p-8">
          <button
            onClick={() => {
              setShowForgotPassword(false);
              setResetStep('request');
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
                    className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
                <div>
                  <input
                    {...resetPasswordForm.register('otp')}
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-border rounded-btn text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-mint"
                  />
                  {resetPasswordForm.formState.errors.otp && (
                    <p className="text-red text-sm mt-1">{resetPasswordForm.formState.errors.otp.message}</p>
                  )}
                </div>
                
                <div>
                  <input
                    {...resetPasswordForm.register('newPassword')}
                    type="password"
                    placeholder="New Password"
                    className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
          
          <div className="space-y-3">
            {['Real-time alerts', 'AI offers', 'Patient notifications', 'Analytics'].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-mint rounded-full" />
                <span>{feature}</span>
              </div>
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

          <div className="bg-card rounded-card shadow-card p-8">
            {/* Tab Switcher */}
            <div className="flex mb-8 bg-faint rounded-btn p-1">
              <button
                onClick={() => setTab('signin')}
                className={`flex-1 py-2 rounded-btn font-semibold transition-colors ${
                  tab === 'signin' ? 'bg-white text-primary shadow-sm' : 'text-muted'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 py-2 rounded-btn font-semibold transition-colors ${
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
                    className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
                    className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
                      className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
                      className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
                    className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
                    className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
                    className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
                    className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
                    className="w-full px-4 py-3 border border-border rounded-btn focus:outline-none focus:border-mint"
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
