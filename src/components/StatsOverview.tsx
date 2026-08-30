import React, { useState } from 'react';
import { 
  FileCheck2, 
  Building2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  Calendar,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface StatsOverviewProps {
  userName?: string;
  totalCallings: number;
  vacantCount: number;
  pendingApprovalsCount: number;
  needsSetApartCount: number;
  longTenureCount: number;
  onFilterClick?: (status: 'vacant' | 'needs_set_apart' | 'long_tenure' | 'has_proposal') => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  userName = 'Leader',
  totalCallings,
  vacantCount,
  pendingApprovalsCount,
  needsSetApartCount,
  longTenureCount,
  onFilterClick,
}) => {
  // Collapsed by default on all devices (desktop, tablet, mobile)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('masagana_stats_collapsed_v1') : null;
    if (saved !== null) {
      return saved === 'true';
    }
    return true; // Default collapsed on desktop and mobile
  });

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('masagana_stats_collapsed_v1', String(next));
      }
      return next;
    });
  };

  const filledCount = totalCallings - vacantCount;
  const filledPercentage = totalCallings > 0 ? Math.round((filledCount / totalCallings) * 100) : 0;

  // Format today's date or current ward date
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
      
      {/* Blue Gradient Ward Hero Banner - Responsive & Dark Mode Enhanced */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 text-white p-3.5 sm:p-5 lg:p-6 shadow-md shadow-blue-500/15 dark:shadow-blue-950/40 border border-blue-400/30 dark:border-blue-500/30">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-36 sm:w-48 h-36 sm:h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-24 sm:w-32 h-24 sm:h-32 bg-sky-300/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5 sm:mb-2">
              <span className="inline-flex items-center bg-white/20 dark:bg-white/15 backdrop-blur-xs border border-white/30 dark:border-white/20 text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                Sacrament Meeting
              </span>
              <span className="text-[10px] sm:text-xs font-medium tracking-wide text-blue-100/90 sm:hidden">
                • {currentDateFormatted}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Masagana 2nd Ward
            </h1>

            <p className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-blue-100/90 mt-0.5">
              Antipolo Philippines Stake
            </p>
          </div>

          <div className="hidden sm:flex items-center space-x-2 bg-white/15 dark:bg-white/10 backdrop-blur-md border border-white/25 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-white self-start sm:self-auto shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-100 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold tracking-wide uppercase">
              {currentDateFormatted}
            </span>
          </div>
        </div>

        {/* Banner Footer Note + Quick Collapse Toggle (Desktop & Mobile) */}
        <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/20 flex items-center justify-between relative z-10 text-xs">
          <div className="flex items-center space-x-2 truncate max-w-[70%] sm:max-w-[80%]">
            <p className="text-[11px] sm:text-xs font-medium text-white truncate">
              Good morning, <span className="font-bold">{userName}</span>
            </p>
            {isCollapsed && (
              <span className="hidden sm:inline-flex items-center space-x-1.5 text-[10px] bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full font-bold text-white shadow-2xs">
                <span>{pendingApprovalsCount} Approvals Pending</span>
                <span>•</span>
                <span>{vacantCount} Vacant</span>
                <span>•</span>
                <span>{needsSetApartCount} Needs Set Apart</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleCollapse}
            className="text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ml-2 shadow-2xs border border-white/20"
            title="Toggle stats metrics cards visibility"
          >
            <span>{isCollapsed ? 'Show Metrics' : 'Hide Metrics'}</span>
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mini quick-stats strip on desktop & mobile when collapsed */}
      {isCollapsed && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-xs">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-wrap gap-y-1">
            <button
              type="button"
              onClick={() => onFilterClick && onFilterClick('has_proposal')}
              className="flex items-center space-x-1.5 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 inline-block" />
              <span>{pendingApprovalsCount} Approvals Pending</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => onFilterClick && onFilterClick('vacant')}
              className="flex items-center space-x-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 inline-block" />
              <span>{vacantCount} Vacant Callings</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => onFilterClick && onFilterClick('needs_set_apart')}
              className="flex items-center space-x-1.5 hover:text-purple-600 dark:hover:text-purple-400 font-semibold text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 inline-block" />
              <span>{needsSetApartCount} Needs Set Apart</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => onFilterClick && onFilterClick('long_tenure')}
              className="flex items-center space-x-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 inline-block" />
              <span>{longTenureCount} Serving 3+ Yrs</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/80">
              {filledPercentage}% Filled ({filledCount}/{totalCallings})
            </span>
          </div>
        </div>
      )}

      {/* Metric Cards Grid - Compact 2x2 on Mobile/Tablet, 4-col on Desktop when expanded */}
      {!isCollapsed && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          
          {/* Card 1: VIBRANT ROYAL BLUE HERO CARD (Pending Approvals) */}
          <div 
            onClick={() => onFilterClick && onFilterClick('has_proposal')}
            className="bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 dark:from-blue-600 dark:via-blue-700 dark:to-indigo-800 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm sm:shadow-md shadow-blue-500/20 dark:shadow-blue-950/40 border border-blue-400/30 dark:border-blue-500/40 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex flex-col justify-between relative overflow-hidden group"
          >
            {/* Subtle background blur circle */}
            <div className="absolute -right-3 -bottom-3 w-16 sm:w-20 h-16 sm:h-20 bg-white/10 rounded-full blur-lg pointer-events-none" />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-blue-100 tracking-tight line-clamp-1">
                  Pending Approvals
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 ml-1">
                  <FileCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="mt-1.5 sm:mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
                  {pendingApprovalsCount}
                </span>
              </div>
            </div>

            <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-white/20 flex items-center justify-between text-[10px] sm:text-xs text-blue-100">
              <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-medium flex items-center space-x-1 truncate">
                <TrendingUp className="w-2.5 h-2.5 text-blue-200 shrink-0" />
                <span className="truncate">3-Point Sign-Off</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium hidden sm:flex items-center ml-1 group-hover:underline">
                View <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Total Callings & Filling Rate */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-slate-200/90 dark:border-slate-700/80 shadow-xs dark:shadow-slate-950/40 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight line-clamp-1">
                  Total Callings
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 ml-1">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="mt-1.5 sm:mt-3 flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {totalCallings}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  ({filledCount} filled)
                </span>
              </div>
            </div>

            <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/80 font-bold px-1.5 py-0.5 rounded-md text-[10px] truncate">
                ↑ {filledPercentage}% Filled
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate ml-1">
                {vacantCount} Vacant
              </span>
            </div>
          </div>

          {/* Card 3: Needs Setting Apart */}
          <div 
            onClick={() => onFilterClick && onFilterClick('needs_set_apart')}
            className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-slate-200/90 dark:border-slate-700/80 shadow-xs dark:shadow-slate-950/40 flex flex-col justify-between cursor-pointer hover:border-purple-300 dark:hover:border-purple-500/60 active:scale-[0.99] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight line-clamp-1">
                  Needs Setting Apart
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0 ml-1">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="mt-1.5 sm:mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {needsSetApartCount}
                </span>
              </div>
            </div>

            <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 border border-purple-200/60 dark:border-purple-800/80 font-bold px-1.5 py-0.5 rounded-md text-[10px] truncate">
                Awaiting Bishopric
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-400 hidden sm:inline ml-1 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Action
              </span>
            </div>
          </div>

          {/* Card 4: Serving 3+ Years / Tenure Review */}
          <div 
            onClick={() => onFilterClick && onFilterClick('long_tenure')}
            className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-slate-200/90 dark:border-slate-700/80 shadow-xs dark:shadow-slate-950/40 flex flex-col justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/60 active:scale-[0.99] transition-all group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight line-clamp-1">
                  Serving 3+ Years
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-lg sm:rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0 ml-1">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="mt-1.5 sm:mt-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {longTenureCount}
                </span>
              </div>
            </div>

            <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/80 font-bold px-1.5 py-0.5 rounded-md text-[10px] truncate">
                Tenure Review
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate ml-1">
                {vacantCount} Vacant
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
