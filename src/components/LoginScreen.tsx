import React, { useState } from 'react';
import { AuthUser } from '../types';
import { FIXED_USERS, SUPER_ADMIN_PASSWORD } from '../data/initialData';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  UserCheck, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  Shield
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'leader' | 'superadmin'>('leader');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick One-Click Auto-Fill helper
  const handleQuickSelect = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('@Masagana2nd');
    setErrorMsg(null);
  };

  const handleLeaderLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const foundUser = FIXED_USERS.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPass } = foundUser;
      onLoginSuccess(userWithoutPass);
    } else {
      setErrorMsg('Invalid email address or password. Please check credentials.');
    }
  };

  const handleSuperAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (superAdminPassword === SUPER_ADMIN_PASSWORD) {
      const superAdminUser: AuthUser = {
        id: 'usr-superadmin',
        name: 'Super Admin',
        calling: 'System Administrator',
        email: 'admin@masagana2nd.org',
        role: 'super_admin',
        isSuperAdmin: true,
      };
      onLoginSuccess(superAdminUser);
    } else {
      setErrorMsg('Incorrect Super Admin password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Blur */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header Header Banner */}
        <div className="bg-slate-950 p-6 text-white text-center border-b border-slate-800">
          <div className="h-14 w-14 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center text-white shadow-lg ring-4 ring-blue-500/30 mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-950/80 border border-blue-800 px-2.5 py-0.5 rounded-full inline-block mb-1">
            Official Ward System
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">Masagana 2nd Ward</h1>
          <p className="text-xs text-slate-400 mt-0.5">Antipolo Philippines Stake • Calling Approvals Portal</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => { setActiveTab('leader'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center space-x-2 border-b-2 ${
              activeTab === 'leader'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Leader Login</span>
          </button>

          <button
            onClick={() => { setActiveTab('superadmin'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center space-x-2 border-b-2 ${
              activeTab === 'superadmin'
                ? 'border-amber-600 text-amber-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Super Admin</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="m-4 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          
          {activeTab === 'leader' ? (
            <form onSubmit={handleLeaderLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Leader Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. fcreyes315@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <span>Sign In to Calling System</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Select Buttons */}
              <div className="pt-4 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                  Select Quick Leader Login
                </span>
                <div className="space-y-1.5">
                  {FIXED_USERS.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickSelect(user.email)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                        email.toLowerCase() === user.email.toLowerCase()
                          ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-300 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-500">{user.calling} • {user.email}</div>
                      </div>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 shrink-0">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </form>
          ) : (
            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Super Admin Mode</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Bypasses standard bishopric login checks. Grants full system override and instant sign-off authority.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Super Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Enter Super Admin Password"
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Login as Super Admin</span>
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
          Masagana 2nd Ward • 3-Point Approval System
        </div>

      </div>
    </div>
  );
};
