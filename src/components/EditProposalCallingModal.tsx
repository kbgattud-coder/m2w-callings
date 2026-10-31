import React, { useState, useEffect, useMemo } from 'react';
import type { Calling, CallingProposal } from '../types';
import { 
  X, 
  ShieldCheck, 
  ArrowRightLeft, 
  Search, 
  Check, 
  User, 
  Building2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface EditProposalCallingModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: CallingProposal | null;
  allCallings: Calling[];
  onConfirm: (
    proposalId: string, 
    newCallingData: {
      callingId?: string;
      callingTitle: string;
      organization: string;
      subOrg: string;
      memberName?: string;
      currentMemberName?: string | null;
      note?: string;
    }
  ) => Promise<void> | void;
}

export const EditProposalCallingModal: React.FC<EditProposalCallingModalProps> = ({
  isOpen,
  onClose,
  proposal,
  allCallings,
  onConfirm,
}) => {
  if (!isOpen || !proposal) return null;

  const [mode, setMode] = useState<'directory' | 'custom'>('directory');
  const [selectedCallingId, setSelectedCallingId] = useState<string>(proposal.callingId || '');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom fields
  const [customTitle, setCustomTitle] = useState<string>(proposal.callingTitle || '');
  const [customOrg, setCustomOrg] = useState<string>(proposal.organization || 'Young Women');
  const [customSubOrg, setCustomSubOrg] = useState<string>(proposal.subOrg || '');

  // Member & admin note
  const [memberName, setMemberName] = useState<string>(proposal.proposedMemberName || '');
  const [releasingMember, setReleasingMember] = useState<string>(proposal.currentMemberName || '');
  const [adminNote, setAdminNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset when proposal changes
  useEffect(() => {
    if (proposal) {
      setSelectedCallingId(proposal.callingId || '');
      setCustomTitle(proposal.callingTitle || '');
      setCustomOrg(proposal.organization || 'Young Women');
      setCustomSubOrg(proposal.subOrg || '');
      setMemberName(proposal.proposedMemberName || '');
      setReleasingMember(proposal.currentMemberName || '');
      setAdminNote(`Reassigned calling from ${proposal.callingTitle} (${proposal.organization}) to new assignment per Bishopric direction.`);
    }
  }, [proposal]);

  // Extract unique organizations for filter
  const organizations = useMemo(() => {
    const set = new Set<string>();
    allCallings.forEach(c => {
      if (c.organization) set.add(c.organization);
    });
    return ['All', ...Array.from(set).sort()];
  }, [allCallings]);

  // Filter callings
  const filteredCallings = useMemo(() => {
    return allCallings.filter(c => {
      if (selectedOrgFilter !== 'All' && c.organization !== selectedOrgFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchSub = c.subOrg.toLowerCase().includes(q);
        const matchOrg = c.organization.toLowerCase().includes(q);
        const matchMember = c.memberName?.toLowerCase().includes(q);
        return matchTitle || matchSub || matchOrg || matchMember;
      }
      return true;
    });
  }, [allCallings, selectedOrgFilter, searchQuery]);

  // Determine current target info based on mode
  const selectedCallingObj = allCallings.find(c => c.id === selectedCallingId);
  const targetTitle = mode === 'directory' 
    ? (selectedCallingObj?.title || proposal.callingTitle)
    : customTitle;
  const targetOrg = mode === 'directory' 
    ? (selectedCallingObj?.organization || proposal.organization)
    : customOrg;
  const targetSubOrg = mode === 'directory' 
    ? (selectedCallingObj?.subOrg || proposal.subOrg)
    : customSubOrg;

  const handleSelectCalling = (c: Calling) => {
    setSelectedCallingId(c.id);
    setCustomTitle(c.title);
    setCustomOrg(c.organization);
    setCustomSubOrg(c.subOrg);
    if (c.memberName) {
      setReleasingMember(c.memberName);
    } else {
      setReleasingMember('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTitle.trim() || !targetOrg.trim()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(proposal.id, {
        callingId: mode === 'directory' ? selectedCallingId : undefined,
        callingTitle: targetTitle.trim(),
        organization: targetOrg.trim(),
        subOrg: targetSubOrg.trim(),
        memberName: memberName.trim() || proposal.proposedMemberName,
        currentMemberName: releasingMember.trim() ? releasingMember.trim() : null,
        note: adminNote.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Error updating proposal calling:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header with Super Admin Badge */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
              <ArrowRightLeft className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-300" />
                  <span>Super Admin Privilege</span>
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white mt-1">
                Edit / Move Proposal Calling
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Context Banner */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 border-b border-indigo-100 dark:border-indigo-900/60 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Candidate Being Reassigned:
              </span>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {proposal.proposedMemberName}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current Calling on Proposal:
              </span>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {proposal.callingTitle} <span className="text-slate-400">({proposal.organization})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* Candidate Name field (allow updating spelling or adjusting if desired) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Candidate Name:</span>
            </label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. Joana Galecio"
              required
            />
          </div>

          {/* Mode Selector Tabs: Ward Directory vs Custom Calling */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Target Calling Assignment:</span>
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode('directory')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'directory'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Select from Ward Directory
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Enter Custom Calling Title
              </button>
            </div>
          </div>

          {/* Mode 1: Directory Selection */}
          {mode === 'directory' && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              {/* Organization Quick Filter Pills */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Filter by Organization:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pb-1">
                  {organizations.map(org => (
                    <button
                      key={org}
                      type="button"
                      onClick={() => setSelectedOrgFilter(org)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        selectedOrgFilter === org
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {org}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search callings (e.g. Young Women Adviser, Primary Teacher)..."
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Calling Results List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {filteredCallings.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                    No matching callings found. Try changing your search or use &quot;Enter Custom Calling Title&quot;.
                  </div>
                ) : (
                  filteredCallings.map(c => {
                    const isSelected = selectedCallingId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCalling(c)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 dark:border-indigo-400 shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {c.title}
                            </span>
                            {c.isVacant ? (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-1.5 py-0.2 rounded">
                                Vacant
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                Current: {c.memberName}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {c.organization} • {c.subOrg}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Custom Calling Title */}
          {mode === 'custom' && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Organization:
                  </label>
                  <input
                    type="text"
                    value={customOrg}
                    onChange={(e) => setCustomOrg(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Young Women, Primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Sub-Organization / Class:
                  </label>
                  <input
                    type="text"
                    value={customSubOrg}
                    onChange={(e) => setCustomSubOrg(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Builders of Faith Class"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Calling Title:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Young Women Adviser"
                  required
                />
              </div>
            </div>
          )}

          {/* Releasing Member Field (optional) */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Current / Releasing Member in this Calling (Optional):</span>
              <span className="text-[10px] text-slate-400 font-normal">Leave blank if previously vacant</span>
            </label>
            <input
              type="text"
              value={releasingMember}
              onChange={(e) => setReleasingMember(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. None or name of person being released"
            />
          </div>

          {/* Reason / Note */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Super Admin Change Note (Recorded in history & Council Board):
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Reason for reassigning calling..."
            />
          </div>

          {/* Visual Transformation Preview Card */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
            <div className="flex items-center space-x-1.5 text-indigo-900 dark:text-indigo-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Assignment Change Summary</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex-1">
                <span className="text-[10px] text-slate-400 block">Original Assignment</span>
                <span className="font-semibold text-rose-700 dark:text-rose-400 line-through block">
                  {proposal.callingTitle}
                </span>
                <span className="text-[10px] text-slate-500">{proposal.organization}</span>
              </div>

              <div className="text-center font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                ➔
              </div>

              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-indigo-300 dark:border-indigo-700 flex-1">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-bold">
                  New Target Calling
                </span>
                <span className="font-extrabold text-indigo-900 dark:text-indigo-200 block">
                  {targetTitle || '(Select a calling)'}
                </span>
                <span className="text-[10px] text-slate-500">{targetOrg} {targetSubOrg ? `• ${targetSubOrg}` : ''}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !targetTitle.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
              id="btn-confirm-move-calling"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Confirm & Move Calling'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
