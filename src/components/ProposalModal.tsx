import React, { useState } from 'react';
import { Calling, BishopricRole, WardMember, ProposalType, AuthUser, CandidateOption } from '../types';
import { BISHOPRIC_LEADERS } from '../data/initialData';
import { X, UserPlus, AlertCircle, RefreshCw, CheckCircle2, Users, Plus, Trash2, HelpCircle } from 'lucide-react';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCalling: Calling | null;
  allCallings: Calling[];
  wardMembers: WardMember[];
  activeRole: BishopricRole;
  currentUser?: AuthUser | null;
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
  onSubmitProposal,
}) => {
  if (!isOpen) return null;

  const [selectedCallingId, setSelectedCallingId] = useState<string>(targetCalling?.id || '');
  const [candidateMode, setCandidateMode] = useState<'single' | 'multiple' | 'open'>('single');
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidateList, setCandidateList] = useState<Array<{ id: string; name: string; note: string; isLeading: boolean }>>([
    { id: '1', name: '', note: '', isLeading: true },
    { id: '2', name: '', note: '', isLeading: false },
  ]);
  const [proposingLeaderName, setProposingLeaderName] = useState<string>(
    currentUser ? `${currentUser.name}${currentUser.calling ? ` (${currentUser.calling})` : ''}` : (BISHOPRIC_LEADERS[activeRole]?.name || '')
  );
  const [reasonNote, setReasonNote] = useState<string>('');

  const currentCalling = allCallings.find(c => c.id === selectedCallingId) || targetCalling;
  const proposalType: ProposalType = currentCalling?.isVacant ? 'fill_vacancy' : 'release_and_replace';

  // Check existing callings for single candidate
  const singleCandidateCurrentCallings = React.useMemo(() => {
    if (candidateMode !== 'single' || !candidateName.trim() || candidateName.trim().toLowerCase() === 'to be discussed') return [];
    return allCallings.filter(c => c.memberName && c.memberName.toLowerCase() === candidateName.trim().toLowerCase());
  }, [candidateName, allCallings, candidateMode]);

  // Check existing callings for multiple candidates
  const getCandidateExistingCallings = (name: string) => {
    if (!name.trim()) return [];
    return allCallings.filter(c => c.memberName && c.memberName.toLowerCase() === name.trim().toLowerCase());
  };

  const handleAddCandidateRow = () => {
    setCandidateList(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', note: '', isLeading: false }
    ]);
  };

  const handleRemoveCandidateRow = (id: string) => {
    if (candidateList.length <= 1) return;
    setCandidateList(prev => {
      const filtered = prev.filter(c => c.id !== id);
      // Ensure at least one is leading if there was a leading candidate
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

    let finalProposedName = '';
    let finalCandidates: CandidateOption[] | undefined = undefined;
    let finalSelectedCandidateId: string | undefined = undefined;

    if (candidateMode === 'open') {
      finalProposedName = 'To be discussed';
    } else if (candidateMode === 'single') {
      if (!candidateName.trim()) {
        alert('Please enter a proposed candidate name.');
        return;
      }
      finalProposedName = candidateName.trim();
      const candId = `cand-${Date.now()}`;
      finalCandidates = [
        {
          id: candId,
          name: candidateName.trim(),
          note: reasonNote.trim() || undefined,
          addedBy: proposingLeaderName.trim(),
          dateAdded: '2026-07-26',
          isSelected: true,
        }
      ];
      finalSelectedCandidateId = candId;
    } else {
      // Multiple candidates mode
      const validCandidates = candidateList.filter(c => c.name.trim().length > 0);
      if (validCandidates.length === 0) {
        alert('Please enter at least one candidate name for discussion.');
        return;
      }

      const leadingCandidate = validCandidates.find(c => c.isLeading) || validCandidates[0];
      finalProposedName = leadingCandidate ? leadingCandidate.name.trim() : 'To be discussed (Multiple Candidates)';

      finalCandidates = validCandidates.map((c, index) => {
        const candId = `cand-${Date.now()}-${index}`;
        if (c.id === leadingCandidate?.id) {
          finalSelectedCandidateId = candId;
        }
        return {
          id: candId,
          name: c.name.trim(),
          note: c.note.trim() || undefined,
          addedBy: proposingLeaderName.trim(),
          dateAdded: '2026-07-26',
          isSelected: c.id === leadingCandidate?.id,
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Propose Calling Recommendation</h3>
              <p className="text-xs text-slate-400">Propose single candidate, multiple names to discuss, or open vacancy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Target Position Selection */}
          <div>
            <label className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
              Select Calling Position:
            </label>
            <select
              value={selectedCallingId}
              onChange={(e) => setSelectedCallingId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">-- Choose a calling position --</option>
              {allCallings.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.organization}] {c.title} {c.isVacant ? '(Vacant)' : `(Current: ${c.memberName})`}
                </option>
              ))}
            </select>
          </div>

          {currentCalling && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">{currentCalling.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentCalling.isVacant ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {proposalType === 'fill_vacancy' ? 'Filling Vacancy' : 'Release & Replace'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{currentCalling.organization} • {currentCalling.subOrg}</p>
              {!currentCalling.isVacant && (
                <p className="text-xs text-rose-700 font-semibold pt-1">
                  Releasing: {currentCalling.memberName}
                </p>
              )}
            </div>
          )}

          {/* Proposal Strategy Selection Tabs */}
          <div className="space-y-2 pt-1">
            <label className="font-bold text-slate-800 uppercase tracking-wider block">
              Candidate Selection Mode:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCandidateMode('single')}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                  candidateMode === 'single'
                    ? 'bg-orange-50 border-orange-400 text-orange-950 ring-2 ring-orange-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                1 Candidate
              </button>

              <button
                type="button"
                onClick={() => setCandidateMode('multiple')}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all flex items-center justify-center space-x-1 ${
                  candidateMode === 'multiple'
                    ? 'bg-orange-50 border-orange-400 text-orange-950 ring-2 ring-orange-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Multiple Names</span>
              </button>

              <button
                type="button"
                onClick={() => setCandidateMode('open')}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                  candidateMode === 'open'
                    ? 'bg-orange-50 border-orange-400 text-orange-950 ring-2 ring-orange-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Open Discussion
              </button>
            </div>
          </div>

          {/* 1. SINGLE CANDIDATE INPUT */}
          {candidateMode === 'single' && (
            <div className="space-y-2">
              <label className="font-bold text-slate-800 uppercase tracking-wider block">
                Proposed Candidate Name:
              </label>
              <input
                type="text"
                placeholder="Type member name (e.g. Reyes, Francisco)..."
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              {singleCandidateCurrentCallings.length > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Candidate currently holds {singleCandidateCurrentCallings.length} calling(s):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-800">
                    {singleCandidateCurrentCallings.map(c => (
                      <li key={c.id}><strong>{c.title}</strong> ({c.organization})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 2. MULTIPLE CANDIDATES LIST (DISCUSSION POOL) */}
          {candidateMode === 'multiple' && (
            <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Candidate Pool for Bishopric Discussion</span>
                  <span className="text-[11px] text-slate-500">List potential names to compare and discuss during meeting</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddCandidateRow}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Name</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {candidateList.map((cand, idx) => {
                  const existingCallings = getCandidateExistingCallings(cand.name);

                  return (
                    <div key={cand.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder={`Candidate ${idx + 1} Name (e.g. Santos, Juan)...`}
                            value={cand.name}
                            onChange={(e) => handleUpdateCandidateRow(cand.id, 'name', e.target.value)}
                            className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {candidateList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidateRow(cand.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Remove candidate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Optional notes / rationale for this candidate..."
                          value={cand.note}
                          onChange={(e) => handleUpdateCandidateRow(cand.id, 'note', e.target.value)}
                          className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        
                        <label className="flex items-center space-x-1 cursor-pointer shrink-0 text-[11px] text-slate-600 font-medium select-none bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                          <input
                            type="radio"
                            name="leadingCandidate"
                            checked={cand.isLeading}
                            onChange={() => handleSetLeadingCandidate(cand.id)}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <span>Primary Choice</span>
                        </label>
                      </div>

                      {existingCallings.length > 0 && (
                        <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Currently holds: {existingCallings.map(c => c.title).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. OPEN DISCUSSION MODE */}
          {candidateMode === 'open' && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs block text-amber-900">Candidate: To be discussed</span>
                <span className="text-[11px] text-amber-700">
                  No specific candidate names entered yet. You and the Bishopric can propose and compare names directly in the Approvals queue.
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase bg-amber-200/70 text-amber-900 px-2.5 py-1 rounded-md shrink-0 flex items-center space-x-1">
                <HelpCircle className="w-3 h-3" />
                <span>Open Pool</span>
              </span>
            </div>
          )}

          {/* Proposer Leader Name Field */}
          <div>
            <label className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
              Proposing Leader:
            </label>
            <input
              type="text"
              placeholder="Enter proposing leader name (e.g. Relief Society President, Elders Quorum President, etc.)..."
              value={proposingLeaderName}
              onChange={(e) => setProposingLeaderName(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* General Recommendation Note */}
          <div>
            <label className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
              General Recommendation Context / Note:
            </label>
            <textarea
              rows={2}
              placeholder="Provide background context on why this position is being filled..."
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
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

