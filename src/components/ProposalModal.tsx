import React, { useState, useMemo } from 'react';
import { Calling, BishopricRole, WardMember, ProposalType, AuthUser, CandidateOption, CallingProposal } from '../types';
import { BISHOPRIC_LEADERS } from '../data/initialData';
import { sortCallings } from '../utils/callingSort';
import { X, UserPlus, AlertCircle, CheckCircle2, Users, Plus, Trash2, HelpCircle, Star, Sparkles } from 'lucide-react';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCalling: Calling | null;
  allCallings: Calling[];
  wardMembers: WardMember[];
  activeRole: BishopricRole;
  currentUser?: AuthUser | null;
  existingProposals?: CallingProposal[];
  onSubmitProposal: (proposalData: {
    callingId: string;
    callingTitle: string;
    organization: string;
    subOrg: string;
    type: ProposalType;
    currentMemberName: string | null;
    proposedMemberName: string;
    proposedByName: string;
    reasonNote: string;
    candidates?: CandidateOption[];
    selectedCandidateId?: string;
  }) => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  targetCalling,
  allCallings,
  wardMembers,
  activeRole,
  currentUser,
  existingProposals = [],
  onSubmitProposal,
}) => {
  if (!isOpen) return null;

  const [selectedCallingId, setSelectedCallingId] = useState<string>(targetCalling?.id || '');
  const [candidateList, setCandidateList] = useState<Array<{ id: string; name: string; note: string; isLeading: boolean }>>([
    { id: '1', name: '', note: '', isLeading: true },
  ]);
  const [proposingLeaderName, setProposingLeaderName] = useState<string>(
    currentUser ? `${currentUser.name}${currentUser.calling ? ` (${currentUser.calling})` : ''}` : (BISHOPRIC_LEADERS[activeRole]?.name || '')
  );
  const [reasonNote, setReasonNote] = useState<string>('');

  const currentCalling = allCallings.find(c => c.id === selectedCallingId) || targetCalling;
  const proposalType: ProposalType = currentCalling?.isVacant ? 'fill_vacancy' : 'release_and_replace';

  // Check if position already has an active proposal in pipeline
  const activeProposalForCalling = useMemo(() => {
    if (!currentCalling) return null;
    return existingProposals.find(p => p.callingId === currentCalling.id && p.finalStatus !== 'declined' && !p.isRecordedInLCR);
  }, [currentCalling, existingProposals]);

  // Check existing callings for candidate names
  const getCandidateExistingCallings = (name: string) => {
    if (!name.trim() || name.trim().toLowerCase() === 'to be discussed') return [];
    return allCallings.filter(c => c.memberName && c.memberName.toLowerCase() === name.trim().toLowerCase());
  };

  const handleAddCandidateRow = () => {
    setCandidateList(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', note: '', isLeading: prev.length === 0 }
    ]);
  };

  const handleRemoveCandidateRow = (id: string) => {
    if (candidateList.length <= 1) {
      // Clear the single row instead of removing it
      setCandidateList([{ id: '1', name: '', note: '', isLeading: true }]);
      return;
    }
    setCandidateList(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length > 0 && !filtered.some(c => c.isLeading)) {
        filtered[0].isLeading = true;
      }
      return filtered;
    });
  };

  const handleUpdateCandidateRow = (id: string, field: 'name' | 'note', value: string) => {
    setCandidateList(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSetLeadingCandidate = (id: string) => {
    setCandidateList(prev => prev.map(c => ({ ...c, isLeading: c.id === id })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCalling) {
      alert('Please select a calling position.');
      return;
    }
    if (!proposingLeaderName.trim()) {
      alert('Please enter the proposing leader name.');
      return;
    }

    const filledCandidates = candidateList.filter(c => c.name.trim().length > 0);

    let finalProposedName = 'To be discussed';
    let finalCandidates: CandidateOption[] | undefined = undefined;
    let finalSelectedCandidateId: string | undefined = undefined;

    if (filledCandidates.length === 0) {
      // Open discussion mode
      finalProposedName = 'To be discussed';
      finalCandidates = undefined;
      finalSelectedCandidateId = undefined;
    } else {
      const leadingCand = filledCandidates.find(c => c.isLeading) || filledCandidates[0];
      finalProposedName = leadingCand.name.trim();

      finalCandidates = filledCandidates.map((c, index) => {
        const candId = `cand-${Date.now()}-${index}`;
        const isSelected = c.id === leadingCand.id;
        if (isSelected) {
          finalSelectedCandidateId = candId;
        }
        return {
          id: candId,
          name: c.name.trim(),
          note: c.note.trim() || undefined,
          addedBy: proposingLeaderName.trim(),
          dateAdded: new Date().toISOString().split('T')[0],
          isSelected,
        };
      });
    }

    onSubmitProposal({
      callingId: currentCalling.id,
      callingTitle: currentCalling.title,
      organization: currentCalling.organization,
      subOrg: currentCalling.subOrg,
      type: proposalType,
      currentMemberName: currentCalling.memberName,
      proposedMemberName: finalProposedName,
      proposedByName: proposingLeaderName.trim(),
      reasonNote: reasonNote.trim(),
      candidates: finalCandidates,
      selectedCandidateId: finalSelectedCandidateId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Propose Calling Recommendation</h3>
              <p className="text-xs text-slate-400">Propose candidate(s) or open a calling for Bishopric deliberation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Target Position Selection */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
              Select Calling Position:
            </label>
            <select
              value={selectedCallingId}
              onChange={(e) => setSelectedCallingId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose a calling position --</option>
              {sortCallings(allCallings).map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-slate-800 text-slate-900 dark:text-white">
                  [{c.organization}] {c.title} {c.isVacant ? '(Vacant)' : `(Current: ${c.memberName})`}
                </option>
              ))}
            </select>
          </div>

          {currentCalling && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentCalling.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentCalling.isVacant 
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300' 
                    : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                }`}>
                  {proposalType === 'fill_vacancy' ? 'Filling Vacancy' : 'Release & Replace'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentCalling.organization} • {currentCalling.subOrg}</p>
              {!currentCalling.isVacant && (
                <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold pt-1">
                  Releasing: {currentCalling.memberName}
                </p>
              )}
            </div>
          )}

          {/* Active Proposal Alert if already in pipeline */}
          {activeProposalForCalling && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Active Proposal Already in Pipeline</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                This calling position is currently undergoing review (Status: <strong>{activeProposalForCalling.finalStatus.replace(/_/g, ' ')}</strong>, Proposed: <strong>{activeProposalForCalling.proposedMemberName}</strong>).
              </p>
            </div>
          )}

          {/* Dynamic Candidate List (Unified) */}
          <div className="space-y-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                  Candidate(s) for Deliberation
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {candidateList.filter(c => c.name.trim()).length === 0
                    ? 'Leave empty for open council discussion, or enter one or more candidates'
                    : 'Select the primary recommendation; additional names will be available for council comparison'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddCandidateRow}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Propose Additional Name</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {candidateList.map((cand, idx) => {
                const existingCallings = getCandidateExistingCallings(cand.name);
                const isOnlyRow = candidateList.length === 1;

                return (
                  <div key={cand.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className={`w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 ${
                          cand.isLeading && cand.name.trim()
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          placeholder={idx === 0 ? "Candidate name (or leave empty for Open Discussion)..." : `Alternative candidate ${idx + 1} name...`}
                          value={cand.name}
                          onChange={(e) => handleUpdateCandidateRow(cand.id, 'name', e.target.value)}
                          className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      {!isOnlyRow && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCandidateRow(cand.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Remove candidate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Optional rationale or context for this name..."
                        value={cand.note}
                        onChange={(e) => handleUpdateCandidateRow(cand.id, 'note', e.target.value)}
                        className="flex-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      
                      {candidateList.length > 1 && (
                        <label className="flex items-center space-x-1.5 cursor-pointer shrink-0 text-[11px] text-slate-700 dark:text-slate-300 font-medium select-none bg-slate-50 dark:bg-slate-700/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
                          <input
                            type="radio"
                            name="leadingCandidate"
                            checked={cand.isLeading}
                            onChange={() => handleSetLeadingCandidate(cand.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Primary Choice</span>
                        </label>
                      )}
                    </div>

                    {existingCallings.length > 0 && (
                      <div className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Currently holds {existingCallings.length} calling(s): {existingCallings.map(c => c.title).join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {candidateList.every(c => !c.name.trim()) && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>No candidate entered. This proposal will be submitted as an <strong>Open Discussion</strong> calling for council deliberations.</span>
              </div>
            )}
          </div>

          {/* Proposer Leader Name Field */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
              Proposing Leader:
            </label>
            <input
              type="text"
              placeholder="Enter proposing leader name (e.g. Relief Society President, Elders Quorum President, etc.)..."
              value={proposingLeaderName}
              onChange={(e) => setProposingLeaderName(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* General Recommendation Context / Note */}
          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-1">
              General Recommendation Context / Note:
            </label>
            <textarea
              rows={2}
              placeholder="Provide background context on why this position is being filled or released..."
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit for 3-Point Approval</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
