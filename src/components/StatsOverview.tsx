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
  ArrowUpRight
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

  return (
    <div className="space-y-5 mb-6">
      
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, {userName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Stay on top of ward callings, monitor approvals, and track sustained members.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid - Matching Reference Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: VIBRANT CORAL / ORANGE HERO CARD (Pending Approvals) */}
        <div 
          onClick={() => onFilterClick && onFilterClick('has_proposal')}
          className="bg-gradient-to-br from-orange-500 via-rose-500 to-rose-600 text-white rounded-2xl p-5 shadow-lg shadow-orange-500/20 cursor-pointer hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Subtle background blur circle */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-100/90 tracking-wide">
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

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-orange-100">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-orange-200" />
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
