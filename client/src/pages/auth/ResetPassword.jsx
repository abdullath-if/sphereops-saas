import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      showToast('Password reset successfully! Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Set New Password</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Choose a strong password with at least 6 characters.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
              icon={ArrowRight}
              iconPosition="right"
            >
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
