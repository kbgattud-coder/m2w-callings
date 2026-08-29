import React from 'react';
import { ViewTab, AuthUser } from '../types';
import { 
  Building2, 
  FileCheck2, 
  AlertCircle, 
  Clock, 
  BarChart3, 
  Filter, 
  Layers, 
  RotateCcw, 
  LogOut, 
  X,
  Cloud,
  CloudCheck,
  CloudAlert,
  Loader2
} from 'lucide-react';

export const ORGANIZATIONS = [
  'All Organizations',
  'Bishopric',
  'Elders Quorum',
  'Relief Society',
  'Aaronic Priesthood',
  'Young Women',
  'Sunday School',
  'Primary',
  'Ward Missionaries',
  'Temple & Family History',
  'Young Single Adult',
  'Other Callings'
];

interface SidebarProps {
  currentUser: AuthUser;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  selectedOrg: string;
  onSelectOrg: (org: string) => void;
  metrics: {
    totalCallings: number;
    pendingApprovalsCount: number;
    needsSetApartCount: number;
    longTenureCount: number;
    vacantCount: number;
  };
  callingCountByOrg: Record<string, number>;
  syncStatus?: 'connecting' | 'connected' | 'syncing' | 'error';
  onResetData: () => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  selectedOrg,
  onSelectOrg,
  metrics,
  callingCountByOrg,
  syncStatus = 'connected',
  onResetData,
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {

  const handleNavClick = (tab: ViewTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const handleOrgClick = (org: string) => {
    onSelectOrg(org);
    onTabChange('org_chart');
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sticky, Full-Height Modern Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 text-slate-700 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen shrink-0 shadow-xs
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* 1. TOP HEADER BRAND LOGO */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>

            <div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight block leading-tight">
                Masagana 2nd Ward
              </span>
              <span className="text-[10px] text-slate-400 font-medium block leading-tight mt-0.5">
                Calling Approvals
              </span>
            </div>
          </div>

          {/* Close button for mobile menu */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. MIDDLE SCROLLABLE NAVIGATION AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Main Views Navigation */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
              <span>Main Navigation</span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <nav className="space-y-1">
              
              <button
                onClick={() => handleNavClick('org_chart')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'org_chart' && selectedOrg === 'All Organizations'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-4 h-4" />
                  <span>Full Directory</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'org_chart' && selectedOrg === 'All Organizations'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {metrics.totalCallings}
                </span>
              </button>

              <button
                onClick={() => handleNavClick('needs_approval')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'needs_approval'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileCheck2 className="w-4 h-4 text-blue-500" />
                  <span>Needs Approval</span>
                </div>
                {metrics.pendingApprovalsCount > 0 && (
                  <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {metrics.pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('needs_set_apart')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'needs_set_apart'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-purple-500" />
                  <span>Needs Set Apart</span>
                </div>
                {metrics.needsSetApartCount > 0 && (
                  <span className="bg-purple-100 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {metrics.needsSetApartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('consider_review')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'consider_review'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Consider Review</span>
                </div>
                <span className="bg-slate-100 text-slate-600 font-medium text-[10px] px-2 py-0.5 rounded-full">
                  {metrics.longTenureCount + metrics.vacantCount}
                </span>
              </button>

              <button
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span>Tenure Analytics</span>
                </div>
              </button>

            </nav>
          </div>

          {/* Organizations Filter Section */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
              <span>Organizations</span>
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <nav className="space-y-0.5">
              {ORGANIZATIONS.map((org) => {
                const isSelected = activeTab === 'org_chart' && selectedOrg === org;
                const count = org === 'All Organizations' 
                  ? metrics.totalCallings 
                  : (callingCountByOrg[org] || 0);

                return (
                  <button
                    key={org}
                    onClick={() => handleOrgClick(org)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200/80'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <span className="truncate pr-2">{org}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                      isSelected ? 'bg-slate-200 text-slate-800' : 'text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

        </div>

        {/* 3. BOTTOM ACCOUNT PROFILE & ACTION FOOTER */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-200/80 space-y-2">
          
          {/* Cloud Database Sync Status Pill */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/80 border border-slate-200/70 text-[11px]">
            <div className="flex items-center space-x-1.5">
              {syncStatus === 'connected' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-emerald-800">Cloud Live Sync</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  <span className="font-semibold text-blue-700">Syncing to Cloud...</span>
                </>
              )}
              {syncStatus === 'connecting' && (
                <>
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  <span className="font-semibold text-blue-700">Connecting Cloud...</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-semibold text-rose-700">Offline / Local Mode</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Firestore</span>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {currentUser.name.charAt(0)}
              </div>

              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 truncate block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate block leading-none mt-0.5">
                  {currentUser.calling}
                </span>
              </div>
            </div>

            {/* Quick Reset Data Button */}
            <button
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Reset Ward Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Logout Action Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

        </div>

      </aside>
    </>
  );
};
