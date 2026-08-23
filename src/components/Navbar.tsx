import React from 'react';
import { 
  Building2, 
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isMobileSidebarOpen,
  onToggleMobileSidebar,
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
      </div>
    </header>
  );
};
