import React from 'react';
import { 
  Building2, 
  Menu, 
  X,
  Loader2
} from 'lucide-react';

interface NavbarProps {
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  syncStatus?: 'connecting' | 'connected' | 'syncing' | 'error';
}

export const Navbar: React.FC<NavbarProps> = ({
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  syncStatus = 'connected',
}) => {
  return (
    <header className="lg:hidden bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Toggle Menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>

            <span className="text-sm font-bold text-slate-900 tracking-tight">
              Masagana 2nd Ward
            </span>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center space-x-1.5 text-[11px] px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
          {syncStatus === 'connected' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-medium">Cloud Synced</span>
            </>
          )}
          {syncStatus === 'syncing' && (
            <>
              <Loader2 className="w-3 h-3 text-orange-500 animate-spin" />
              <span className="text-orange-700 font-medium">Syncing...</span>
            </>
          )}
          {syncStatus === 'connecting' && (
            <>
              <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
              <span className="text-blue-700 font-medium">Connecting...</span>
            </>
          )}
          {syncStatus === 'error' && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-700 font-medium">Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

