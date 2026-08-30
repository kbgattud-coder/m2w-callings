import React from 'react';
import { 
  Building2, 
  Menu, 
  X, 
  Loader2,
  Moon,
  Sun
} from 'lucide-react';

interface NavbarProps {
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  syncStatus?: 'connecting' | 'connected' | 'syncing' | 'error';
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  syncStatus = 'connected',
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  return (
    <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-2xs px-3 sm:px-4 py-2.5 sm:py-3 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full overflow-hidden shrink-0 shadow-2xs flex items-center justify-center bg-blue-600">
              <img 
                src="https://pub-5497f73b6290403fb534fbb3f47ef636.r2.dev/root/Masagana%202nd%20192x192.svg" 
                alt="Masagana 2nd Ward Logo" 
                className="w-full h-full object-cover scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Masagana 2nd Ward
            </span>
          </div>
        </div>

        {/* Right Action: Night Mode Toggle + Sync Status Badge */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Night Mode"}
              aria-label="Toggle Night Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          {/* Sync Status Badge */}
          <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {syncStatus === 'connected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-700 dark:text-slate-300 font-medium hidden sm:inline">Synced</span>
              </>
            )}
            {syncStatus === 'syncing' && (
              <>
                <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                <span className="text-blue-700 dark:text-blue-300 font-medium hidden sm:inline">Syncing</span>
              </>
            )}
            {syncStatus === 'connecting' && (
              <>
                <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                <span className="text-blue-700 dark:text-blue-300 font-medium hidden sm:inline">Connecting</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-700 dark:text-rose-300 font-medium hidden sm:inline">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

