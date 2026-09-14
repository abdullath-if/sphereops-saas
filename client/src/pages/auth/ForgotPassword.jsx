import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      showToast('Reset instructions have been dispatched to your email.', 'success');
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
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Forgot Password</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          {submitted ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs leading-relaxed border border-emerald-200">
              Check your inbox! We've sent a link to <strong>{email}</strong>. Follow the instructions
              to reset your password.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Work Email"
                type="email"
                required
                icon={Mail}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
                icon={Send}
                iconPosition="right"
              >
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
