import React, { useState } from 'react';
import { BishopricRole, CallingProposal, ApprovalStatus, AuthUser, Calling, CandidateOption } from '../types';
import { BISHOPRIC_LEADERS } from '../data/initialData';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  CheckCheck, 
  Calendar,
  Zap,
  FileCheck2,
  HelpCircle,
  Edit2,
  UserPlus,
  UserCheck,
  Check,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ApprovalsQueueProps {
  currentUser: AuthUser;
  proposals: CallingProposal[];
  allCallings: Calling[];
  activeRole: BishopricRole;
  onUpdateApproval: (proposalId: string, role: BishopricRole, status: ApprovalStatus, note?: string) => void;
  onUpdateProposalCandidate?: (proposalId: string, candidateName: string) => void;
  onSelectCandidate?: (proposalId: string, candidateId: string) => void;
  onAddCandidateToProposal?: (proposalId: string, candidateName: string, note?: string) => void;
  onRemoveCandidateFromProposal?: (proposalId: string, candidateId: string) => void;
  onSuperAdminApproveAll?: (proposalId: string) => void;
  onSustainCalling: (proposal: CallingProposal) => void;
  onDeleteProposal?: (proposalId: string, title?: string) => void;
}

export const ApprovalsQueue: React.FC<ApprovalsQueueProps> = ({
  currentUser,
  proposals,
  allCallings,
  activeRole,
  onUpdateApproval,
  onUpdateProposalCandidate,
  onSelectCandidate,
  onAddCandidateToProposal,
  onRemoveCandidateFromProposal,
  onSuperAdminApproveAll,
  onSustainCalling,
  onDeleteProposal,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved_action' | 'declined'>('pending');
  const [noteInputMap, setNoteInputMap] = useState<Record<string, string>>({});
  const [newCandidateNameMap, setNewCandidateNameMap] = useState<Record<string, string>>({});
  const [newCandidateNoteMap, setNewCandidateNoteMap] = useState<Record<string, string>>({});
  const [showAddCandidateMap, setShowAddCandidateMap] = useState<Record<string, boolean>>({});
  const [showHistoryMap, setShowHistoryMap] = useState<Record<string, boolean>>({});

  const currentLeader = BISHOPRIC_LEADERS[activeRole];

  // Group proposals by status
  const pendingProposals = proposals.filter(p => p.finalStatus === 'pending_review');
  const approvedActionProposals = proposals.filter(p => p.finalStatus === 'approved_for_action');
  const declinedProposals = proposals.filter(p => p.finalStatus === 'declined');

  const displayedProposals = 
    activeTab === 'pending' ? pendingProposals :
    activeTab === 'approved_action' ? approvedActionProposals : declinedProposals;

  const handleNoteChange = (proposalId: string, text: string) => {
    setNoteInputMap(prev => ({ ...prev, [proposalId]: text }));
  };

  const handleAction = (proposalId: string, status: ApprovalStatus) => {
    if (activeRole === 'executive_secretary' && !currentUser.isSuperAdmin) {
      alert('Executive Secretary is in View-Only mode for sign-offs.');
      return;
    }

    const note = noteInputMap[proposalId] || '';
    onUpdateApproval(proposalId, activeRole, status, note);
    setNoteInputMap(prev => ({ ...prev, [proposalId]: '' }));
  };

  // Helper to check member's current active callings
  const getMemberCurrentCallings = (name: string) => {
    if (!name || !name.trim() || name.toLowerCase().includes('to be discussed')) return [];
    return allCallings.filter(c => c.memberName && c.memberName.toLowerCase() === name.trim().toLowerCase());
  };

  // Add new candidate name directly to proposal pool
  const handleAddNewCandidate = (proposalId: string) => {
    const name = (newCandidateNameMap[proposalId] || '').trim();
    const note = (newCandidateNoteMap[proposalId] || '').trim();

    if (!name) {
      alert('Please enter a candidate name to add to discussion.');
      return;
    }

    if (onAddCandidateToProposal) {
      onAddCandidateToProposal(proposalId, name, note);
    }

    setNewCandidateNameMap(prev => ({ ...prev, [proposalId]: '' }));
    setNewCandidateNoteMap(prev => ({ ...prev, [proposalId]: '' }));
    setShowAddCandidateMap(prev => ({ ...prev, [proposalId]: false }));
  };

  return (
    <div className="space-y-5">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Calling Approvals & Discussions</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Review candidate pools, discuss options in Bishopric meeting, establish consensus, and record 3-point approvals.
          </p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Pending Review ({pendingProposals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approved_action')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'approved_action'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Action Ready ({approvedActionProposals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('declined')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'declined'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Declined ({declinedProposals.length})</span>
        </button>
      </div>

      {/* Proposal Cards List */}
      <div className="space-y-4">
        {displayedProposals.map((proposal) => {
          const approvalValues = [
            proposal.approvals.bishop.status,
            proposal.approvals.first_counselor.status,
            proposal.approvals.second_counselor.status,
          ];
          const approvedCount = approvalValues.filter(s => s === 'approved').length;
          const isFullyApproved = approvedCount === 3;
          const myApproval = (activeRole !== 'executive_secretary') 
            ? proposal.approvals[activeRole] 
            : null;

          const candidates = proposal.candidates || [];
          const hasMultipleCandidates = candidates.length > 1;
          const isUndecided = proposal.proposedMemberName.toLowerCase().includes('to be discussed');

          return (
            <div
              key={proposal.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
            >
              {/* Proposal Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {proposal.organization} • {proposal.subOrg}
                    </span>
                    {hasMultipleCandidates && (
                      <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{candidates.length} Candidates to Discuss</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {proposal.callingTitle}
                  </h3>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Proposed {proposal.dateProposed} by <strong>{proposal.proposedByName}</strong></span>
                  </div>
                  {onDeleteProposal && (
                    <button
                      type="button"
                      onClick={() => onDeleteProposal(proposal.id, proposal.callingTitle)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                      title="Delete this proposal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Release / Target Call Context */}
              <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                {proposal.type === 'release_and_replace' && proposal.currentMemberName ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-medium">Releasing Member:</span>
                    <span className="font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md">
                      {proposal.currentMemberName}
                    </span>
                  </div>
                ) : (
                  <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    Vacant Position
                  </span>
                )}

                <div className="flex items-center space-x-2 ml-auto">
                  <span className="text-slate-400 font-medium">Consensus Candidate:</span>
                  {isUndecided ? (
                    <span className="inline-flex items-center space-x-1 font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                      <HelpCircle className="w-3 h-3 text-amber-700" />
                      <span>{proposal.proposedMemberName}</span>
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{proposal.proposedMemberName}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* CANDIDATE DISCUSSION POOL SECTION */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="font-bold text-xs text-slate-800">
                      Candidate Discussion & Consideration Pool
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({candidates.length} {candidates.length === 1 ? 'name' : 'names'} under review)
                    </span>
                  </div>

                  {proposal.finalStatus !== 'sustained' && (
                    <button
                      type="button"
                      onClick={() => setShowAddCandidateMap(prev => ({ ...prev, [proposal.id]: !prev[proposal.id] }))}
                      className="bg-white hover:bg-slate-100 text-orange-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-orange-200 transition-colors shadow-2xs flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3 text-orange-600" />
                      <span>+ Propose Additional Name</span>
                    </button>
                  )}
                </div>

                {/* Inline Form to Add Alternative Candidate */}
                {showAddCandidateMap[proposal.id] && (
                  <div className="p-3 bg-white border border-orange-200 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Add Another Candidate for Discussion:</span>
                      <button
                        type="button"
                        onClick={() => setShowAddCandidateMap(prev => ({ ...prev, [proposal.id]: false }))}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Member name (e.g. Cruz, Mateo)..."
                        value={newCandidateNameMap[proposal.id] || ''}
                        onChange={(e) => setNewCandidateNameMap(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                        className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="text"
                        placeholder="Note / rationale (e.g. active, strong teacher)..."
                        value={newCandidateNoteMap[proposal.id] || ''}
                        onChange={(e) => setNewCandidateNoteMap(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                        className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddNewCandidate(proposal.id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add to Candidate Pool</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Candidate List Cards */}
                {candidates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {candidates.map((cand) => {
                      const isSelected = 
                        cand.id === proposal.selectedCandidateId || 
                        proposal.proposedMemberName.toLowerCase() === cand.name.toLowerCase();
                      const existingCallings = getMemberCurrentCallings(cand.name);

                      return (
                        <div
                          key={cand.id}
                          className={`p-3 rounded-xl border transition-all space-y-2 relative ${
                            isSelected
                              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs text-slate-900">
                                  {cand.name}
                                </span>
                                {isSelected && (
                                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.2 rounded-full flex items-center space-x-0.5">
                                    <Check className="w-3 h-3" />
                                    <span>Selected Choice</span>
                                  </span>
                                )}
                              </div>

                              {cand.note && (
                                <p className="text-[11px] text-slate-600 italic">
                                  "{cand.note}"
                                </p>
                              )}
                            </div>

                            {/* Remove Candidate Option (if more than 1) */}
                            {candidates.length > 1 && onRemoveCandidateFromProposal && proposal.finalStatus !== 'sustained' && (
                              <button
                                type="button"
                                onClick={() => onRemoveCandidateFromProposal(proposal.id, cand.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Remove candidate from discussion"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Existing Calling Badge (if any) */}
                          {existingCallings.length > 0 && (
                            <div className="text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Currently: {existingCallings.map(c => `${c.title} (${c.organization})`).join(', ')}</span>
                            </div>
                          )}

                          {/* Selection Action Button */}
                          {proposal.finalStatus !== 'sustained' && (
                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">
                                {cand.addedBy ? `Added by ${cand.addedBy}` : ''}
                              </span>

                              {isSelected ? (
                                <span className="text-emerald-700 text-xs font-bold flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Active Candidate</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onSelectCandidate && onSelectCandidate(proposal.id, cand.id)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-colors shadow-2xs flex items-center space-x-1"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Select this Candidate</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span>No specific candidates entered in pool yet. Click "+ Propose Additional Name" to add candidates for comparison.</span>
                  </div>
                )}
              </div>

              {/* General Proposal Context Note */}
              {proposal.reasonNote && (
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Proposal Context / Note:</span> {proposal.reasonNote}
                </div>
              )}

              {/* 3-Point Matrix Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {(['bishop', 'first_counselor', 'second_counselor'] as const).map((role) => {
                  const leader = BISHOPRIC_LEADERS[role];
                  const app = proposal.approvals[role];
                  const isMe = activeRole === role;

                  return (
                    <div
                      key={role}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        app.status === 'approved'
                          ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                          : app.status === 'rejected'
                          ? 'bg-rose-50/60 border-rose-200/80 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      } ${isMe ? 'ring-2 ring-slate-900/10' : ''}`}
                    >
                      <div>
                        <span className="font-semibold block">{leader.title}</span>
                        <span className="text-[10px] text-slate-500">{leader.name}</span>
                      </div>

                      {app.status === 'approved' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : app.status === 'rejected' ? (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* History Toggle */}
              {proposal.statusHistory && proposal.statusHistory.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowHistoryMap(prev => ({ ...prev, [proposal.id]: !prev[proposal.id] }))}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                  >
                    <History className="w-3 h-3 text-slate-400" />
                    <span>Discussion & Action Log ({proposal.statusHistory.length})</span>
                    {showHistoryMap[proposal.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showHistoryMap[proposal.id] && (
                    <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5 max-h-36 overflow-y-auto">
                      {proposal.statusHistory.map((h, i) => (
                        <div key={i} className="flex items-start justify-between border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                          <div>
                            <span className="font-semibold text-slate-700">{h.action}</span>
                            {h.actor && <span className="text-slate-500"> by {h.actor}</span>}
                            {h.note && <p className="text-slate-600 italic">"{h.note}"</p>}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">{h.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                {proposal.finalStatus === 'pending_review' && (
                  <div className="w-full sm:w-auto flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder={`Add optional note as ${currentLeader.title}...`}
                      value={noteInputMap[proposal.id] || ''}
                      onChange={(e) => handleNoteChange(proposal.id, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end ml-auto">
                  {proposal.finalStatus === 'pending_review' && (
                    <>
                      <button
                        onClick={() => handleAction(proposal.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() => handleAction(proposal.id, 'approved')}
                        disabled={isUndecided}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs ${
                          isUndecided
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                        title={isUndecided ? 'Please select a candidate before sign-off' : `Sign off as ${currentLeader.title}`}
                      >
                        {isUndecided ? 'Select Candidate First' : `Sign Off (${currentLeader.title})`}
                      </button>
                    </>
                  )}

                  {isFullyApproved && proposal.finalStatus !== 'sustained' && (
                    <button
                      onClick={() => onSustainCalling(proposal)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Mark Sustained in Ward Meeting</span>
                    </button>
                  )}

                  {currentUser.isSuperAdmin && !isFullyApproved && onSuperAdminApproveAll && (
                    <button
                      onClick={() => onSuperAdminApproveAll(proposal.id)}
                      disabled={isUndecided}
                      className={`font-bold text-xs py-1.5 px-3 rounded-xl transition-colors shadow-2xs flex items-center space-x-1 ${
                        isUndecided
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Approve All 3</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {displayedProposals.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Proposals in Queue</h3>
            <p className="text-xs text-slate-400">Proposals will appear here as leaders submit recommendations.</p>
          </div>
        )}
      </div>

    </div>
  );
};

