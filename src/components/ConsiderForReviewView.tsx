import React, { useState } from 'react';
import { Calling } from '../types';
import { calculateTenure, formatDateForDisplay } from '../utils/tenure';
import { 
  Clock, 
  UserX, 
  PlusCircle, 
  RefreshCw, 
  Search, 
  AlertTriangle,
  Trash2
} from 'lucide-react';

interface ConsiderForReviewViewProps {
  callings: Calling[];
  onProposeForCalling: (calling: Calling) => void;
  onSelectCalling: (calling: Calling) => void;
  onDeleteCalling?: (callingId: string, callingTitle: string) => void;
}

export const ConsiderForReviewView: React.FC<ConsiderForReviewViewProps> = ({
  callings,
  onProposeForCalling,
  onSelectCalling,
  onDeleteCalling,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'vacant' | 'long_tenure'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const reviewCallings = callings.filter(c => {
    const tenure = calculateTenure(c.sustainedDate);
    const isLongTenure = !c.isVacant && tenure.totalMonths >= 36;

    if (!c.isVacant && !isLongTenure) return false;

    if (filterType === 'vacant' && !c.isVacant) return false;
    if (filterType === 'long_tenure' && c.isVacant) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = c.title.toLowerCase().includes(q);
      const matchesOrg = c.organization.toLowerCase().includes(q);
      const matchesMember = c.memberName ? c.memberName.toLowerCase().includes(q) : false;
      return matchesTitle || matchesOrg || matchesMember;
    }

    return true;
  });

  const vacantCount = callings.filter(c => c.isVacant).length;
  const longTenureCount = callings.filter(c => {
    if (c.isVacant) return false;
    const t = calculateTenure(c.sustainedDate);
    return t.totalMonths >= 36;
  }).length;

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Consider for Review</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Vacant positions needing callings and members who have served for 3 or more years.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            All ({vacantCount + longTenureCount})
          </button>
          <button
            onClick={() => setFilterType('vacant')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterType === 'vacant' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Vacant ({vacantCount})
          </button>
          <button
            onClick={() => setFilterType('long_tenure')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterType === 'long_tenure' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Serving 3+ Yrs ({longTenureCount})
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {reviewCallings.map((calling) => {
          const tenure = calculateTenure(calling.sustainedDate);

          return (
            <div
              key={calling.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
                  <span>{calling.organization} • {calling.subOrg}</span>
                  {calling.isVacant ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Vacant
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Serving 3+ Yrs
                    </span>
                  )}
                </div>

                <h3
                  onClick={() => onSelectCalling(calling)}
                  className="font-bold text-slate-900 text-sm hover:text-orange-600 cursor-pointer transition-colors"
                >
                  {calling.title}
                </h3>

                <div className="mt-3">
                  {calling.isVacant ? (
                    <span className="text-xs font-semibold text-amber-700">Vacant Position</span>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-800">
                        <span>{calling.memberName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Serving {tenure.displayText} ({formatDateForDisplay(calling.sustainedDate)})
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                {calling.isVacant ? (
                  <>
                    <button
                      onClick={() => onProposeForCalling(calling)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl transition-colors shadow-2xs flex items-center justify-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Propose Member</span>
                    </button>
                    {onDeleteCalling && (
                      <button
                        type="button"
                        onClick={() => onDeleteCalling(calling.id, calling.title)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                        title="Delete vacant position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => onProposeForCalling(calling)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs py-1.5 px-3 rounded-xl transition-colors border border-slate-200 flex items-center justify-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recommend Release</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {reviewCallings.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Review Items Found</h3>
          <p className="text-xs text-slate-400">There are no vacant callings or long-serving members matching your filter.</p>
        </div>
      )}

    </div>
  );
};
