import React, { useState } from 'react';
import { BishopricRole, CallingProposal, ApprovalStatus, AuthUser, Calling, CandidateOption, CouncilMessage } from '../types';
import { BISHOPRIC_LEADERS } from '../data/initialData';
import { getUpcomingSunday, formatDateReadable } from '../utils/dateUtils';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  CheckCheck, 
  Calendar,
  Zap,
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
  Sparkles,
  ArrowRight,
  UserX,
  Send,
  AlertTriangle,
  MessageSquare,
  MessageCircle
} from 'lucide-react';

interface ApprovalsQueueProps {
  currentUser: AuthUser;
  proposals: CallingProposal[];
  allCallings: Calling[];
  activeRole: BishopricRole;
  councilMessages?: CouncilMessage[];
  onRoleChange?: (role: BishopricRole) => void;
  onUpdateApproval: (proposalId: string, role: BishopricRole, status: ApprovalStatus, note?: string) => void;
  onAssignInterviewer?: (proposalId: string, interviewerRole: BishopricRole, interviewerName: string, interviewDate?: string, note?: string) => void;
  onInterviewCompleted?: (proposalId: string, note?: string, targetSunday?: string) => void;
  onMemberDeclined?: (proposalId: string, reasonNote: string, resetForDiscussion?: boolean, promoteCandidateId?: string) => void;
  onMarkSustained: (proposal: CallingProposal, sacramentDate?: string) => void;
  onMarkRecordedInLCR?: (proposalId: string, lcrNote?: string, clerkName?: string) => void;
  onMarkAllRecordedInLCR?: () => void;
  onToggleSetApart?: (callingId: string) => void;
  onResetProposal?: (proposalId: string, reason?: string) => void;
  onClearAllLogs?: () => void;
  onClearProposalHistory?: (proposalId: string) => void;
  onUpdateProposalCandidate?: (proposalId: string, candidateName: string) => void;
  onSelectCandidate?: (proposalId: string, candidateId: string) => void;
  onAddCandidateToProposal?: (proposalId: string, candidateName: string, note?: string) => void;
  onRemoveCandidateFromProposal?: (proposalId: string, candidateId: string) => void;
  onAddDiscussionNote?: (proposalId: string, note: string) => void;
  onRemoveDiscussionNote?: (proposalId: string, noteIndex: number, noteId?: string) => void;
  onPostCouncilMessage?: (proposalId: string, text: string) => void;
  onDeleteCouncilMessage?: (messageId: string) => void;
  onFinalizeCandidateForStage1?: (proposalId: string, candidateName: string, candidateId?: string, note?: string) => void;
  onCloseDiscussion?: (proposalId: string, note?: string) => void;
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
  councilMessages = [],
  onRoleChange,
  onUpdateApproval,
  onAssignInterviewer,
  onInterviewCompleted,
  onMemberDeclined,
  onMarkSustained,
  onMarkRecordedInLCR,
  onMarkAllRecordedInLCR,
  onToggleSetApart,
  onResetProposal,
  onClearAllLogs,
  onClearProposalHistory,
  onUpdateProposalCandidate,
  onSelectCandidate,
  onAddCandidateToProposal,
  onRemoveCandidateFromProposal,
  onAddDiscussionNote,
  onRemoveDiscussionNote,
  onPostCouncilMessage,
  onDeleteCouncilMessage,
  onFinalizeCandidateForStage1,
  onCloseDiscussion,
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
  const [showMessageBoardMap, setShowMessageBoardMap] = useState<Record<string, boolean>>({});
  const [messageBoardInputMap, setMessageBoardInputMap] = useState<Record<string, string>>({});
  const [discussionCommentMap, setDiscussionCommentMap] = useState<Record<string, string>>({});
  const [finalizeCustomNameMap, setFinalizeCustomNameMap] = useState<Record<string, string>>({});

  // Interview stage assignment state
  const [assignedLeaderMap, setAssignedLeaderMap] = useState<Record<string, BishopricRole>>({});

  // Sustaining stage custom date override
  const [sacramentDateMap, setSacramentDateMap] = useState<Record<string, string>>({});

  // Decline modal state (Stage 2 Interview decline)
  const [declineModalProposal, setDeclineModalProposal] = useState<CallingProposal | null>(null);
  const [declineReasonText, setDeclineReasonText] = useState('');
  const [declinePromoteCandidateId, setDeclinePromoteCandidateId] = useState<string>('');

  // Stage 1: Decline / For Discussion Vote Modal
  const [discussionVoteModal, setDiscussionVoteModal] = useState<{ proposal: CallingProposal; role: BishopricRole } | null>(null);
  const [discussionVoteNote, setDiscussionVoteNote] = useState('');

  // Submit Stage 1 Decline / For Discussion modal
  const handleConfirmDiscussionVote = () => {
    if (!discussionVoteModal) return;
    const { proposal, role } = discussionVoteModal;
    const note = discussionVoteNote.trim() || 'Declined / flagged for Bishopric discussion';
    onUpdateApproval(proposal.id, role, 'rejected', note);
    setDiscussionVoteModal(null);
    setDiscussionVoteNote('');
  };

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

  // Helper to determine if a proposal is "Open for Discussion" (no specific candidate yet)
  const isProposalOpenForDiscussion = (p: CallingProposal) => {
    return !p.proposedMemberName || p.proposedMemberName.trim() === '' || p.proposedMemberName.toLowerCase().includes('to be discussed');
  };

  // Filter proposals into the structured stages
  // Stage 1 (Pending Review): has a named candidate and pending review
  const pendingProposals = proposals.filter(p => 
    p.finalStatus === 'pending_review' && !isProposalOpenForDiscussion(p)
  );
  
  // Stage 2 (For Interview): all 3 approved
  const forInterviewProposals = proposals.filter(p => 
    p.finalStatus === 'for_interview' || p.finalStatus === 'approved_for_action'
  );
  
  // Stage 3 (For Sustaining): interview completed
  const forSustainingProposals = proposals.filter(p => p.finalStatus === 'for_sustaining');
  
  // Stage 4 (For Recording): sustained in sacrament meeting
  const forRecordingProposals = proposals.filter(p => 
    p.finalStatus === 'for_recording' || p.finalStatus === 'sustained'
  );
  
  const unrecordedProposalsCount = forRecordingProposals.filter(p => !p.isRecordedInLCR).length;

  // Declined / For Discussion: either explicitly declined OR open for discussion (no name selected)
  const declinedAndDiscussionProposals = proposals.filter(p => 
    p.finalStatus === 'declined' || 
    (p.finalStatus === 'pending_review' && isProposalOpenForDiscussion(p))
  );

  const displayedProposals = 
    activeTab === 'pending' ? pendingProposals :
    activeTab === 'for_interview' ? forInterviewProposals :
    activeTab === 'for_sustaining' ? forSustainingProposals :
    activeTab === 'for_recording' ? forRecordingProposals : declinedAndDiscussionProposals;

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

  // Post message to Council Message Board (Dedicated cloud collection)
  const handlePostMessage = (proposalId: string) => {
    const text = (messageBoardInputMap[proposalId] || '').trim();
    if (!text) return;

    if (onPostCouncilMessage) {
      onPostCouncilMessage(proposalId, text);
    } else if (onAddDiscussionNote) {
      onAddDiscussionNote(proposalId, text);
    }

    setMessageBoardInputMap(prev => ({ ...prev, [proposalId]: '' }));
    setShowMessageBoardMap(prev => ({ ...prev, [proposalId]: true }));
  };

  // Delete message from Council Message Board
  const handleDeleteMessage = (messageId: string) => {
    if (onDeleteCouncilMessage) {
      onDeleteCouncilMessage(messageId);
    }
  };

  // Helper to determine role badge colors for Council Message Board
  const getRoleBadgeClasses = (roleStr?: string) => {
    const r = (roleStr || '').toLowerCase();
    if (r.includes('super admin')) return 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    if (r.includes('bishop') && !r.includes('counselor') && !r.includes('bishopric')) return 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    if (r.includes('first counselor') || r.includes('1st')) return 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    if (r.includes('second counselor') || r.includes('2nd')) return 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    if (r.includes('clerk')) return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    if (r.includes('secretary')) return 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
  };

  // Helper to get author avatar initials
  const getAuthorInitials = (name?: string) => {
    if (!name) return 'LM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper to get author avatar background color
  const getAuthorAvatarBg = (name?: string) => {
    if (!name) return 'bg-slate-700 text-white';
    const charCode = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0);
    const colors = [
      'bg-indigo-600 text-white',
      'bg-blue-600 text-white',
      'bg-purple-600 text-white',
      'bg-teal-600 text-white',
      'bg-sky-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-rose-600 text-white'
    ];
    return colors[charCode % colors.length];
  };

  // Finalize selected or custom candidate name and send to Stage 1: Pending Review
  const handleFinalizeForStage1Submit = (proposal: CallingProposal) => {
    const selectedCand = (proposal.candidates || []).find(c => c.id === proposal.selectedCandidateId);
    const customName = (finalizeCustomNameMap[proposal.id] || '').trim();
    const candidateName = customName || (selectedCand ? selectedCand.name : (proposal.proposedMemberName && !proposal.proposedMemberName.toLowerCase().includes('to be discussed') ? proposal.proposedMemberName : ''));

    if (!candidateName || candidateName.trim() === '' || candidateName.toLowerCase().includes('to be discussed')) {
      alert('Please select a candidate from the pool or enter a candidate name to finalize.');
      return;
    }

    if (onFinalizeCandidateForStage1) {
      onFinalizeCandidateForStage1(
        proposal.id, 
        candidateName.trim(), 
        selectedCand?.id, 
        'Finalized candidate from council discussion. Ready for Stage 1 unanimity vote.'
      );
    }
    setFinalizeCustomNameMap(prev => ({ ...prev, [proposal.id]: '' }));
  };

  // Submit Member Decline modal
  const handleConfirmDecline = () => {
    if (!declineModalProposal) return;
    const reason = declineReasonText.trim() || 'Member declined calling interview';
    if (onMemberDeclined) {
      onMemberDeclined(declineModalProposal.id, reason, true, declinePromoteCandidateId || undefined);
    }
    setDeclineModalProposal(null);
    setDeclineReasonText('');
    setDeclinePromoteCandidateId('');
  };

  return (
    <div className="space-y-5">
      
      {/* Top 4-Stage Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-xs flex flex-wrap items-center gap-1.5 overflow-x-auto">
        
        {/* Stage 1: Pending Review */}
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          id="tab-stage1-pending"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Stage 1: Pending Review</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
          }`}>
            {pendingProposals.length}
          </span>
        </button>

        {/* Stage 2: For Interview */}
        <button
          type="button"
          onClick={() => setActiveTab('for_interview')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'for_interview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          id="tab-stage2-interview"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Stage 2: For Interview</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'for_interview' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'
          }`}>
            {forInterviewProposals.length}
          </span>
        </button>

        {/* Stage 3: For Sustaining */}
        <button
          type="button"
          onClick={() => setActiveTab('for_sustaining')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'for_sustaining'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          id="tab-stage3-sustaining"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Stage 3: For Sustaining</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'for_sustaining' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
          }`}>
            {forSustainingProposals.length}
          </span>
        </button>

        {/* Stage 4: For Recording & LCR */}
        <button
          type="button"
          onClick={() => setActiveTab('for_recording')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'for_recording'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          id="tab-stage4-recording"
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Stage 4: For Recording (LCR)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeTab === 'for_recording' ? 'bg-blue-700 text-white' : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
          }`}>
            {forRecordingProposals.length}
          </span>
        </button>

        {/* Declined / For Discussion Sub-tab */}
        <button
          type="button"
          onClick={() => setActiveTab('declined')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ml-auto ${
            activeTab === 'declined'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          id="tab-declined"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Declined / For Discussion</span>
          {declinedAndDiscussionProposals.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'declined' ? 'bg-rose-700 text-white' : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
            }`}>
              {declinedAndDiscussionProposals.length}
            </span>
          )}
        </button>

        {/* Clear All Logs Action (Super Admin Only) */}
        {currentUser.isSuperAdmin && onClearAllLogs && (
          <button
            type="button"
            onClick={onClearAllLogs}
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer"
            title="Clear discussion and action log history across all proposals (Super Admin Only)"
          >
            <Trash2 className="w-3 h-3 text-rose-500" />
            <span>Clear All Logs</span>
          </button>
        )}
      </div>

      {/* Stage Context Banner & Batch Action Bars */}
      <div className="space-y-2.5">
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          {activeTab === 'pending' && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span><strong>Stage 1 (Pending Review):</strong> Review proposed candidates, deliberate in bishopric meeting, and record 3-point unanimity sign-offs. Once all 3 approve, proposals move automatically to <strong>For Interview</strong>.</span>
            </div>
          )}
          {activeTab === 'for_interview' && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
              <span><strong>Stage 2 (For Interview):</strong> All 3 Bishopric sign-offs are complete. Select an interviewer to extend the calling. If accepted, move to Sustaining; if declined, reset for council discussion.</span>
            </div>
          )}
          {activeTab === 'for_sustaining' && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span><strong>Stage 3 (For Sustaining):</strong> Calling extended and accepted. Ready for Sacrament Meeting sustaining vote. Click <strong>Mark Sustained</strong> to update the live ward directory.</span>
            </div>
          )}
          {activeTab === 'for_recording' && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <span><strong>Stage 4 (For Recording):</strong> Callings sustained in sacrament meeting. Record in Leader and Clerk Resources (LCR) and track setting apart by the Bishopric.</span>
            </div>
          )}
          {activeTab === 'declined' && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span><strong>Declined &amp; Open For Discussion:</strong> Calling proposals needing council deliberation, polled names, or declined recommendations. Review vote breakdown, poll candidate names, log discussion notes, and finalize a name to send to Stage 1.</span>
            </div>
          )}
        </div>

        {/* Stage 4 Batch Action Bar for Clerk */}
        {activeTab === 'for_recording' && unrecordedProposalsCount > 0 && onMarkAllRecordedInLCR && (
          <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 text-xs text-blue-900 dark:text-blue-200">
              <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span><strong>{unrecordedProposalsCount}</strong> sustained calling(s) waiting for Church LCR entry.</span>
            </div>
            <button
              type="button"
              onClick={onMarkAllRecordedInLCR}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto"
              id="btn-mark-all-recorded-lcr"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Recorded in LCR ({unrecordedProposalsCount})</span>
            </button>
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
          const rejectedCount = approvalValues.filter(s => s === 'rejected').length;
          const pendingCount = 3 - approvedCount - rejectedCount;
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
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors"
              id={`proposal-card-${proposal.id}`}
            >
              {/* Proposal Header: Candidate Name & Proposed Calling First */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  {/* Category & Status Badges Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {proposal.organization} • {proposal.subOrg}
                    </span>
                    {hasMultipleCandidates && (
                      <span className="bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-blue-200/60 dark:border-blue-800/60">
                        <Users className="w-3 h-3" />
                        <span>{candidates.length} Candidates in Pool</span>
                      </span>
                    )}
                    {isFullyApproved && (
                      <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-emerald-200/60 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>3/3 Bishopric Approved</span>
                      </span>
                    )}
                  </div>

                  {/* Primary Focus: Candidate Name */}
                  <div className="flex items-center space-x-2 pt-0.5">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {proposal.proposedMemberName || 'To be discussed'}
                    </h3>
                    {isUndecided && (
                      <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        Open for Discussion
                      </span>
                    )}
                  </div>

                  {/* Calling Position (Calling when confirmed in Stage 3/4 vs Proposed Calling in Stage 1/Discussion) */}
                  <div className="flex items-center space-x-1.5 text-sm font-semibold">
                    <span className={
                      proposal.finalStatus === 'for_sustaining' || proposal.finalStatus === 'for_recording' || proposal.finalStatus === 'sustained'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-blue-700 dark:text-blue-400'
                    }>
                      {proposal.finalStatus === 'for_sustaining' || proposal.finalStatus === 'for_recording' || proposal.finalStatus === 'sustained'
                        ? 'Calling:'
                        : 'Proposed Calling:'}
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold">{proposal.callingTitle}</span>
                  </div>

                  {/* Underneath: Small Releasing Info, Proposed By & Date */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    {proposal.currentMemberName && (
                      <>
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          Releasing: <strong className="font-semibold">{proposal.currentMemberName}</strong>
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      Proposed by: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{proposal.proposedByName}</strong>
                    </span>
                    <span>•</span>
                    <span>Date: {proposal.dateProposed}</span>
                  </div>
                </div>

                {/* Status Badges & Delete */}
                <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    proposal.finalStatus === 'for_recording' || proposal.finalStatus === 'sustained'
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : proposal.finalStatus === 'for_sustaining'
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : proposal.finalStatus === 'for_interview' || proposal.finalStatus === 'approved_for_action'
                      ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : proposal.finalStatus === 'declined'
                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}>
                    {proposal.finalStatus === 'for_recording' || proposal.finalStatus === 'sustained' ? 'Stage 4: For Recording' :
                     proposal.finalStatus === 'for_sustaining' ? 'Stage 3: For Sustaining' :
                     proposal.finalStatus === 'for_interview' || proposal.finalStatus === 'approved_for_action' ? 'Stage 2: For Interview' :
                     proposal.finalStatus === 'declined' ? 'Declined' : 'Stage 1: Pending Review'}
                  </span>

                  {isAdmin && onDeleteProposal && (
                    <button
                      type="button"
                      onClick={() => onDeleteProposal(proposal.id, proposal.callingTitle)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete proposal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Rationale Note if provided */}
              {proposal.reasonNote && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 italic">
                  &quot;{proposal.reasonNote}&quot;
                </div>
              )}

              {/* ========================================================================= */}
              {/* CANDIDATE DISCUSSION POOL & POLLING (Pending or Declined/For Discussion)  */}
              {/* ========================================================================= */}
              {(hasMultipleCandidates || activeTab === 'declined' || isUndecided) && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Candidate Discussion &amp; Polling Pool ({candidates.length})
                      </span>
                    </div>

                    {(activeTab === 'pending' || activeTab === 'declined') && (
                      <button
                        type="button"
                        onClick={() => setShowAddCandidateMap(prev => ({ ...prev, [proposal.id]: !prev[proposal.id] }))}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Candidate to Poll</span>
                      </button>
                    )}
                  </div>

                  {/* Candidate Selection Cards */}
                  {candidates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {candidates.map((cand) => {
                        const isSelected = cand.id === proposal.selectedCandidateId || cand.name.toLowerCase() === proposal.proposedMemberName.toLowerCase();
                        const existingCallings = getMemberCurrentCallings(cand.name);

                        return (
                          <div
                            key={cand.id}
                            onClick={() => {
                              if (onSelectCandidate) {
                                onSelectCandidate(proposal.id, cand.id);
                              }
                            }}
                            className={`p-2.5 rounded-xl border transition-all relative cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 shadow-2xs ring-1 ring-blue-400/20'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className={`font-bold text-xs ${isSelected ? 'text-blue-950 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {cand.name}
                                  </span>
                                  {isSelected && (
                                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                      Selected Candidate
                                    </span>
                                  )}
                                </div>
                                {cand.note && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                                    {cand.note}
                                  </p>
                                )}
                              </div>

                              {(activeTab === 'pending' || activeTab === 'declined') && onRemoveCandidateFromProposal && candidates.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveCandidateFromProposal(proposal.id, cand.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Remove candidate from pool"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {existingCallings.length > 0 && (
                              <div className="mt-1.5 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">
                                Currently holds: {existingCallings.map(c => c.title).join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-3 text-xs text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                      No specific candidates added yet. Click &quot;Add Candidate to Poll&quot; to begin polling names.
                    </div>
                  )}

                  {/* Inline Add Candidate Form */}
                  {showAddCandidateMap[proposal.id] && (
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-900 dark:text-blue-300">
                          Add Candidate Name to Council Discussion Pool
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddCandidateMap(prev => ({ ...prev, [proposal.id]: false }))}
                          className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter candidate full name..."
                          value={newCandidateNameMap[proposal.id] || ''}
                          onChange={(e) => setNewCandidateNameMap(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                          className="flex-1 w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <input
                          type="text"
                          placeholder="Optional rationale/notes..."
                          value={newCandidateNoteMap[proposal.id] || ''}
                          onChange={(e) => setNewCandidateNoteMap(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                          className="flex-1 w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddNewCandidate(proposal.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                          Add to Pool
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Single candidate non-pool view in other stages */}
              {!hasMultipleCandidates && activeTab !== 'declined' && !isUndecided && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  {getMemberCurrentCallings(proposal.proposedMemberName).length > 0 ? (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                      Currently holds: <strong>{getMemberCurrentCallings(proposal.proposedMemberName).map(c => c.title).join(', ')}</strong>
                    </div>
                  ) : <div />}

                  {activeTab === 'pending' && (
                    <button
                      type="button"
                      onClick={() => setShowAddCandidateMap(prev => ({ ...prev, [proposal.id]: !prev[proposal.id] }))}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center space-x-1 cursor-pointer ml-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Propose Alternative Candidate</span>
                    </button>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* BISHOPRIC 3-POINT APPROVALS GRID (Pending Review & Declined/Discussion)    */}
              {/* ========================================================================= */}
              {(activeTab === 'pending' || activeTab === 'declined') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {activeTab === 'declined' 
                        ? 'Bishopric 3-Point Vote & Discussion Breakdown' 
                        : `Bishopric Unanimity Sign-Offs (${approvedCount}/3)`}
                    </span>

                    {activeTab === 'declined' && (
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {approvedCount} Approved • {rejectedCount} Declined • {pendingCount} Pending
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(['bishop', 'first_counselor', 'second_counselor'] as BishopricRole[]).map((role) => {
                      const leader = BISHOPRIC_LEADERS[role];
                      const approval = safeApprovals[role];
                      const isMe = effectiveSigningRole === role;

                      return (
                        <div
                          key={role}
                          className={`p-3 rounded-xl border transition-all ${
                            approval.status === 'approved'
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200'
                              : approval.status === 'rejected'
                              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-200'
                              : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{leader.title}</span>
                            {approval.status === 'approved' ? (
                              <span className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approved</span>
                              </span>
                            ) : approval.status === 'rejected' ? (
                              <span className="flex items-center space-x-1 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Declined</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {leader.name} {isMe && <span className="font-semibold text-blue-600 dark:text-blue-400">(You)</span>}
                          </div>

                          {approval.note && (
                            <p className="text-[10px] italic text-slate-600 dark:text-slate-300 mt-1 bg-white/60 dark:bg-slate-900/60 p-1.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                              &quot;{approval.note}&quot;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STAGE 2: FOR INTERVIEW SECTION (SIMPLIFIED)                                */}
              {/* ========================================================================= */}
              {activeTab === 'for_interview' && (
                <div className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl p-4 border border-indigo-200/80 dark:border-indigo-800/70 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/60 dark:border-indigo-800/60 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                        Interview &amp; Calling Extension
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-900/60 px-2.5 py-0.5 rounded-full">
                      Candidate: <strong>{proposal.proposedMemberName}</strong>
                    </span>
                  </div>

                  {/* Interviewer Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Assigned Interviewer:
                      </label>
                      <select
                        value={assignedLeaderMap[proposal.id] || proposal.assignedInterviewerRole || 'bishop'}
                        onChange={(e) => {
                          const newRole = e.target.value as BishopricRole;
                          setAssignedLeaderMap(prev => ({ ...prev, [proposal.id]: newRole }));
                          const leader = BISHOPRIC_LEADERS[newRole];
                          if (onAssignInterviewer) {
                            onAssignInterviewer(proposal.id, newRole, leader.name);
                          }
                        }}
                        className="w-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-indigo-200 dark:border-indigo-800 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                      >
                        <option value="bishop" className="dark:bg-slate-800">Bishop (Francis Reyes)</option>
                        <option value="first_counselor" className="dark:bg-slate-800">1st Counselor (Jim Albos)</option>
                        <option value="second_counselor" className="dark:bg-slate-800">2nd Counselor (Alfred Ardon)</option>
                        <option value="executive_secretary" className="dark:bg-slate-800">Exec Secretary (Coordination)</option>
                      </select>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 sm:max-w-xs self-end pb-1">
                      Extend calling to <strong>{proposal.proposedMemberName}</strong>. Once confirmed, advance to sacrament meeting sustaining.
                    </div>
                  </div>

                  {/* Interview Actions Bar */}
                  <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-indigo-900 dark:text-indigo-300 font-medium">
                      {proposal.assignedInterviewer ? (
                        <span>Assigned to: <strong className="text-indigo-950 dark:text-white">{proposal.assignedInterviewer}</strong></span>
                      ) : (
                        <span>Select a Bishopric leader above to conduct the interview.</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                      {/* Member Declined Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setDeclineModalProposal(proposal);
                          setDeclineReasonText('');
                          setDeclinePromoteCandidateId('');
                        }}
                        className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs py-2 px-3 sm:py-1.5 sm:px-3 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                        title="If member declined, reset approvals and return to discussion pool"
                        id={`btn-decline-interview-${proposal.id}`}
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Member Declined Calling</span>
                      </button>

                      {/* Interview Completed & Accepted Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onInterviewCompleted) {
                            onInterviewCompleted(proposal.id, 'Calling extended and accepted', getUpcomingSunday());
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 sm:py-1.5 sm:px-3.5 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
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
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200/80 dark:border-emerald-800/70 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                        Sacrament Meeting Sustaining Agenda
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                      Interview Verified • Ready for Sustaining
                    </span>
                  </div>

                  {proposal.currentMemberName && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 flex items-center space-x-2">
                      <span className="text-slate-400 font-medium">Releasing Member (vote of thanks):</span>
                      <strong className="text-slate-800 dark:text-white font-semibold">{proposal.currentMemberName}</strong>
                    </div>
                  )}

                  {/* Sustaining Action Bar */}
                  <div className="pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-emerald-900 dark:text-emerald-300">
                      Once presented and sustained in sacrament meeting, click to update the active directory and advance to LCR recording.
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const date = sacramentDateMap[proposal.id] || getUpcomingSunday();
                          onMarkSustained(proposal, date);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 sm:py-1.5 sm:px-4 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
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
              {/* STAGE 4: FOR RECORDING SECTION (WITH INLINE SET APART TOGGLE)              */}
              {/* ========================================================================= */}
              {activeTab === 'for_recording' && (
                <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200/80 dark:border-blue-800/70 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 dark:border-blue-800/60 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-xs text-blue-950 dark:text-blue-200">
                        Post-Sustaining Processing &amp; LCR Recording
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 rounded-full">
                      Sustained in Ward Meeting
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* LCR Status Card */}
                    <div className="bg-white/90 dark:bg-slate-800/90 p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-800/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-white">Leader &amp; Clerk Resources (LCR):</span>
                        {proposal.isRecordedInLCR ? (
                          <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Recorded in LCR</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Pending Entry in LCR</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {proposal.isRecordedInLCR 
                          ? `Recorded on ${proposal.recordedInLCRDate || 'recently'} by ${proposal.recordedByClerk || 'Ward Clerk'}`
                          : 'Clerk records this sustained calling in Church LCR system.'}
                      </p>

                      {!proposal.isRecordedInLCR && onMarkRecordedInLCR && (
                        <button
                          type="button"
                          onClick={() => onMarkRecordedInLCR(proposal.id, 'Entry completed in Church LCR system', currentUser.name)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Recorded in LCR</span>
                        </button>
                      )}
                    </div>

                    {/* Setting Apart Tracker with direct toggle */}
                    <div className="bg-white/90 dark:bg-slate-800/90 p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-800/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-white">Setting Apart Status:</span>
                        {matchingCalling?.setApart ? (
                          <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            • Set Apart
                          </span>
                        ) : (
                          <span className="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            • Needs Setting Apart
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {matchingCalling?.setApart
                          ? 'Member has received priesthood blessing and is set apart in this calling.'
                          : 'Member requires a priesthood blessing / setting apart by the Bishopric.'}
                      </p>

                      {onToggleSetApart && (
                        <button
                          type="button"
                          onClick={() => onToggleSetApart(proposal.callingId)}
                          className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer ${
                            matchingCalling?.setApart
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
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

              {/* ========================================================================= */}
              {/* 1. DEDICATED COUNCIL MESSAGE BOARD (Persistent Cloud Sync)                */}
              {/* ========================================================================= */}
              {(() => {
                const propMessages = councilMessages
                  .filter(m => m.proposalId === proposal.id)
                  .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
                const isBoardOpen = activeTab === 'declined' || showMessageBoardMap[proposal.id] || (propMessages.length > 0 && showMessageBoardMap[proposal.id] !== false);

                return (
                  <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowMessageBoardMap(prev => ({ ...prev, [proposal.id]: !isBoardOpen }))}
                        className="text-xs font-bold text-blue-900 dark:text-blue-200 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Council Message Board</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-200/80 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
                          {propMessages.length}
                        </span>
                        {isBoardOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Real-time Council Deliberation
                      </span>
                    </div>

                    {isBoardOpen && (
                      <div className="space-y-3 pt-1">
                        {/* Messages Feed */}
                        {propMessages.length > 0 ? (
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {propMessages.map((msg) => {
                              const canDelete = currentUser.isSuperAdmin ||
                                (msg.authorId && msg.authorId === currentUser.id) ||
                                (msg.authorName && currentUser.name && msg.authorName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
                                currentUser.role === 'bishop' ||
                                currentUser.role === 'first_counselor' ||
                                currentUser.role === 'second_counselor' ||
                                currentUser.role === 'ward_clerk' ||
                                currentUser.role === 'executive_secretary';

                              return (
                                <div
                                  key={msg.id}
                                  className="flex items-start gap-2.5 bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs group"
                                >
                                  {/* Author Avatar */}
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${getAuthorAvatarBg(msg.authorName)}`}>
                                    {getAuthorInitials(msg.authorName)}
                                  </div>

                                  {/* Message Body */}
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                          {msg.authorName}
                                        </span>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeClasses(msg.authorRole || msg.authorCalling)}`}>
                                          {msg.authorRole || msg.authorCalling || 'Council Member'}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                          {msg.timestampFormatted || (msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '')}
                                        </span>
                                        {canDelete && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteMessage(msg.id)}
                                            className="text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                                            title="Delete this message"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
                                      {msg.text}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-4 px-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-dashed border-blue-200 dark:border-blue-900/50 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-1">
                            <MessageCircle className="w-5 h-5 text-blue-400/80" />
                            <span>No messages on this proposal board yet. Start the council discussion below.</span>
                          </div>
                        )}

                        {/* Message Composer */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Type a message or note for the council message board..."
                            value={messageBoardInputMap[proposal.id] || ''}
                            onChange={(e) => setMessageBoardInputMap(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handlePostMessage(proposal.id);
                              }
                            }}
                            className="flex-1 text-xs p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => handlePostMessage(proposal.id)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Post Message</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ========================================================================= */}
              {/* 2. WORKFLOW AUDIT & ACTION HISTORY (Collapsible System Log)              */}
              {/* ========================================================================= */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowHistoryMap(prev => ({ ...prev, [proposal.id]: !prev[proposal.id] }))}
                    className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Workflow Audit &amp; Stage History ({(proposal.statusHistory || []).length})</span>
                    {showHistoryMap[proposal.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Super Admin ONLY: Clear individual proposal history log */}
                  {currentUser.isSuperAdmin && onClearProposalHistory && (proposal.statusHistory && proposal.statusHistory.length > 0) && (
                    <button
                      type="button"
                      onClick={() => onClearProposalHistory(proposal.id)}
                      className="text-[10px] font-medium text-slate-400 hover:text-rose-600 transition-colors flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Clear action history for this proposal (Super Admin only)"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Clear History</span>
                    </button>
                  )}
                </div>

                {/* Show history timeline if toggled open */}
                {showHistoryMap[proposal.id] && (
                  <div className="space-y-2">
                    {proposal.statusHistory && proposal.statusHistory.length > 0 ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] space-y-2 max-h-48 overflow-y-auto">
                        {proposal.statusHistory.map((h, i) => {
                          return (
                            <div key={h.id || i} className="border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{h.action}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{h.date}</span>
                              </div>
                              {h.actor && (
                                <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                                  Actor: {h.actor}
                                </div>
                              )}
                              {h.note && (
                                <div className="mt-0.5 bg-white/70 dark:bg-slate-900/70 p-1.5 rounded border border-slate-200/40 dark:border-slate-700/40">
                                  <p className="text-slate-700 dark:text-slate-300 italic">
                                    &quot;{h.note}&quot;
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-[11px] text-slate-400">
                        No workflow actions recorded in audit trail yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* ACTIONS FOOTER                                                            */}
              {/* ========================================================================= */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {activeTab === 'pending' && (
                    <span>
                      {approvedCount === 3
                        ? 'Ready to move to Stage 2: For Interview'
                        : `${3 - approvedCount} more sign-off${3 - approvedCount > 1 ? 's' : ''} needed for unanimity`}
                    </span>
                  )}
                  {activeTab === 'declined' && (
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      {isUndecided 
                        ? 'Select or poll a candidate above, then finalize to send to Stage 1.' 
                        : `Ready to finalize for ${proposal.proposedMemberName} or choose alternative.`}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 ml-auto">
                  
                  {/* Universal Admin Reset Button */}
                  {isAdmin && onResetProposal && activeTab !== 'declined' && (
                    <button
                      type="button"
                      onClick={() => {
                        const reason = `Reset from ${activeTab.replace('_', ' ')} for Bishopric discussion`;
                        onResetProposal(proposal.id, reason);
                      }}
                      className="bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold text-xs py-2 px-3 sm:py-1.5 sm:px-3 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                      title="Reset all 3 approvals to pending and return to Pending Review for further discussion"
                      id={`btn-reset-discussion-${proposal.id}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>Reset</span>
                    </button>
                  )}

                  {/* Stage 1: Pending Review Voting Actions */}
                  {activeTab === 'pending' && canCurrentUserSign && (
                    <>
                      {myStatus === 'approved' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-xs font-bold px-3 py-2 sm:py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1.5 whitespace-nowrap">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Signed Off as {currentLeader.title}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDiscussionVoteModal({ proposal, role: effectiveSigningRole });
                              setDiscussionVoteNote('');
                            }}
                            className="px-3 py-2 sm:py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800 cursor-pointer whitespace-nowrap"
                          >
                            Change to Decline / For Discussion
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setDiscussionVoteModal({ proposal, role: effectiveSigningRole });
                              setDiscussionVoteNote('');
                            }}
                            className="px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Decline / For Discussion
                          </button>

                          <button
                            type="button"
                            onClick={() => handleActionForRole(proposal.id, effectiveSigningRole, 'approved')}
                            disabled={isUndecided}
                            className={`px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center space-x-1.5 whitespace-nowrap ${
                              isUndecided
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                                : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white cursor-pointer'
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
                          className={`font-bold text-xs py-2 px-3 sm:py-1.5 sm:px-3 rounded-xl transition-colors shadow-2xs flex items-center space-x-1 whitespace-nowrap ${
                            isUndecided
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Approve All 3</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* ========================================================================= */}
                  {/* DECLINED / FOR DISCUSSION TAB SPECIFIC ACTIONS: FINALIZE OR CLOSE          */}
                  {/* ========================================================================= */}
                  {activeTab === 'declined' && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      {/* Close Discussion Button */}
                      {onCloseDiscussion && (
                        <button
                          type="button"
                          onClick={() => {
                            onCloseDiscussion(proposal.id, 'Council concluded discussion and closed calling recommendation.');
                          }}
                          className="px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center space-x-1 border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>Close Discussion</span>
                        </button>
                      )}

                      {/* Reset All Votes to Pending */}
                      {isAdmin && onResetProposal && (
                        <button
                          type="button"
                          onClick={() => onResetProposal(proposal.id, 'Reset all approvals for fresh Bishopric vote')}
                          className="px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center space-x-1 border border-amber-200 dark:border-amber-800 cursor-pointer whitespace-nowrap"
                          title="Reset all votes to pending"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                          <span>Reset Votes</span>
                        </button>
                      )}

                      {/* Finalize Candidate and Send to Stage 1 for Unanimity Sign-Off */}
                      {onFinalizeCandidateForStage1 && (
                        <button
                          type="button"
                          onClick={() => handleFinalizeForStage1Submit(proposal)}
                          className="px-4 py-2 sm:py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ml-auto"
                        >
                          <span>Finalize &amp; Send to Stage 1</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </div>
          );
        })}

        {displayedProposals.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Proposals in this Stage</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {activeTab === 'pending' && 'Proposals awaiting Bishopric review will appear here.'}
              {activeTab === 'for_interview' && 'Proposals with all 3 Bishopric sign-offs will appear here for interview assignment.'}
              {activeTab === 'for_sustaining' && 'Proposals with completed and accepted interviews will appear here for sacrament meeting.'}
              {activeTab === 'for_recording' && 'Callings sustained in sacrament meeting will appear here for LCR clerk entry.'}
              {activeTab === 'declined' && 'No declined proposals currently on file.'}
            </p>
          </div>
        )}
      </div>

      {/* Stage 1: Decline / For Discussion Modal */}
      {discussionVoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Flag for Discussion / Decline</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Vote as {BISHOPRIC_LEADERS[discussionVoteModal.role].title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDiscussionVoteModal(null);
                  setDiscussionVoteNote('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="text-slate-700 dark:text-slate-300">
                Candidate: <strong className="text-slate-950 dark:text-white">{discussionVoteModal.proposal.proposedMemberName || 'Undecided'}</strong>
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                Calling: <strong className="text-slate-950 dark:text-white">{discussionVoteModal.proposal.callingTitle}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Discussion Note / Reason (Optional):
              </label>
              <textarea
                placeholder="Enter comments for Bishopric discussion (e.g. recommend discussing alternative candidates, existing workload, timing concerns)..."
                value={discussionVoteNote}
                onChange={(e) => setDiscussionVoteNote(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:outline-none placeholder-slate-400"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDiscussionVoteModal(null);
                  setDiscussionVoteNote('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscussionVote}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs cursor-pointer transition-colors"
              >
                Confirm Decline / Discussion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reason Modal with Alternate Candidate Promotion */}
      {declineModalProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Member Decline</h3>
              <button
                onClick={() => {
                  setDeclineModalProposal(null);
                  setDeclinePromoteCandidateId('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>{declineModalProposal.proposedMemberName}</strong> was unable to accept the calling as <strong>{declineModalProposal.callingTitle}</strong>. 
              Submitting will record the reason, reset the 3-point sign-offs to pending, and bring the calling back into <strong>Pending Review</strong> so the Bishopric can discuss alternate candidate names.
            </p>

            {/* Optional Alternate Candidate Promotion */}
            {declineModalProposal.candidates && declineModalProposal.candidates.filter(c => c.name.toLowerCase() !== declineModalProposal.proposedMemberName.toLowerCase()).length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  Promote Alternate Candidate for Discussion (Optional):
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="declineCandidatePromote"
                      value=""
                      checked={declinePromoteCandidateId === ''}
                      onChange={() => setDeclinePromoteCandidateId('')}
                      className="text-blue-600"
                    />
                    <span>Keep in open pool / select during meeting</span>
                  </label>
                  {declineModalProposal.candidates
                    .filter(c => c.name.toLowerCase() !== declineModalProposal.proposedMemberName.toLowerCase())
                    .map(c => (
                      <label key={c.id} className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="declineCandidatePromote"
                          value={c.id}
                          checked={declinePromoteCandidateId === c.id}
                          onChange={() => setDeclinePromoteCandidateId(c.id)}
                          className="text-blue-600"
                        />
                        <span>Promote <strong>{c.name}</strong> as new leading recommendation</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            <textarea
              placeholder="Enter reason / notes (e.g. personal circumstances, health, scheduling, work conflicts)..."
              value={declineReasonText}
              onChange={(e) => setDeclineReasonText(e.target.value)}
              rows={3}
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 focus:outline-none placeholder-slate-400"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeclineModalProposal(null);
                  setDeclinePromoteCandidateId('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs cursor-pointer"
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
