import React, { useState, useMemo } from 'react';
import { Calling, CallingFilterStatus, CallingProposal, AuthUser } from '../types';
import { calculateTenure, formatDateForDisplay } from '../utils/tenure';
import { sortCallings } from '../utils/callingSort';
import { ProposalPreviewModal } from './ProposalPreviewModal';
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
  Plus,
  Edit3,
  ShieldCheck,
  Users,
  Eye
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
  onOpenDirectEdit?: (calling?: Calling) => void;
  onDeleteCalling?: (callingId: string, callingTitle: string) => void;
  onNavigateToApprovals?: (tabKey?: 'pending' | 'for_interview' | 'for_sustaining' | 'for_recording') => void;
  onSelectCandidate?: (proposalId: string, candidateId: string) => void;
  onAddCandidate?: (proposalId: string, name: string, note?: string) => void;
  initialFilterStatus?: CallingFilterStatus;
  currentUser?: AuthUser;
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
  onOpenDirectEdit,
  onDeleteCalling,
  onNavigateToApprovals,
  onSelectCandidate,
  onAddCandidate,
  initialFilterStatus = 'all',
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<CallingFilterStatus>(initialFilterStatus);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [previewProposal, setPreviewProposal] = useState<CallingProposal | null>(null);

  const fallbackUser: AuthUser = currentUser || {
    id: 'guest',
    name: 'Guest Leader',
    calling: 'Ward Leader',
    email: '',
    role: 'bishop',
    isSuperAdmin: false,
  };

  const isAdmin = fallbackUser.isSuperAdmin || 
    fallbackUser.role === 'bishop' || 
    fallbackUser.role === 'first_counselor' || 
    fallbackUser.role === 'second_counselor' || 
    (fallbackUser.role as string) === 'clerk' || 
    (fallbackUser.role as string) === 'exec_sec' ||
    fallbackUser.role === 'executive_secretary';

  // Map proposals to callings for quick lookup
  const proposalsMap = useMemo(() => {
    const map = new Map<string, CallingProposal>();
    proposals.forEach(p => {
      if (
        p.finalStatus === 'pending_review' || 
        p.finalStatus === 'for_interview' || 
        p.finalStatus === 'for_sustaining' || 
        p.finalStatus === 'approved_for_action' ||
        (p.finalStatus === 'for_recording' && !p.isRecordedInLCR)
      ) {
        map.set(p.callingId, p);
      }
    });
    return map;
  }, [proposals]);

  // Filter and sort callings strictly by ecclesiastical hierarchy
  const filteredCallings = useMemo(() => {
    const list = callings.filter(c => {
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

    return sortCallings(list);
  }, [callings, selectedOrg, filterStatus, searchQuery, proposalsMap]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3.5 sm:p-5 space-y-4 transition-colors">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {selectedOrg === 'All Organizations' || selectedOrg === 'All' ? 'Callings Directory' : `${selectedOrg}`}
            </h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200/60 dark:border-slate-700">
              {filteredCallings.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
            Overview of ward organizations, position holders, tenure, and setting apart status.
          </p>
        </div>

        {/* Right Controls: Search + Filter Dropdown + Admin Entry + Add Calling + View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search calling or member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as CallingFilterStatus)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="dark:bg-slate-800">All Callings</option>
              <option value="vacant" className="dark:bg-slate-800">Vacant Positions</option>
              <option value="filled" className="dark:bg-slate-800">Filled Positions</option>
              <option value="needs_set_apart" className="dark:bg-slate-800">Needs Setting Apart</option>
              <option value="long_tenure" className="dark:bg-slate-800">Serving 3+ Years</option>
              <option value="has_proposal" className="dark:bg-slate-800">Pending Proposal</option>
            </select>
          </div>

          {/* Admin Direct Quick Entry Button */}
          {isAdmin && onOpenDirectEdit && (
            <button
              onClick={() => onOpenDirectEdit()}
              className="flex items-center space-x-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
              title="Manually assign or edit calling directly without approval queue"
              id="btn-admin-direct-entry"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 dark:text-blue-200" />
              <span>Direct Entry</span>
            </button>
          )}

          {/* Add Custom Calling Button */}
          {onOpenAddCustomCalling && (
            <button
              onClick={onOpenAddCustomCalling}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
              title="Add a custom auxiliary calling or specialist"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Calling</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">Calling Title</th>
                <th className="py-3 px-4 font-bold">Organization</th>
                <th className="py-3 px-4 font-bold">Current Holder</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Tenure</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800">
              {filteredCallings.map((calling) => {
                const tenure = calculateTenure(calling.sustainedDate);
                const activeProposal = proposalsMap.get(calling.id);

                return (
                  <tr key={calling.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                    
                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <div 
                        onClick={() => onSelectCalling(calling)}
                        className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-xs leading-snug"
                      >
                        {calling.title}
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium text-[11px] whitespace-nowrap">
                      {calling.organization}
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] block font-normal">{calling.subOrg}</span>
                    </td>

                    {/* Current Holder */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {calling.isVacant ? (
                        <span className="text-amber-700 dark:text-amber-300 font-semibold text-[11px] bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.5 rounded">
                          Vacant Position
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{calling.memberName}</span>
                      )}
                    </td>

                    {/* Status Dot */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {activeProposal ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewProposal(activeProposal);
                          }}
                          className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:border-blue-300 dark:hover:border-blue-700 px-2.5 py-1 rounded-full border border-blue-200/80 dark:border-blue-800/80 transition-all cursor-pointer shadow-2xs group/pill text-left"
                          title="Click to view proposed candidates, status, and bishopric sign-offs"
                          id={`btn-proposal-pill-${calling.id}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 group-hover/pill:scale-125 transition-transform"></span>
                          <span>Proposal Pending</span>
                          <Eye className="w-3 h-3 text-blue-500 opacity-60 group-hover/pill:opacity-100 transition-opacity ml-0.5" />
                        </button>
                      ) : calling.isVacant ? (
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          <span>Vacant</span>
                        </span>
                      ) : !calling.setApart ? (
                        <button
                          onClick={() => onToggleSetApart(calling.id)}
                          className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 px-2.5 py-1 rounded-full border border-purple-200/60 dark:border-purple-800/60 transition-colors whitespace-nowrap cursor-pointer"
                          title="Click to mark set apart"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                          <span>Needs Setting Apart</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>Sustained &amp; Set Apart</span>
                        </span>
                      )}
                    </td>

                    {/* Tenure */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {!calling.isVacant ? (
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200 block">{tenure.displayText}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDateForDisplay(calling.sustainedDate)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* Direct Edit for Admin */}
                        {isAdmin && onOpenDirectEdit && (
                          <button
                            type="button"
                            onClick={() => onOpenDirectEdit(calling)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                            title="Direct edit / assign this calling"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {calling.isVacant && onDeleteCalling && (
                          <button
                            type="button"
                            onClick={() => onDeleteCalling(calling.id, calling.title)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Delete this vacant calling"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {activeProposal ? (
                          <button
                            type="button"
                            onClick={() => setPreviewProposal(activeProposal)}
                            className="bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold text-[11px] px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 transition-colors shadow-2xs whitespace-nowrap flex items-center space-x-1 cursor-pointer"
                            title="Click to view proposal progress and candidates"
                          >
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span>In Progress</span>
                          </button>
                        ) : calling.isVacant ? (
                          <button
                            onClick={() => onProposeForCalling(calling)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] px-3 py-1.5 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                          >
                            Propose Member
                          </button>
                        ) : (
                          <button
                            onClick={() => onProposeForCalling(calling)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[11px] px-3 py-1.5 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700 whitespace-nowrap cursor-pointer"
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
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 transition-all duration-200 hover:shadow-md dark:hover:border-slate-600 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-400 font-medium mb-1.5">
                    <span>{calling.organization} • {calling.subOrg}</span>
                    <div className="flex items-center space-x-1">
                      {isAdmin && onOpenDirectEdit && (
                        <button
                          type="button"
                          onClick={() => onOpenDirectEdit(calling)}
                          className="text-slate-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Direct edit calling"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      {activeProposal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewProposal(activeProposal);
                          }}
                          className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:border-blue-300 dark:hover:border-blue-700 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Click to view proposed candidates and consensus status"
                          id={`btn-grid-proposal-pill-${calling.id}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>Proposal Pending</span>
                          <Eye className="w-2.5 h-2.5 text-blue-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 
                    onClick={() => onSelectCalling(calling)}
                    className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug"
                  >
                    {calling.title}
                  </h4>

                  <div className="mt-3">
                    {calling.isVacant ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                        <UserX className="w-3.5 h-3.5" />
                        <span>Position Vacant</span>
                      </span>
                    ) : (
                      <div className="text-slate-800 dark:text-slate-200 text-xs font-semibold">
                        <span>{calling.memberName}</span>
                      </div>
                    )}
                  </div>

                  {!calling.isVacant && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Serving: <strong className="text-slate-800 dark:text-slate-200">{tenure.displayText}</strong></span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDateForDisplay(calling.sustainedDate)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {!calling.isVacant ? (
                    <button
                      onClick={() => onToggleSetApart(calling.id)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                        calling.setApart
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300'
                          : 'bg-purple-50 dark:bg-purple-950/70 border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 font-semibold'
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
                          className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium flex items-center space-x-1 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete this vacant calling position"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  )}

                  {activeProposal ? (
                    <button
                      type="button"
                      onClick={() => setPreviewProposal(activeProposal)}
                      className="ml-auto bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Click to view proposal progress and candidates"
                    >
                      <Eye className="w-3 h-3 text-blue-500" />
                      <span>In Progress</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onProposeForCalling(calling)}
                      className="ml-auto bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      {calling.isVacant ? 'Propose Member' : 'Propose Release'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {filteredCallings.length === 0 && (
        <div className="p-8 text-center space-y-2">
          <UserX className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Callings Found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search query or selecting another organization.</p>
        </div>
      )}

      {/* Clickable Proposal Details & Candidates Popover/Modal */}
      <ProposalPreviewModal
        isOpen={!!previewProposal}
        onClose={() => setPreviewProposal(null)}
        proposal={previewProposal}
        calling={callings.find(c => c.id === previewProposal?.callingId)}
        currentUser={fallbackUser}
        onSelectCandidate={onSelectCandidate}
        onAddCandidate={onAddCandidate}
        onNavigateToApprovals={onNavigateToApprovals}
      />

    </div>
  );
};
