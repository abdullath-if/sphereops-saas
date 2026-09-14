import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Building2,
  Shield,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('general');

  // General profile state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [position, setPosition] = useState(user?.position || '');
  const [skills, setSkills] = useState(user?.skills ? user.skills.join(', ') : '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name,
        phone,
        position,
        skills,
        avatar,
      });
    } catch (err) {
      // Handled in context
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Handled in context
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your personal details, credentials, and notification settings.
        </p>
      </div>

      {/* Profile Overview Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-100 shadow"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white font-extrabold text-xl flex items-center justify-center shadow">
            {user?.name?.charAt(0) || 'U'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-900 truncate">{user?.name}</h2>
            <Badge variant={user?.role} size="sm">
              {user?.role}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {user?.position} • {user?.department?.name || 'General Department'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'general'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          General Information
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'security'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Security & Password
        </button>
      </div>

      {/* General Information Form */}
      {activeTab === 'general' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                icon={User}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email Address"
                disabled
                icon={Mail}
                value={user?.email || ''}
                helperText="Email cannot be changed directly."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Job Title / Position"
                icon={Briefcase}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
              <Input
                label="Phone Number"
                icon={Phone}
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Input
              label="Avatar Image URL"
              placeholder="https://images.unsplash.com/..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              helperText="Paste a publicly accessible photo URL for your profile."
            />

            <Input
              label="Skills & Expertise (Comma separated)"
              placeholder="React, Node.js, AWS, Kubernetes"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                icon={Save}
                loading={savingProfile}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Security & Password Form */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <Input
              label="Current Password"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <Input
              label="New Password"
              type="password"
              required
              icon={Lock}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                icon={Lock}
                loading={savingPassword}
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
