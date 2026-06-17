import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Radio, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      login(data, data.token);
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 px-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
            <Radio size={20} className="text-teal-400" />
          </div>
          <span className="text-3xl font-bold text-slate-900">FieldOps</span>
        </div>
        <p className="text-slate-500 text-sm">
          Offline-first field data collection and monitoring
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your credentials"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all bg-gray-50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <button type="button" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="remember" className="text-sm text-gray-600">
              Remember this device for 30 days
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-xl font-medium text-sm transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-center text-xs text-gray-400">
              Authorized personnel only. Access is logged and monitored for
              compliance and operational precision.
            </p>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
        <button className="hover:text-gray-600">Help Center</button>
        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
        <button className="hover:text-gray-600">Privacy Policy</button>
        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
        <button className="hover:text-gray-600">Status</button>
      </div>
    </div>
  );
};

export default Login;