import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, FolderKanban, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Error is toasted in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
            <FolderKanban className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          SphereOps
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enterprise Employee & Project Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Work Email"
              type="email"
              required
              icon={Mail}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 text-center mb-3">
              Quick Demo Logins (Click to autofill)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@company.com')}
                className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager.sarah@company.com')}
                className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('marcus.v@company.com')}
                className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                Employee
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Need a new company workspace?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
