import React from 'react';
import { 
  FileCheck2, 
  Building2, 
  AlertCircle, 
  Clock, 
  UserX,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowUpRight,
  Calendar
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
  const filledCount = totalCallings - vacantCount;
  const filledPercentage = totalCallings > 0 ? Math.round((filledCount / totalCallings) * 100) : 0;

  // Format today's date or current ward date
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  return (
    <div className="space-y-5 mb-6">
      
      {/* Blue Gradient Ward Hero Banner - Exactly Matching Reference Design */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 text-white p-6 sm:p-7 shadow-lg shadow-blue-500/20">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-sky-300/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-xs border border-white/30 text-white font-bold text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full mb-3 shadow-2xs">
              <span>Sacrament Meeting</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Masagana 2nd Ward
            </h1>

            <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-blue-100/90 mt-1">
              Antipolo Philippines Stake
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-md border border-white/25 px-4 py-2.5 rounded-2xl text-white self-start md:self-auto shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-100 shrink-0" />
            <span className="text-xs font-bold tracking-wide uppercase">
              {currentDateFormatted}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/20 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-100 block mb-0.5">
            Opening, Welcome & Acknowledgements
          </span>
          <p className="text-sm font-semibold text-white">
            Good morning, {userName} • Stay on top of ward callings, monitor approvals, and track sustained members.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid - Matching Reference Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: VIBRANT ROYAL BLUE HERO CARD (Pending Approvals) */}
        <div 
          onClick={() => onFilterClick && onFilterClick('has_proposal')}
          className="bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 text-white rounded-2xl p-5 shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Subtle background blur circle */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 tracking-wide">
                Pending Approvals
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {pendingApprovalsCount}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-blue-100">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-blue-200" />
              <span>3-Point Sign-Off</span>
            </span>
            <span className="text-[11px] font-medium hover:underline flex items-center">
              View Queue <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Total Callings & Filling Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Callings
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalCallings}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center space-x-1">
              <span>↑ {filledPercentage}% Filled</span>
            </span>
            <span className="text-[11px] text-slate-400">{vacantCount} Vacant</span>
          </div>
        </div>

        {/* Card 3: Needs Setting Apart */}
        <div 
          onClick={() => onFilterClick && onFilterClick('needs_set_apart')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-purple-300 transition-all"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Needs Setting Apart
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {needsSetApartCount}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-purple-700 bg-purple-50 font-bold px-2 py-0.5 rounded-full text-[11px]">
              Awaiting Bishopric
            </span>
            <span className="text-[11px] font-medium text-slate-400">Action Needed</span>
          </div>
        </div>

        {/* Card 4: Vacant / Consider for Review */}
        <div 
          onClick={() => onFilterClick && onFilterClick('long_tenure')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition-all"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Serving 3+ Years
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {longTenureCount}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded-full text-[11px]">
              Tenure Review
            </span>
            <span className="text-[11px] text-slate-400">{vacantCount} Vacant</span>
          </div>
        </div>

      </div>

    </div>
  );
};
