import React, { useState } from 'react';
import { BishopricRole, CallingProposal, ApprovalStatus, AuthUser, Calling, CandidateOption } from '../types';
import { BISHOPRIC_LEADERS } from '../data/initialData';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  CheckCheck, 
  Calendar,
  Zap,
  FileCheck2,
  HelpCircle,
  UserPlus,
  UserCheck,
  Check,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  History,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RotateCcw,
  Mic,
  BookmarkCheck,
  Building2,
  FileText,
  Copy,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ApprovalsQueueProps {
  currentUser: AuthUser;
  proposals: CallingProposal[];
  allCallings: Calling[];
  activeRole: BishopricRole;
  onRoleChange?: (role: BishopricRole) => void;
  onUpdateApproval: (proposalId: string, role: BishopricRole, status: ApprovalStatus, note?: string) => void;
  onAssignInterviewer?: (proposalId: string, interviewerRole: BishopricRole, interviewerName: string, interviewDate?: string, note?: string) => void;
  onInterviewCompleted?: (proposalId: string, note?: string, targetSunday?: string) => void;
  onMemberDeclined?: (proposalId: string, reasonNote: string, resetForDiscussion?: boolean) => void;
  onMarkSustained: (proposal: CallingProposal, sacramentDate?: string) => void;
  onMarkRecordedInLCR?: (proposalId: string, lcrNote?: string, clerkName?: string) => void;
  onToggleSetApart?: (callingId: string) => void;
  onResetProposal?: (proposalId: string, reason?: string) => void;
  onClearAllLogs?: () => void;
  onClearProposalHistory?: (proposalId: string) => void;
  onUpdateProposalCandidate?: (proposalId: string, candidateName: string) => void;
  onSelectCandidate?: (proposalId: string, candidateId: string) => void;
  onAddCandidateToProposal?: (proposalId: string, candidateName: string, note?: string) => void;
  onRemoveCandidateFromProposal?: (proposalId: string, candidateId: string) => void;
  onSuperAdminApproveAll?: (proposalId: string) => void;
  onDeleteProposal?: (proposalId: string, title?: string) => void;
  activeSubTab?: 'pending' | 'for_interview' | 'for_sustaining' | 'for_recording' | 'declined';
  onSubTabChange?: (tab: 'pending' | 'for_interview' | 'for_sustaining' | 'for_recording' | 'declined') => void;
}

export const ApprovalsQueue: React.FC<ApprovalsQueueProps> = ({
  currentUser,
  proposals,
  allCallings,
  activeRole,
  onRoleChange,
  onUpdateApproval,
  onAssignInterviewer,
  onInterviewCompleted,
  onMemberDeclined,
  onMarkSustained,
  onMarkRecordedInLCR,
  onToggleSetApart,
  onResetProposal,
  onClearAllLogs,
  onClearProposalHistory,
  onUpdateProposalCandidate,
  onSelectCandidate,
  onAddCandidateToProposal,
  onRemoveCandidateFromProposal,
  onSuperAdminApproveAll,
  onDeleteProposal,
  activeSubTab = 'pending',
  onSubTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'pending' | 'for_interview' | 'for_sustaining' | 'for_recording' | 'declined'>(activeSubTab);
  const activeTab = onSubTabChange ? activeSubTab : internalTab;
  const setActiveTab = (tab: 'pending' | 'for_interview' | 'for_sustaining' | 'for_recording' | 'declined') => {
    if (onSubTabChange) onSubTabChange(tab);
    setInternalTab(tab);
  };

  const [noteInputMap, setNoteInputMap] = useState<Record<string, string>>({});
  const [newCandidateNameMap, setNewCandidateNameMap] = useState<Record<string, string>>({});
  const [newCandidateNoteMap, setNewCandidateNoteMap] = useState<Record<string, string>>({});
  const [showAddCandidateMap, setShowAddCandidateMap] = useState<Record<string, boolean>>({});
  const [showHistoryMap, setShowHistoryMap] = useState<Record<string, boolean>>({});

  // Interview stage state
  const [assignedLeaderMap, setAssignedLeaderMap] = useState<Record<string, BishopricRole>>({});
  const [interviewDateMap, setInterviewDateMap] = useState<Record<string, string>>({});
  const [interviewNoteMap, setInterviewNoteMap] = useState<Record<string, string>>({});

  // Sustaining stage state
  const [sacramentDateMap, setSacramentDateMap] = useState<Record<string, string>>({});

  // Decline modal state
  const [declineModalProposal, setDeclineModalProposal] = useState<CallingProposal | null>(null);
  const [declineReasonText, setDeclineReasonText] = useState('');

  // Determine effective signing role for current user
  const effectiveSigningRole: BishopricRole = currentUser.isSuperAdmin 
    ? activeRole 
    : (['bishop', 'first_counselor', 'second_counselor', 'executive_secretary'].includes(currentUser.role)
        ? (currentUser.role as BishopricRole)
        : 'bishop');

  const currentLeader = BISHOPRIC_LEADERS[effectiveSigningRole] || BISHOPRIC_LEADERS.bishop;

  // Determine if user has administrator privileges
  const isAdmin = currentUser.isSuperAdmin || 
    ['bishop', 'first_counselor', 'second_counselor', 'clerk', 'executive_secretary', 'exec_sec'].includes(currentUser.role);

  // Filter proposals into the 4 structured stages + declined
  const pendingProposals = proposals.filter(p => p.finalStatus === 'pending_review');
  
  const forInterviewProposals = proposals.filter(p => 
    p.finalStatus === 'for_interview' || p.finalStatus === 'approved_for_action'
  );
  
  const forSustainingProposals = proposals.filter(p => p.finalStatus === 'for_sustaining');
  
  const forRecordingProposals = proposals.filter(p => 
    p.finalStatus === 'for_recording' || p.finalStatus === 'sustained'
  );
  
  const declinedProposals = proposals.filter(p => p.finalStatus === 'declined');

  const displayedProposals = 
    activeTab === 'pending' ? pendingProposals :
    activeTab === 'for_interview' ? forInterviewProposals :
    activeTab === 'for_sustaining' ? forSustainingProposals :
    activeTab === 'for_recording' ? forRecordingProposals : declinedProposals;

  const handleNoteChange = (proposalId: string, text: string) => {
    setNoteInputMap(prev => ({ ...prev, [proposalId]: text }));
  };

  const handleActionForRole = (proposalId: string, roleToUpdate: BishopricRole, status: ApprovalStatus) => {
    if (roleToUpdate === 'executive_secretary' && !currentUser.isSuperAdmin) {
      alert('Executive Secretary is in View-Only mode for bishopric sign-offs.');
      return;
    }

    const note = noteInputMap[proposalId] || '';
    onUpdateApproval(proposalId, roleToUpdate, status, note);
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

  // Interview stage assignment handler
  const handleSaveInterviewAssignment = (proposal: CallingProposal) => {
    const role = assignedLeaderMap[proposal.id] || proposal.assignedInterviewerRole || 'bishop';
    const leaderInfo = BISHOPRIC_LEADERS[role] || BISHOPRIC_LEADERS.bishop;
    const date = interviewDateMap[proposal.id] || proposal.interviewDate || 'Upcoming interview';
    const note = interviewNoteMap[proposal.id] || proposal.interviewNotes || '';

    if (onAssignInterviewer) {
      onAssignInterviewer(proposal.id, role, leaderInfo.name, date, note);
    }
  };

  // Submit Member Decline modal
  const handleConfirmDecline = () => {
    if (!declineModalProposal) return;
    const reason = declineReasonText.trim() || 'Member declined calling interview';
    if (onMemberDeclined) {
      onMemberDeclined(declineModalProposal.id, reason, true);
    }
    setDeclineModalProposal(null);
    setDeclineReasonText('');
  };

  return (
    <div className="space-y-5">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Bishopric Calling Workflow</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Complete end-to-end calling lifecycle: candidate deliberations, 3-point unanimity sign-offs, interview assignment, sacrament meeting sustaining, and LCR recording.
          </p>
        </div>

        {/* Current User Role Badge / Super Admin Switcher */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Logged In As</span>
            <span className="text-xs font-bold text-slate-800 block leading-tight">{currentUser.name}</span>
            <span className="text-[10px] text-slate-500 font-medium block leading-tight">{currentUser.calling}</span>
          </div>

          {currentUser.isSuperAdmin && onRoleChange && (
            <div className="pl-2 border-l border-slate-200 flex flex-col space-y-1">
              <span className="text-[9px] uppercase font-bold text-blue-600">Signing As:</span>
              <select
                value={activeRole}
                onChange={(e) => onRoleChange(e.target.value as BishopricRole)}
                className="text-[11px] font-bold bg-white border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="bishop">Bishop (Francis Reyes)</option>
                <option value="first_counselor">1st Counselor (Jim Albos)</option>
                <option value="second_counselor">2nd Counselor (Alfred Ardon)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4-Stage Workflow Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center space-x-1.5 shrink-0">
          
          {/* Stage 1: Pending Review */}
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            id="tab-pending-review"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Pending Review</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {pendingProposals.length}
            </span>
          </button>

          {/* Stage 2: For Interview */}
          <button
            onClick={() => setActiveTab('for_interview')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'for_interview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            id="tab-for-interview"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span>2. For Interview</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'for_interview' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {forInterviewProposals.length}
            </span>
          </button>

          {/* Stage 3: For Sustaining */}
          <button
            onClick={() => setActiveTab('for_sustaining')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'for_sustaining'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            id="tab-for-sustaining"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. For Sustaining</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'for_sustaining' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {forSustainingProposals.length}
            </span>
          </button>

          {/* Stage 4: For Recording */}
          <button
            onClick={() => setActiveTab('for_recording')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'for_recording'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            id="tab-for-recording"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>4. For Recording</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'for_recording' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {forRecordingProposals.length}
            </span>
          </button>

          {/* Secondary Filter: Declined */}
          {declinedProposals.length > 0 && (
            <button
              onClick={() => setActiveTab('declined')}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'declined'
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
              id="tab-declined"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Declined ({declinedProposals.length})</span>
            </button>
          )}

        </div>

        {proposals.some(p => (p.statusHistory && p.statusHistory.length > 0) || p.approvals?.bishop?.note || p.approvals?.first_counselor?.note || p.approvals?.second_counselor?.note) && onClearAllLogs && (
          <button
            type="button"
            onClick={onClearAllLogs}
            className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors flex items-center space-x-1.5 shrink-0 ml-auto"
            title="Clear discussion and action log history across all proposals"
          >
            <Trash2 className="w-3 h-3 text-rose-500" />
            <span>Clear All Logs</span>
          </button>
        )}
      </div>

      {/* Stage Context Banner */}
      <div className="bg-white/90 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
        {activeTab === 'pending' && (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span><strong>Stage 1 (Pending Review):</strong> Review proposed candidates, deliberate in bishopric meeting, and record 3-point unanimity sign-offs. Once all 3 approve, proposals move automatically to <strong>For Interview</strong>.</span>
          </div>
        )}
        {activeTab === 'for_interview' && (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span><strong>Stage 2 (For Interview):</strong> All 3 Bishopric sign-offs are complete. Assign an interviewer, schedule the appointment, and extend the calling. If accepted, move to Sustaining; if declined, reset for council discussion.</span>
          </div>
        )}
        {activeTab === 'for_sustaining' && (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span><strong>Stage 3 (For Sustaining):</strong> Interview completed and calling accepted. Ready for Sacrament Meeting sustaining vote. Click <strong>Mark Sustained</strong> to update ward directory.</span>
          </div>
        )}
        {activeTab === 'for_recording' && (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span><strong>Stage 4 (For Recording):</strong> Callings sustained in sacrament meeting. Record in Leader and Clerk Resources (LCR) and track setting apart by the Bishopric.</span>
          </div>
        )}
        {activeTab === 'declined' && (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span><strong>Declined Proposals:</strong> Recommendations that were declined during voting or where a candidate was unable to accept. Administrators can reset for discussion anytime.</span>
          </div>
        )}
      </div>

      {/* Proposal Cards List */}
      <div className="space-y-4">
        {displayedProposals.map((proposal) => {
          const safeApprovals = {
            bishop: { status: proposal.approvals?.bishop?.status || 'pending', ...(proposal.approvals?.bishop || {}) },
            first_counselor: { status: proposal.approvals?.first_counselor?.status || 'pending', ...(proposal.approvals?.first_counselor || {}) },
            second_counselor: { status: proposal.approvals?.second_counselor?.status || 'pending', ...(proposal.approvals?.second_counselor || {}) },
          };

          const approvalValues = [
            safeApprovals.bishop.status,
            safeApprovals.first_counselor.status,
            safeApprovals.second_counselor.status,
          ];
          const approvedCount = approvalValues.filter(s => s === 'approved').length;
          const isFullyApproved = approvedCount === 3 || proposal.finalStatus === 'approved_for_action' || proposal.finalStatus === 'for_interview';

          const candidates = proposal.candidates || [];
          const hasMultipleCandidates = candidates.length > 1;
          const isUndecided = !proposal.proposedMemberName || proposal.proposedMemberName.toLowerCase().includes('to be discussed');

          // User's own approval status
          const mySigningRole = effectiveSigningRole === 'executive_secretary' ? 'bishop' : effectiveSigningRole;
          const myStatus = safeApprovals[mySigningRole as 'bishop' | 'first_counselor' | 'second_counselor']?.status || 'pending';
          const canCurrentUserSign = currentUser.isSuperAdmin || ['bishop', 'first_counselor', 'second_counselor'].includes(currentUser.role);

          // Matching calling for additional context
          const matchingCalling = allCallings.find(c => c.id === proposal.callingId);

          return (
            <div
              key={proposal.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
              id={`proposal-card-${proposal.id}`}
            >
              {/* Proposal Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {proposal.organization} • {proposal.subOrg}
                    </span>
                    {hasMultipleCandidates && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{candidates.length} Candidates to Discuss</span>
                      </span>
                    )}
                    {isFullyApproved && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>3/3 Approved</span>
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

              {/* Release / Target Call Context Banner */}
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
                  <span className="text-slate-400 font-medium">Proposed Candidate:</span>
                  {isUndecided ? (
                    <span className="inline-flex items-center space-x-1 font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                      <HelpCircle className="w-3 h-3 text-amber-700" />
                      <span>{proposal.proposedMemberName || 'To be discussed'}</span>
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{proposal.proposedMemberName}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* STAGE 1: CANDIDATE DISCUSSION POOL (for Pending Review or any discussion) */}
              {/* ========================================================================= */}
              {activeTab === 'pending' && (
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs text-slate-800">
                        Candidate Consideration Pool
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({candidates.length} {candidates.length === 1 ? 'name' : 'names'} under review)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddCandidateMap(prev => ({ ...prev, [proposal.id]: !prev[proposal.id] }))}
                      className="bg-white hover:bg-slate-100 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3 text-blue-600" />
                      <span>+ Propose Additional Name</span>
                    </button>
                  </div>

                  {/* Inline Form to Add Alternative Candidate */}
                  {showAddCandidateMap[proposal.id] && (
                    <div className="p-3 bg-white border border-blue-200 rounded-xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">Add Another Candidate for Bishopric Discussion:</span>
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
                          className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Note / rationale (e.g. active, strong teacher)..."
                          value={newCandidateNoteMap[proposal.id] || ''}
                          onChange={(e) => setNewCandidateNoteMap(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                          className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleAddNewCandidate(proposal.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
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
                                      <span>Active Choice</span>
                                    </span>
                                  )}
                                </div>

                                {cand.note && (
                                  <p className="text-[11px] text-slate-600 italic">
                                    "{cand.note}"
                                  </p>
                                )}
                              </div>

                              {candidates.length > 1 && onRemoveCandidateFromProposal && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveCandidateFromProposal(proposal.id, cand.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Remove candidate from pool"
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
                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">
                                {cand.addedBy ? `Added by ${cand.addedBy}` : ''}
                              </span>

                              {isSelected ? (
                                <span className="text-emerald-700 text-xs font-bold flex items-center space-x-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Selected for Vote</span>
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
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                      <span>No candidates entered in pool yet. Click "+ Propose Additional Name" to add names for council deliberation.</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3-Point Matrix Status Cards */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                  <span>3-Point Bishopric Approval Sign-Offs</span>
                  <span className="text-[10px] text-slate-400">All 3 required for interview</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['bishop', 'first_counselor', 'second_counselor'] as const).map((role) => {
                    const leader = BISHOPRIC_LEADERS[role];
                    const app = safeApprovals[role];
                    const isMyCard = effectiveSigningRole === role;

                    return (
                      <div
                        key={role}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-1.5 transition-all ${
                          app.status === 'approved'
                            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950 shadow-2xs'
                            : app.status === 'rejected'
                            ? 'bg-rose-50/70 border-rose-200/80 text-rose-950 shadow-2xs'
                            : 'bg-slate-50 border-slate-200/80 text-slate-700'
                        } ${isMyCard ? 'ring-1 ring-slate-900/10' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold block text-xs truncate">{leader.title}</span>
                            <span className="text-[11px] text-slate-500 block truncate">{leader.name}</span>
                          </div>

                          {app.status === 'approved' ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          ) : app.status === 'rejected' ? (
                            <span className="bg-rose-100 text-rose-800 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Declined</span>
                            </span>
                          ) : (
                            <span className="bg-slate-200/70 text-slate-600 font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Pending</span>
                            </span>
                          )}
                        </div>

                        {app.note && (
                          <p className="text-[10px] text-slate-500 italic bg-white/60 p-1.5 rounded-lg border border-slate-200/40">
                            "{app.note}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* STAGE 2: FOR INTERVIEW SECTION                                            */}
              {/* ========================================================================= */}
              {activeTab === 'for_interview' && (
                <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-200/80 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/60 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Mic className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-xs text-indigo-950">
                        Interview &amp; Calling Extension Assignment
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                      Candidate: <strong>{proposal.proposedMemberName}</strong>
                    </span>
                  </div>

                  {/* Interviewer Selector & Schedule */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Assigned Interviewer:
                      </label>
                      <select
                        value={assignedLeaderMap[proposal.id] || proposal.assignedInterviewerRole || 'bishop'}
                        onChange={(e) => {
                          const newRole = e.target.value as BishopricRole;
                          setAssignedLeaderMap(prev => ({ ...prev, [proposal.id]: newRole }));
                          const leader = BISHOPRIC_LEADERS[newRole];
                          if (onAssignInterviewer) {
                            onAssignInterviewer(
                              proposal.id, 
                              newRole, 
                              leader.name, 
                              interviewDateMap[proposal.id] || proposal.interviewDate,
                              interviewNoteMap[proposal.id] || proposal.interviewNotes
                            );
                          }
                        }}
                        className="w-full text-xs font-semibold bg-white border border-indigo-200 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                      >
                        <option value="bishop">Bishop (Francis Reyes)</option>
                        <option value="first_counselor">1st Counselor (Jim Albos)</option>
                        <option value="second_counselor">2nd Counselor (Alfred Ardon)</option>
                        <option value="executive_secretary">Exec Secretary (Coordination)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Scheduled Interview Date:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sunday, 1:30 PM / Oct 12"
                        value={interviewDateMap[proposal.id] !== undefined ? interviewDateMap[proposal.id] : (proposal.interviewDate || '')}
                        onChange={(e) => setInterviewDateMap(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                        onBlur={() => handleSaveInterviewAssignment(proposal)}
                        className="w-full text-xs bg-white border border-indigo-200 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Private Interview Notes:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Spoke with spouse; will meet in office"
                        value={interviewNoteMap[proposal.id] !== undefined ? interviewNoteMap[proposal.id] : (proposal.interviewNotes || '')}
                        onChange={(e) => setInterviewNoteMap(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                        onBlur={() => handleSaveInterviewAssignment(proposal)}
                        className="w-full text-xs bg-white border border-indigo-200 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Interview Actions Bar */}
                  <div className="pt-2 border-t border-indigo-200/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-indigo-900 font-medium">
                      {proposal.assignedInterviewer ? (
                        <span>Assigned to: <strong>{proposal.assignedInterviewer}</strong> ({proposal.assignedInterviewerRole?.replace('_', ' ')})</span>
                      ) : (
                        <span>Select a Bishopric member above to assign this interview.</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Member Declined Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setDeclineModalProposal(proposal);
                          setDeclineReasonText('');
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                        title="If member declined, reset approvals and return to discussion pool"
                        id={`btn-decline-interview-${proposal.id}`}
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Member Declined Calling</span>
                      </button>

                      {/* Interview Completed & Accepted Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const note = interviewNoteMap[proposal.id] || proposal.interviewNotes || 'Calling extended and accepted';
                          if (onInterviewCompleted) {
                            onInterviewCompleted(proposal.id, note);
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                        id={`btn-complete-interview-${proposal.id}`}
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>✓ Interview Done &amp; Accepted</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STAGE 3: FOR SUSTAINING SECTION                                           */}
              {/* ========================================================================= */}
              {activeTab === 'for_sustaining' && (
                <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200/80 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs text-emerald-950">
                        Sacrament Meeting Sustaining Agenda
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Interview Verified • Ready for Ward Vote
                    </span>
                  </div>

                  {/* Sustaining Details Card */}
                  <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-200/60 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Sustaining Calling</span>
                        <div className="font-bold text-slate-900 text-sm">
                          {proposal.callingTitle}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Proposed Member</span>
                        <div className="font-bold text-emerald-800 text-sm">
                          {proposal.proposedMemberName}
                        </div>
                      </div>
                    </div>

                    {proposal.currentMemberName && (
                      <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 text-[11px] text-slate-600">
                        <span className="text-slate-400 font-medium">Releasing Member (vote of thanks):</span>
                        <strong className="text-slate-800 font-semibold">{proposal.currentMemberName}</strong>
                      </div>
                    )}
                  </div>

                  {/* Sustaining Action Bar */}
                  <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-emerald-900">
                      Once presented and sustained in sacrament meeting, click to update the active directory and advance to LCR recording.
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const date = sacramentDateMap[proposal.id] || new Date().toISOString().split('T')[0];
                          onMarkSustained(proposal, date);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                        id={`btn-mark-sustained-${proposal.id}`}
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>✓ Mark Sustained in Sacrament Meeting</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STAGE 4: FOR RECORDING SECTION                                            */}
              {/* ========================================================================= */}
              {activeTab === 'for_recording' && (
                <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200/80 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <BookmarkCheck className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs text-blue-950">
                        Post-Sustaining Processing &amp; LCR Recording
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      Sustained in Ward Meeting
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* LCR Status Card */}
                    <div className="bg-white/90 p-3 rounded-xl border border-blue-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Leader &amp; Clerk Resources (LCR):</span>
                        {proposal.isRecordedInLCR ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Recorded in LCR</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Entry in LCR</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600">
                        {proposal.isRecordedInLCR 
                          ? `Recorded on ${proposal.recordedInLCRDate || 'recently'} by ${proposal.recordedByClerk || 'Ward Clerk'}`
                          : 'Clerk must record this sustained calling in Church LCR system.'}
                      </p>

                      {!proposal.isRecordedInLCR && onMarkRecordedInLCR && (
                        <button
                          type="button"
                          onClick={() => onMarkRecordedInLCR(proposal.id, 'Entry completed in Church LCR system', currentUser.name)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Recorded in LCR</span>
                        </button>
                      )}
                    </div>

                    {/* Setting Apart Tracker */}
                    <div className="bg-white/90 p-3 rounded-xl border border-blue-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Setting Apart Status:</span>
                        {matchingCalling?.setApart ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            • Set Apart
                          </span>
                        ) : (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            • Needs Setting Apart
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600">
                        {matchingCalling?.setApart
                          ? 'Member has received priesthood blessing and is set apart in this calling.'
                          : 'Member requires a priesthood blessing / setting apart by the Bishopric.'}
                      </p>

                      {onToggleSetApart && (
                        <button
                          type="button"
                          onClick={() => onToggleSetApart(proposal.callingId)}
                          className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                            matchingCalling?.setApart
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{matchingCalling?.setApart ? 'Mark Needs Setting Apart' : 'Mark Set Apart'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* History Toggle */}
              {proposal.statusHistory && proposal.statusHistory.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowHistoryMap(prev => ({ ...prev, [proposal.id]: !prev[proposal.id] }))}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                    >
                      <History className="w-3 h-3 text-slate-400" />
                      <span>Discussion &amp; Action Log ({proposal.statusHistory.length})</span>
                      {showHistoryMap[proposal.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {onClearProposalHistory && (
                      <button
                        type="button"
                        onClick={() => onClearProposalHistory(proposal.id)}
                        className="text-[10px] font-medium text-slate-400 hover:text-rose-600 transition-colors flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-rose-50"
                        title="Clear action log for this proposal"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {showHistoryMap[proposal.id] && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5 max-h-36 overflow-y-auto">
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
                {proposal.finalStatus !== 'sustained' && proposal.finalStatus !== 'for_recording' && (
                  <div className="w-full sm:w-auto flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder={`Add optional discussion or reset note...`}
                      value={noteInputMap[proposal.id] || ''}
                      onChange={(e) => handleNoteChange(proposal.id, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center space-x-2 w-full sm:w-auto justify-end ml-auto">
                  
                  {/* Universal Admin Reset for Discussion Button */}
                  {isAdmin && onResetProposal && (
                    <button
                      type="button"
                      onClick={() => {
                        const customNote = noteInputMap[proposal.id];
                        const reason = customNote && customNote.trim() 
                          ? customNote.trim() 
                          : `Reset from ${activeTab.replace('_', ' ')} for Bishopric discussion`;
                        onResetProposal(proposal.id, reason);
                        setNoteInputMap(prev => ({ ...prev, [proposal.id]: '' }));
                      }}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs py-1.5 px-3 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                      title="Reset all 3 approvals to pending and return to Pending Review for further discussion"
                      id={`btn-reset-discussion-${proposal.id}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Reset for Discussion</span>
                    </button>
                  )}

                  {/* Pending Review Voting Actions */}
                  {activeTab === 'pending' && canCurrentUserSign && (
                    <>
                      {myStatus === 'approved' ? (
                        <div className="flex items-center space-x-2">
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Signed Off as {currentLeader.title}</span>
                          </span>
                          <button
                            onClick={() => handleActionForRole(proposal.id, effectiveSigningRole, 'rejected')}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            Change to Decline
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleActionForRole(proposal.id, effectiveSigningRole, 'rejected')}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                          >
                            Decline
                          </button>

                          <button
                            onClick={() => handleActionForRole(proposal.id, effectiveSigningRole, 'approved')}
                            disabled={isUndecided}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center space-x-1.5 ${
                              isUndecided
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                            title={isUndecided ? 'Please select a candidate before sign-off' : `Sign off as ${currentLeader.title}`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isUndecided ? 'Select Candidate First' : `Sign Off (${currentLeader.title})`}</span>
                          </button>
                        </>
                      )}

                      {/* Super Admin Quick Approve All in Pending View */}
                      {currentUser.isSuperAdmin && !isFullyApproved && onSuperAdminApproveAll && (
                        <button
                          type="button"
                          onClick={() => onSuperAdminApproveAll(proposal.id)}
                          disabled={isUndecided}
                          className={`font-bold text-xs py-1.5 px-3 rounded-xl transition-colors shadow-2xs flex items-center space-x-1 ${
                            isUndecided
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Approve All 3</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Declined Status Specific Actions */}
                  {activeTab === 'declined' && canCurrentUserSign && myStatus === 'rejected' && (
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleActionForRole(proposal.id, effectiveSigningRole, 'approved')}
                        disabled={isUndecided}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 ${
                          isUndecided
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Change My Decision to Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionForRole(proposal.id, effectiveSigningRole, 'pending')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reset My Vote</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>
          );
        })}

        {displayedProposals.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Proposals in this Stage</h3>
            <p className="text-xs text-slate-400">
              {activeTab === 'pending' && 'Proposals awaiting Bishopric review will appear here.'}
              {activeTab === 'for_interview' && 'Proposals with all 3 Bishopric sign-offs will appear here for interview assignment.'}
              {activeTab === 'for_sustaining' && 'Proposals with completed and accepted interviews will appear here for sacrament meeting.'}
              {activeTab === 'for_recording' && 'Callings sustained in sacrament meeting will appear here for LCR clerk entry.'}
              {activeTab === 'declined' && 'No declined proposals currently on file.'}
            </p>
          </div>
        )}
      </div>

      {/* Decline Reason Modal */}
      {declineModalProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Record Member Decline</h3>
              <button
                onClick={() => setDeclineModalProposal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{declineModalProposal.proposedMemberName}</strong> was unable to accept the calling as <strong>{declineModalProposal.callingTitle}</strong>. 
              Submitting will record the reason, reset the 3-point sign-offs to pending, and bring the calling back into <strong>Pending Review</strong> so the Bishopric can discuss alternate candidate names.
            </p>

            <textarea
              placeholder="Enter reason / notes (e.g. personal circumstances, health, scheduling, work conflicts)..."
              value={declineReasonText}
              onChange={(e) => setDeclineReasonText(e.target.value)}
              rows={3}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalProposal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs"
              >
                Reset for Discussion
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
