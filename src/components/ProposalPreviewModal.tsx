import React, { useState } from 'react';
import { CallingProposal, Calling, AuthUser, BishopricRole } from '../types';
import { BISHOPRIC_LEADERS } from '../data/initialData';
import { 
  X, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Check, 
  UserCheck, 
  Plus, 
  ArrowRight, 
  ExternalLink, 
  Calendar, 
  FileText, 
  MessageSquare, 
  UserX,
  Sparkles,
  ShieldCheck,
  Building2,
  Mic,
  BookmarkCheck,
  CheckCheck
} from 'lucide-react';

interface ProposalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: CallingProposal | null;
  calling?: Calling | null;
  currentUser: AuthUser;
  onSelectCandidate?: (proposalId: string, candidateId: string) => void;
  onAddCandidate?: (proposalId: string, name: string, note?: string) => void;
  onNavigateToApprovals?: (tabKey?: 'pending' | 'for_interview' | 'for_sustaining' | 'for_recording') => void;
}

export const ProposalPreviewModal: React.FC<ProposalPreviewModalProps> = ({
  isOpen,
  onClose,
  proposal,
  calling,
  currentUser,
  onSelectCandidate,
  onAddCandidate,
  onNavigateToApprovals,
}) => {
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateNote, setNewCandidateNote] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  if (!isOpen || !proposal) return null;

  const isAdmin = currentUser.isSuperAdmin || 
    ['bishop', 'first_counselor', 'second_counselor', 'clerk', 'executive_secretary', 'exec_sec'].includes(currentUser.role);

  // Normalize final status into 4 steps
  const normalizedStatus = 
    proposal.finalStatus === 'for_interview' || proposal.finalStatus === 'approved_for_action' ? 'for_interview' :
    proposal.finalStatus === 'for_sustaining' ? 'for_sustaining' :
    proposal.finalStatus === 'for_recording' || proposal.finalStatus === 'sustained' ? 'for_recording' :
    proposal.finalStatus === 'declined' ? 'declined' : 'pending_review';

  // Step indicator details
  const steps = [
    { key: 'pending_review', label: '1. Pending Review', icon: Clock, desc: 'Bishopric Consensus' },
    { key: 'for_interview', label: '2. For Interview', icon: Mic, desc: 'Assign & Extend Call' },
    { key: 'for_sustaining', label: '3. For Sustaining', icon: Users, desc: 'Sacrament Meeting' },
    { key: 'for_recording', label: '4. For Recording', icon: BookmarkCheck, desc: 'LCR Entry & Record' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending_review': return 0;
      case 'for_interview': return 1;
      case 'for_sustaining': return 2;
      case 'for_recording': return 3;
      case 'declined': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(normalizedStatus);

  const safeApprovals = {
    bishop: { status: proposal.approvals?.bishop?.status || 'pending', note: proposal.approvals?.bishop?.note, updatedAt: proposal.approvals?.bishop?.updatedAt },
    first_counselor: { status: proposal.approvals?.first_counselor?.status || 'pending', note: proposal.approvals?.first_counselor?.note, updatedAt: proposal.approvals?.first_counselor?.updatedAt },
    second_counselor: { status: proposal.approvals?.second_counselor?.status || 'pending', note: proposal.approvals?.second_counselor?.note, updatedAt: proposal.approvals?.second_counselor?.updatedAt },
  };

  const approvedCount = [
    safeApprovals.bishop.status,
    safeApprovals.first_counselor.status,
    safeApprovals.second_counselor.status,
  ].filter(s => s === 'approved').length;

  const candidates = proposal.candidates || [];

  const handleAddCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;
    if (onAddCandidate) {
      onAddCandidate(proposal.id, newCandidateName.trim(), newCandidateNote.trim());
    }
    setNewCandidateName('');
    setNewCandidateNote('');
    setIsAddingCandidate(false);
  };

  const handleGoToApprovalsTab = () => {
    onClose();
    if (onNavigateToApprovals) {
      const tabTarget = 
        normalizedStatus === 'for_interview' ? 'for_interview' :
        normalizedStatus === 'for_sustaining' ? 'for_sustaining' :
        normalizedStatus === 'for_recording' ? 'for_recording' : 'pending';
      onNavigateToApprovals(tabTarget);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/80 flex items-center space-x-1">
                <Building2 className="w-3 h-3" />
                <span>{proposal.organization} • {proposal.subOrg}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-300">
                Proposed {proposal.dateProposed}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {proposal.callingTitle}
            </h3>
            <p className="text-xs text-slate-300">
              Proposal initiated by <strong>{proposal.proposedByName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
            id="btn-close-proposal-preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Process Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-3">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isPast = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div 
                  key={step.key}
                  className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/90 border-blue-300 text-blue-900 font-bold shadow-2xs'
                      : isPast
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-1 mb-0.5">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <StepIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`} />
                    )}
                    <span className="text-[11px] leading-tight font-bold">{step.label}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 leading-tight hidden sm:block">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-700">
          
          {/* Primary Proposed Person Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-sky-50/40 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-0.5">
                Current Selected Recommendation
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {proposal.proposedMemberName ? proposal.proposedMemberName.charAt(0) : '?'}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {proposal.proposedMemberName || 'To Be Discussed in Bishopric'}
                  </h4>
                  {proposal.currentMemberName && (
                    <p className="text-[11px] text-slate-500">
                      Replaces currently serving: <strong>{proposal.currentMemberName}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Approval Counter Badge */}
            <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-200/60 shadow-2xs self-start sm:self-auto text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sign-offs</span>
              <span className="text-xs font-extrabold text-blue-700">
                {approvedCount} of 3 Approved
              </span>
            </div>
          </div>

          {/* Proposal Rationale Note */}
          {proposal.reasonNote && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center space-x-1">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Proposal Rationale &amp; Context</span>
              </span>
              <p className="text-slate-700 leading-relaxed italic">
                "{proposal.reasonNote}"
              </p>
            </div>
          )}

          {/* Candidates Discussion Pool */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Candidate Discussion Pool ({candidates.length})
                </h4>
              </div>

              {isAdmin && !isAddingCandidate && (
                <button
                  type="button"
                  onClick={() => setIsAddingCandidate(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80 hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Suggest Name</span>
                </button>
              )}
            </div>

            {/* Inline Add Candidate Form */}
            {isAddingCandidate && (
              <form onSubmit={handleAddCandidateSubmit} className="mb-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                <span className="text-[11px] font-bold text-blue-900 block">Add candidate to council pool:</span>
                <input
                  type="text"
                  placeholder="Member Name (e.g. Santos, Maria Clara)"
                  value={newCandidateName}
                  onChange={(e) => setNewCandidateName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Optional discussion context / notes..."
                  value={newCandidateNote}
                  onChange={(e) => setNewCandidateNote(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingCandidate(false)}
                    className="text-xs px-2.5 py-1 text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-3 py-1 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                  >
                    Add Name
                  </button>
                </div>
              </form>
            )}

            {/* Candidates List */}
            <div className="space-y-2">
              {candidates.map((cand) => {
                const isSelected = cand.name.toLowerCase() === proposal.proposedMemberName?.toLowerCase();
                return (
                  <div
                    key={cand.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                          {cand.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                            <Check className="w-2.5 h-2.5" />
                            <span>Primary Candidate</span>
                          </span>
                        )}
                      </div>
                      {cand.note && (
                        <p className="text-[11px] text-slate-500">{cand.note}</p>
                      )}
                      {cand.addedBy && (
                        <span className="text-[10px] text-slate-400 block">
                          Suggested by {cand.addedBy} {cand.dateAdded && `• ${cand.dateAdded}`}
                        </span>
                      )}
                    </div>

                    {isAdmin && !isSelected && onSelectCandidate && (
                      <button
                        type="button"
                        onClick={() => onSelectCandidate(proposal.id, cand.id)}
                        className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-lg border border-slate-200 transition-colors self-start sm:self-auto shrink-0"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3-Point Bishopric Approvals Status */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <span>Bishopric Approvals Breakdown</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Bishop */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Bishop</span>
                    {safeApprovals.bishop.status === 'approved' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Approved</span>
                      </span>
                    ) : safeApprovals.bishop.status === 'rejected' ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Declined</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Francis Reyes</span>
                </div>
                {safeApprovals.bishop.note && (
                  <p className="text-[10px] text-slate-500 italic mt-2 border-t border-slate-100 pt-1">
                    "{safeApprovals.bishop.note}"
                  </p>
                )}
              </div>

              {/* 1st Counselor */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">1st Counselor</span>
                    {safeApprovals.first_counselor.status === 'approved' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Approved</span>
                      </span>
                    ) : safeApprovals.first_counselor.status === 'rejected' ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Declined</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Jim Albos</span>
                </div>
                {safeApprovals.first_counselor.note && (
                  <p className="text-[10px] text-slate-500 italic mt-2 border-t border-slate-100 pt-1">
                    "{safeApprovals.first_counselor.note}"
                  </p>
                )}
              </div>

              {/* 2nd Counselor */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">2nd Counselor</span>
                    {safeApprovals.second_counselor.status === 'approved' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Approved</span>
                      </span>
                    ) : safeApprovals.second_counselor.status === 'rejected' ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Declined</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Alfred Ardon</span>
                </div>
                {safeApprovals.second_counselor.note && (
                  <p className="text-[10px] text-slate-500 italic mt-2 border-t border-slate-100 pt-1">
                    "{safeApprovals.second_counselor.note}"
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Workflow Stage Status Detail if beyond step 1 */}
          {proposal.assignedInterviewer && (
            <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-purple-600" />
                <span>
                  Assigned Interviewer: <strong>{proposal.assignedInterviewerName || proposal.assignedInterviewer}</strong>
                </span>
              </div>
              {proposal.interviewDate && (
                <span className="text-[11px] text-purple-700 font-semibold">
                  Scheduled: {proposal.interviewDate}
                </span>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            Close Overview
          </button>

          {onNavigateToApprovals && (
            <button
              type="button"
              onClick={handleGoToApprovalsTab}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              id="btn-go-to-approvals-queue"
            >
              <span>Manage in Approvals Queue</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
