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
  Moon,
  Sun,
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
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
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
  isDarkMode = false,
  onToggleDarkMode,
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sticky, Full-Height Modern Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex flex-col transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen shrink-0 shadow-xs
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* 1. TOP HEADER BRAND LOGO */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 shadow-xs flex items-center justify-center bg-blue-600">
              <img 
                src="https://pub-5497f73b6290403fb534fbb3f47ef636.r2.dev/root/Masagana%202nd%20192x192.svg" 
                alt="Masagana 2nd Ward Logo" 
                className="w-full h-full object-cover scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight block leading-tight">
                Masagana 2nd Ward
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block leading-tight mt-0.5">
                Calling Approvals
              </span>
            </div>
          </div>

          {/* Close button for mobile menu */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. MIDDLE SCROLLABLE NAVIGATION AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Main Views Navigation */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 flex items-center justify-between">
              <span>Main Navigation</span>
              <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </div>

            <nav className="space-y-1">
              
              <button
                onClick={() => handleNavClick('org_chart')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'org_chart' && selectedOrg === 'All Organizations'
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-4 h-4" />
                  <span>Full Directory</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'org_chart' && selectedOrg === 'All Organizations'
                    ? 'bg-slate-800 dark:bg-blue-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {metrics.totalCallings}
                </span>
              </button>

              <button
                onClick={() => handleNavClick('needs_approval')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'needs_approval'
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileCheck2 className="w-4 h-4 text-blue-500" />
                  <span>Needs Approval</span>
                </div>
                {metrics.pendingApprovalsCount > 0 && (
                  <span className="bg-blue-600 dark:bg-blue-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {metrics.pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('needs_set_apart')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'needs_set_apart'
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-purple-500" />
                  <span>Needs Set Apart</span>
                </div>
                {metrics.needsSetApartCount > 0 && (
                  <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/80">
                    {metrics.needsSetApartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('consider_review')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'consider_review'
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Consider Review</span>
                </div>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px] px-2 py-0.5 rounded-full">
                  {metrics.longTenureCount + metrics.vacantCount}
                </span>
              </button>

              <button
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2 flex items-center justify-between">
              <span>Organizations</span>
              <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
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
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-2">{org}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                      isSelected ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

        </div>

        {/* 3. BOTTOM ACCOUNT PROFILE & SETTINGS FOOTER */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
          
          {/* Night Mode / Light Mode Setting Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-2xs"
            >
              <div className="flex items-center space-x-2">
                {isDarkMode ? (
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{isDarkMode ? 'Night Mode' : 'Light Mode'}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                {isDarkMode ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* Cloud Database Sync Status Pill */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-slate-850 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/80 text-[11px]">
            <div className="flex items-center space-x-1.5">
              {syncStatus === 'connected' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">Cloud Live Sync</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Syncing to Cloud...</span>
                </>
              )}
              {syncStatus === 'connecting' && (
                <>
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Connecting Cloud...</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-semibold text-rose-700 dark:text-rose-300">Offline / Local Mode</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Firestore</span>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {currentUser.name.charAt(0)}
              </div>

              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block leading-none mt-0.5">
                  {currentUser.calling}
                </span>
              </div>
            </div>

            {/* Quick Reset Data Button */}
            <button
              onClick={onResetData}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Reset Ward Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Logout Action Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-950/70 border border-rose-200/60 dark:border-rose-800/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

        </div>

      </aside>
    </>
  );
};
