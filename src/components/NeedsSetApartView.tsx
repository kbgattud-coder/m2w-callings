import React, { useState } from 'react';
import { Calling } from '../types';
import { calculateTenure, formatDateForDisplay } from '../utils/tenure';
import { sortCallings } from '../utils/callingSort';
import { 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Calendar, 
  Clock, 
  UserCheck, 
  RefreshCw
} from 'lucide-react';

interface NeedsSetApartViewProps {
  callings: Calling[];
  onToggleSetApart: (callingId: string) => void;
  onProposeForCalling: (calling: Calling) => void;
  onSelectCalling: (calling: Calling) => void;
}

export const NeedsSetApartView: React.FC<NeedsSetApartViewProps> = ({
  callings,
  onToggleSetApart,
  onProposeForCalling,
  onSelectCalling,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const needsSetApartList = sortCallings(callings.filter(c => {
    if (c.isVacant || c.setApart) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = c.title.toLowerCase().includes(q);
      const matchesOrg = c.organization.toLowerCase().includes(q);
      const matchesMember = c.memberName ? c.memberName.toLowerCase().includes(q) : false;
      return matchesTitle || matchesOrg || matchesMember;
    }

    return true;
  }));

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Callings Needing Setting Apart</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Members who have been sustained but await setting apart by a member of the Bishopric.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search member or calling..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {needsSetApartList.map((calling) => {
          const tenure = calculateTenure(calling.sustainedDate);

          return (
            <div
              key={calling.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between hover:border-purple-200 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
                  <span>{calling.organization} • {calling.subOrg}</span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    Needs Setting Apart
                  </span>
                </div>

                <h3
                  onClick={() => onSelectCalling(calling)}
                  className="font-bold text-slate-900 text-sm hover:text-purple-600 cursor-pointer transition-colors"
                >
                  {calling.title}
                </h3>

                <div className="mt-3 text-xs font-semibold text-slate-800">
                  <span>{calling.memberName}</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Sustained: <strong className="text-slate-800">{formatDateForDisplay(calling.sustainedDate)}</strong></span>
                  <span className="text-[10px] text-slate-400">{tenure.displayText}</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onToggleSetApart(calling.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Set Apart</span>
                </button>

                <button
                  onClick={() => onProposeForCalling(calling)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors"
                >
                  Propose Release
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {needsSetApartList.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">All Sustained Members Are Set Apart</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no filled callings awaiting setting apart.
          </p>
        </div>
      )}

    </div>
  );
};
