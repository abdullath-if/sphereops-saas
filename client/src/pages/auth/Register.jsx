import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Phone, FolderKanban, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('manager');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        position,
        phone,
        role,
      });
      navigate('/');
    } catch (err) {
      // Handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
            <FolderKanban className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          Create SphereOps Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Get started with modern workspace management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              required
              icon={User}
              placeholder="Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Work Email"
              type="email"
              required
              icon={Mail}
              placeholder="sarah@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Job Title / Position"
                icon={Briefcase}
                placeholder="Product Lead"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <Input
              label="Phone Number (Optional)"
              icon={Phone}
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              Register & Continue
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
