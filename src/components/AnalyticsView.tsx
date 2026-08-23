import React from 'react';
import { Calling } from '../types';
import { calculateTenure, formatDateForDisplay } from '../utils/tenure';
import { 
  BarChart3, 
  Clock, 
  UserX, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface AnalyticsViewProps {
  callings: Calling[];
  onSelectCalling: (calling: Calling) => void;
  onProposeForCalling: (calling: Calling) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  callings,
  onSelectCalling,
  onProposeForCalling,
}) => {
  // Org breakdown calculations
  const orgStatsMap = React.useMemo(() => {
    const map = new Map<string, { total: number; vacant: number }>();
    callings.forEach(c => {
      const current = map.get(c.organization) || { total: 0, vacant: 0 };
      current.total += 1;
      if (c.isVacant) current.vacant += 1;
      map.set(c.organization, current);
    });
    return Array.from(map.entries()).map(([org, stats]) => ({
      organization: org,
      total: stats.total,
      vacant: stats.vacant,
      filled: stats.total - stats.vacant,
      vacantPct: Math.round((stats.vacant / stats.total) * 100),
    })).sort((a, b) => b.vacant - a.vacant);
  }, [callings]);

  // Tenure Breakdown
  const tenureBreakdown = React.useMemo(() => {
    let under6mos = 0;
    let mos6To24 = 0;
    let yrs2To3 = 0;
    let over3yrs = 0;

    const longServingList: Array<{ calling: Calling; tenure: ReturnType<typeof calculateTenure> }> = [];

    callings.forEach(c => {
      if (!c.isVacant && c.sustainedDate) {
        const tenure = calculateTenure(c.sustainedDate);
        if (tenure.totalMonths < 6) under6mos++;
        else if (tenure.totalMonths < 24) mos6To24++;
        else if (tenure.totalMonths < 36) {
          yrs2To3++;
          longServingList.push({ calling: c, tenure });
        } else {
          over3yrs++;
          longServingList.push({ calling: c, tenure });
        }
      }
    });

    longServingList.sort((a, b) => b.tenure.totalMonths - a.tenure.totalMonths);

    return {
      under6mos,
      mos6To24,
      yrs2To3,
      over3yrs,
      longServingList,
    };
  }, [callings]);

  // Needs setting apart list
  const needsSetApartList = React.useMemo(() => {
    return callings.filter(c => !c.isVacant && !c.setApart);
  }, [callings]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Ward Calling Analytics & Tenure Review</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key insights on vacancy distribution across organizations and tenure monitoring for bishopric review.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Organization Vacancy Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <UserX className="w-4 h-4 text-amber-600" />
              <span>Vacancies by Organization</span>
            </h3>
            <span className="text-xs text-slate-500">Vacant / Total</span>
          </div>

          <div className="space-y-3">
            {orgStatsMap.map((item) => (
              <div key={item.organization} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.organization}</span>
                  <span className="text-slate-600 font-medium">
                    <strong className="text-amber-600">{item.vacant} vacant</strong> / {item.total} positions ({item.vacantPct}%)
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  {/* Filled Portion */}
                  <div 
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${100 - item.vacantPct}%` }}
                    title={`Filled: ${item.filled}`}
                  />
                  {/* Vacant Portion */}
                  <div 
                    className="bg-amber-400 h-full" 
                    style={{ width: `${item.vacantPct}%` }}
                    title={`Vacant: ${item.vacant}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tenure Distribution Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Length of Service Distribution</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950">
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 block">0 - 6 Months</span>
              <span className="text-2xl font-bold mt-1 block">{tenureBreakdown.under6mos}</span>
              <span className="text-[11px] text-emerald-800">Recently called</span>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-950">
              <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 block">6 - 24 Months</span>
              <span className="text-2xl font-bold mt-1 block">{tenureBreakdown.mos6To24}</span>
              <span className="text-[11px] text-blue-800">Standard serving term</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-950">
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 block">2 - 3 Years</span>
              <span className="text-2xl font-bold mt-1 block">{tenureBreakdown.yrs2To3}</span>
              <span className="text-[11px] text-amber-800">Suggested for review</span>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-950">
              <span className="text-[10px] uppercase tracking-wider font-bold text-purple-700 block">3+ Years</span>
              <span className="text-2xl font-bold mt-1 block">{tenureBreakdown.over3yrs}</span>
              <span className="text-[11px] text-purple-800">Long service period</span>
            </div>
          </div>

          {/* Setting Apart Pending Box */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                <span>Awaiting Setting Apart ({needsSetApartList.length})</span>
              </span>
            </div>
            {needsSetApartList.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {needsSetApartList.map(c => (
                  <div key={c.id} className="text-xs bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 block">{c.memberName}</span>
                      <span className="text-[10px] text-slate-500">{c.title} • {c.organization}</span>
                    </div>
                    <button
                      onClick={() => onSelectCalling(c)}
                      className="text-[10px] text-blue-600 font-semibold hover:underline"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-700 font-medium">All called members are currently set apart!</p>
            )}
          </div>

        </div>

      </div>

      {/* Longest Serving Leaders Review Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Long-Serving Members (&gt; 2 Years Service)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            The handbook suggests reviewing callings periodically. Members serving for over 2 years can be considered for release or reassignment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tenureBreakdown.longServingList.map(({ calling, tenure }) => (
            <div key={calling.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{calling.organization}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    tenure.badgeColor === 'purple' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {tenure.displayText}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-1">{calling.memberName}</h4>
                <p className="text-xs text-slate-600">{calling.title}</p>
                <p className="text-[10px] text-slate-400 mt-1">Sustained: {formatDateForDisplay(calling.sustainedDate)}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => onSelectCalling(calling)}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Details
                </button>
                <button
                  onClick={() => onProposeForCalling(calling)}
                  className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium px-2.5 py-1 rounded transition-colors"
                >
                  Recommend Release
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
