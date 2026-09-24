import { useState } from 'react';
import {
  Wallet,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await api.login(email, password);
      } else {
        res = await api.register(name, email, password);
      }

      if (res && res.user) {
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-3xl shadow-2xl border border-[#E6E6FA]/80 dark:border-dark-border overflow-hidden transition-all">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-[#E6E6FA]/60 via-[#FCE4EC]/40 to-[#E0F4F1]/60 dark:from-[#E6E6FA]/10 dark:via-[#FCE4EC]/10 dark:to-[#E0F4F1]/10 p-8 text-center border-b border-[#E6E6FA]/40 dark:border-dark-border">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-dark-card shadow-md mx-auto flex items-center justify-center text-[#4A4556] dark:text-dark-text mb-3">
            <Wallet size={28} className="text-[#574C78] dark:text-purple-300" />
          </div>
          <h2 className="text-2xl font-black text-[#4A4556] dark:text-dark-text tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-[#9B93A9] dark:text-dark-muted mt-1 font-medium">
            {isLogin
              ? 'Sign in to access your personal MongoDB cloud spending vault'
              : 'Join SpendWise to keep your private finances synced across devices'}
          </p>

          {/* Toggle pill */}
          <div className="flex bg-white/70 dark:bg-dark-bg/60 p-1 rounded-2xl mt-5 border border-[#E6E6FA]/60 dark:border-dark-border max-w-xs mx-auto shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                isLogin
                  ? 'bg-[#574C78] text-white shadow-sm'
                  : 'text-[#9B93A9] hover:text-[#4A4556] dark:hover:text-dark-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                !isLogin
                  ? 'bg-[#574C78] text-white shadow-sm'
                  : 'text-[#9B93A9] hover:text-[#4A4556] dark:hover:text-dark-text'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-[#4A4556] dark:text-dark-text mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-3.5 text-[#9B93A9]" />
                <input
                  type="text"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E6E6FA] dark:border-dark-border bg-[#FDFBF7] dark:bg-dark-bg text-sm text-[#4A4556] dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-[#574C78]"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#4A4556] dark:text-dark-text mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-[#9B93A9]" />
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E6E6FA] dark:border-dark-border bg-[#FDFBF7] dark:bg-dark-bg text-sm text-[#4A4556] dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-[#574C78]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A4556] dark:text-dark-text mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-[#9B93A9]" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E6E6FA] dark:border-dark-border bg-[#FDFBF7] dark:bg-dark-bg text-sm text-[#4A4556] dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-[#574C78]"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-[#4A4556] dark:text-dark-text mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-[#9B93A9]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E6E6FA] dark:border-dark-border bg-[#FDFBF7] dark:bg-dark-bg text-sm text-[#4A4556] dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-[#574C78]"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#574C78] hover:bg-[#463c63] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Sign In to SpendWise' : 'Complete Registration'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#9B93A9] dark:text-dark-muted hover:underline"
            >
              Continue as Guest (Local Offline Mode)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
