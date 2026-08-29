import React, { useState } from 'react';
import { AuthUser } from '../types';
import { FIXED_USERS, SUPER_ADMIN_PASSWORD } from '../data/initialData';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  Shield,
  User,
  Crown,
  ChevronRight
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'leader' | 'superadmin'>('leader');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Direct 1-Click Leader Login
  const handleQuickLogin = (user: typeof FIXED_USERS[0]) => {
    const { password: _, ...userWithoutPass } = user;
    onLoginSuccess(userWithoutPass);
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
      setErrorMsg('Incorrect Super Admin password. Please try again.');
    }
  };

  // Helper styling for each bishopric leader card
  const getLeaderVisuals = (role: string) => {
    switch (role) {
      case 'bishop':
        return {
          badge: 'Bishopric Presiding',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          avatarBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white',
          borderHover: 'hover:border-blue-500 hover:shadow-md hover:bg-blue-50/40',
          ringAccent: 'group-hover:ring-2 group-hover:ring-blue-400/50',
          icon: Crown,
        };
      case 'first_counselor':
        return {
          badge: '1st Counselor',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          avatarBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
          borderHover: 'hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/40',
          ringAccent: 'group-hover:ring-2 group-hover:ring-emerald-400/50',
          icon: ShieldCheck,
        };
      case 'second_counselor':
        return {
          badge: '2nd Counselor',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          avatarBg: 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white',
          borderHover: 'hover:border-purple-500 hover:shadow-md hover:bg-purple-50/40',
          ringAccent: 'group-hover:ring-2 group-hover:ring-purple-400/50',
          icon: ShieldCheck,
        };
      default:
        return {
          badge: 'Leader',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
          avatarBg: 'bg-slate-700 text-white',
          borderHover: 'hover:border-slate-500 hover:shadow-md',
          ringAccent: 'group-hover:ring-2 group-hover:ring-slate-400/50',
          icon: User,
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Blur */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header Banner */}
        <div className="bg-slate-950 p-6 text-white text-center border-b border-slate-800">
          <div className="h-16 w-16 rounded-full bg-blue-600 mx-auto flex items-center justify-center shadow-lg ring-4 ring-blue-500/30 mb-3 overflow-hidden">
            <img 
              src="https://pub-5497f73b6290403fb534fbb3f47ef636.r2.dev/root/Masagana%202nd%20192x192.svg" 
              alt="Masagana 2nd Ward Logo" 
              className="w-full h-full object-cover scale-105"
              referrerPolicy="no-referrer"
            />
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
            id="tab-leader-login"
            onClick={() => { setActiveTab('leader'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center space-x-2 border-b-2 ${
              activeTab === 'leader'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Quick Leader Login</span>
          </button>

          <button
            id="tab-superadmin-login"
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

        {/* Login Body */}
        <div className="p-6">
          
          {activeTab === 'leader' ? (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-sm font-bold text-slate-900">Select Leader to Enter</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on your name below for 1-click access to the calling recommendations and 3-point approval system.
                </p>
              </div>

              {/* 3 Quick Leader Cards for Francis, Jim, and Alfred */}
              <div className="space-y-3">
                {FIXED_USERS.map((user) => {
                  const visuals = getLeaderVisuals(user.role);
                  const IconComponent = visuals.icon;

                  return (
                    <button
                      key={user.id}
                      id={`btn-login-${user.id}`}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className={`group w-full text-left p-3.5 rounded-xl border border-slate-200 bg-white transition-all duration-150 flex items-center justify-between shadow-2xs ${visuals.borderHover}`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Avatar / Icon Badge */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${visuals.avatarBg} ${visuals.ringAccent}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>

                        {/* Leader Info */}
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors block">
                            {user.name}
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {user.calling}
                          </p>
                        </div>
                      </div>

                      {/* Action Chevron Pill */}
                      <div className="shrink-0 ml-2">
                        <div className="flex items-center space-x-1 text-xs font-semibold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-2.5 py-1.5 rounded-lg border border-blue-200/60 group-hover:border-blue-600 transition-all">
                          <span>Login</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 text-center">
                <span className="text-[11px] text-slate-400">
                  Each bishopric sign-off is automatically recorded under the active leader.
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Super Admin Authorization</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Grants complete administrative control, unanimous 3-point approval overrides, and full calling management.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Super Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-superadmin-password"
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
                id="btn-superadmin-submit"
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Login as Super Admin</span>
                <ArrowRight className="w-4 h-4" />
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
