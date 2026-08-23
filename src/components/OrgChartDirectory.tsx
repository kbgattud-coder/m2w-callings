import React, { useState, useMemo } from 'react';
import { Calling, CallingFilterStatus, CallingProposal } from '../types';
import { calculateTenure, formatDateForDisplay } from '../utils/tenure';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  RefreshCw, 
  AlertCircle,
  FileCheck2,
  Calendar,
  Building2,
  MoreHorizontal,
  Trash2,
  Plus
} from 'lucide-react';

interface OrgChartDirectoryProps {
  callings: Calling[];
  proposals: CallingProposal[];
  selectedOrg: string;
  onSelectOrg: (org: string) => void;
  onProposeForCalling: (calling: Calling) => void;
  onToggleSetApart: (callingId: string) => void;
  onSelectCalling: (calling: Calling) => void;
  onOpenAddCustomCalling?: () => void;
  onDeleteCalling?: (callingId: string, callingTitle: string) => void;
  initialFilterStatus?: CallingFilterStatus;
}

export const OrgChartDirectory: React.FC<OrgChartDirectoryProps> = ({
  callings,
  proposals,
  selectedOrg,
  onSelectOrg,
  onProposeForCalling,
  onToggleSetApart,
  onSelectCalling,
  onOpenAddCustomCalling,
  onDeleteCalling,
  initialFilterStatus = 'all'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CallingFilterStatus>(initialFilterStatus);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Map proposals to callings for quick lookup
  const proposalsMap = useMemo(() => {
    const map = new Map<string, CallingProposal>();
    proposals.forEach(p => {
      if (p.finalStatus === 'pending_review' || p.finalStatus === 'approved_for_action') {
        map.set(p.callingId, p);
      }
    });
    return map;
  }, [proposals]);

  // Filter callings
  const filteredCallings = useMemo(() => {
    return callings.filter(c => {
      // Org filter
      if (selectedOrg !== 'All Organizations' && selectedOrg !== 'All' && c.organization !== selectedOrg) {
        return false;
      }

      // Status filter
      if (filterStatus === 'vacant' && !c.isVacant) return false;
      if (filterStatus === 'filled' && c.isVacant) return false;
      if (filterStatus === 'needs_set_apart' && (c.isVacant || c.setApart)) return false;
      
      if (filterStatus === 'long_tenure') {
        if (c.isVacant) return false;
        const tenure = calculateTenure(c.sustainedDate);
        if (tenure.totalMonths < 36) return false;
      }

      if (filterStatus === 'has_proposal') {
        if (!proposalsMap.has(c.id)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesSubOrg = c.subOrg.toLowerCase().includes(q);
        const matchesOrg = c.organization.toLowerCase().includes(q);
        const matchesMember = c.memberName ? c.memberName.toLowerCase().includes(q) : false;
        
        return matchesTitle || matchesSubOrg || matchesOrg || matchesMember;
      }

      return true;
    });
  }, [callings, selectedOrg, filterStatus, searchQuery, proposalsMap]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      
      {/* Top Header Bar (Matching Reference Activity Section) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {selectedOrg === 'All Organizations' || selectedOrg === 'All' ? 'Callings Directory' : `${selectedOrg}`}
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">
              {filteredCallings.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of ward organizations, position holders, tenure, and setting apart status.
          </p>
        </div>

        {/* Right Controls: Search + Filter Dropdown + Add Calling + View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search calling or member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as CallingFilterStatus)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Callings</option>
              <option value="vacant">Vacant Positions</option>
              <option value="filled">Filled Positions</option>
              <option value="needs_set_apart">Needs Setting Apart</option>
              <option value="long_tenure">Serving 3+ Years</option>
              <option value="has_proposal">Pending Proposal</option>
            </select>
          </div>

          {/* Add Custom Calling Button */}
          {onOpenAddCustomCalling && (
            <button
              onClick={onOpenAddCustomCalling}
              className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
              title="Add a custom auxiliary calling or specialist"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Calling</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* TABLE VIEW (Matching reference "Recent Activities" table style) */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">Calling Title</th>
                <th className="py-3 px-4 font-bold">Organization</th>
                <th className="py-3 px-4 font-bold">Current Holder</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Tenure</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredCallings.map((calling) => {
                const tenure = calculateTenure(calling.sustainedDate);
                const activeProposal = proposalsMap.get(calling.id);

                return (
                  <tr key={calling.id} className="hover:bg-slate-50/70 transition-colors group">
                    
                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <div 
                        onClick={() => onSelectCalling(calling)}
                        className="font-bold text-slate-900 hover:text-orange-600 cursor-pointer text-xs leading-snug"
                      >
                        {calling.title}
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="py-3.5 px-4 text-slate-500 font-medium text-[11px] whitespace-nowrap">
                      {calling.organization}
                      <span className="text-slate-400 text-[10px] block font-normal">{calling.subOrg}</span>
                    </td>

                    {/* Current Holder */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {calling.isVacant ? (
                        <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded">
                          Vacant Position
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-800">{calling.memberName}</span>
                      )}
                    </td>

                    {/* Status Dot */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {activeProposal ? (
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/60 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          <span>Proposal Pending</span>
                        </span>
                      ) : calling.isVacant ? (
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          <span>Vacant</span>
                        </span>
                      ) : !calling.setApart ? (
                        <button
                          onClick={() => onToggleSetApart(calling.id)}
                          className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200/60 transition-colors whitespace-nowrap"
                          title="Click to mark set apart"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                          <span>Needs Setting Apart</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>Sustained & Set Apart</span>
                        </span>
                      )}
                    </td>

                    {/* Tenure */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {!calling.isVacant ? (
                        <div>
                          <span className="font-semibold text-slate-700 block">{tenure.displayText}</span>
                          <span className="text-[10px] text-slate-400">{formatDateForDisplay(calling.sustainedDate)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {calling.isVacant && onDeleteCalling && (
                          <button
                            type="button"
                            onClick={() => onDeleteCalling(calling.id, calling.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete this vacant calling"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {calling.isVacant ? (
                          <button
                            onClick={() => onProposeForCalling(calling)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] px-3 py-1.5 rounded-xl transition-colors shadow-2xs whitespace-nowrap"
                          >
                            Propose Member
                          </button>
                        ) : (
                          <button
                            onClick={() => onProposeForCalling(calling)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] px-3 py-1.5 rounded-xl transition-colors border border-slate-200/80 whitespace-nowrap"
                          >
                            Propose Release
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCallings.map((calling) => {
            const tenure = calculateTenure(calling.sustainedDate);
            const activeProposal = proposalsMap.get(calling.id);

            return (
              <div
                key={calling.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                    <span>{calling.organization} • {calling.subOrg}</span>
                    {activeProposal && (
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>

                  <h4 
                    onClick={() => onSelectCalling(calling)}
                    className="font-bold text-slate-900 text-sm hover:text-orange-600 cursor-pointer transition-colors leading-snug"
                  >
                    {calling.title}
                  </h4>

                  <div className="mt-3">
                    {calling.isVacant ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                        <UserX className="w-3.5 h-3.5" />
                        <span>Position Vacant</span>
                      </span>
                    ) : (
                      <div className="text-slate-800 text-xs font-semibold">
                        <span>{calling.memberName}</span>
                      </div>
                    )}
                  </div>

                  {!calling.isVacant && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Serving: <strong className="text-slate-800">{tenure.displayText}</strong></span>
                      <span className="text-[10px] text-slate-400">{formatDateForDisplay(calling.sustainedDate)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {!calling.isVacant ? (
                    <button
                      onClick={() => onToggleSetApart(calling.id)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                        calling.setApart
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-purple-50 border-purple-200 text-purple-700 font-semibold'
                      }`}
                    >
                      {calling.setApart ? '• Set Apart' : '• Needs Set Apart'}
                    </button>
                  ) : (
                    <div>
                      {onDeleteCalling && (
                        <button
                          type="button"
                          onClick={() => onDeleteCalling(calling.id, calling.title)}
                          className="text-[11px] text-slate-400 hover:text-rose-600 font-medium flex items-center space-x-1 p-1 rounded hover:bg-rose-50 transition-colors"
                          title="Delete this vacant calling position"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => onProposeForCalling(calling)}
                    className="ml-auto bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                  >
                    {calling.isVacant ? 'Propose Member' : 'Propose Release'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {filteredCallings.length === 0 && (
        <div className="p-8 text-center space-y-2">
          <UserX className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Callings Found</h3>
          <p className="text-xs text-slate-400">Try adjusting your search query or selecting another organization.</p>
        </div>
      )}

    </div>
  );
};
