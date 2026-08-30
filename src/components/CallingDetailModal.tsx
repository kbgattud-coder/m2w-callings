import React from 'react';
import { Calling, CallingProposal } from '../types';
import { calculateTenure, formatDateForDisplay } from '../utils/tenure';
import { 
  X, 
  UserCheck, 
  UserX, 
  Clock, 
  PlusCircle, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface CallingDetailModalProps {
  calling: Calling | null;
  proposals: CallingProposal[];
  currentUser?: { 
    name?: string;
    calling?: string;
    isSuperAdmin?: boolean; 
    role?: string;
  };
  onClose: () => void;
  onProposeForCalling: (calling: Calling) => void;
  onToggleSetApart: (callingId: string) => void;
  onDirectEditCalling?: (calling: Calling) => void;
  onDirectReleaseCalling?: (callingId: string) => void;
  onDeleteCalling?: (callingId: string, callingTitle: string) => void;
  onDeleteProposal?: (proposalId: string, callingTitle?: string) => void;
  onResetProposal?: (proposalId: string, reason?: string) => void;
}

export const CallingDetailModal: React.FC<CallingDetailModalProps> = ({
  calling,
  proposals,
  currentUser,
  onClose,
  onProposeForCalling,
  onToggleSetApart,
  onDirectEditCalling,
  onDirectReleaseCalling,
  onDeleteCalling,
  onDeleteProposal,
  onResetProposal,
}) => {
  if (!calling) return null;

  const tenure = calculateTenure(calling.sustainedDate);
  const callingProposals = proposals.filter(p => p.callingId === calling.id);
  const activeProposal = callingProposals.find(p => 
    p.finalStatus === 'pending_review' || 
    p.finalStatus === 'for_interview' || 
    p.finalStatus === 'for_sustaining' || 
    p.finalStatus === 'approved_for_action' ||
    (p.finalStatus === 'for_recording' && !p.isRecordedInLCR)
  );
  const isAdmin = currentUser?.isSuperAdmin || 
    currentUser?.role === 'bishop' || 
    currentUser?.role === 'first_counselor' || 
    currentUser?.role === 'second_counselor' || 
    currentUser?.role === 'clerk' || 
    currentUser?.role === 'exec_sec';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {calling.organization} • {calling.subOrg}
            </span>
            <h3 className="font-bold text-base text-white mt-0.5">{calling.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Current Status Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                Currently Called
              </span>
              
              {/* Admin Direct Edit Shortcut */}
              {isAdmin && onDirectEditCalling && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDirectEditCalling(calling);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors border border-blue-200 dark:border-blue-800 flex items-center space-x-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Direct Edit (Admin)</span>
                </button>
              )}
            </div>
            
            {calling.isVacant ? (
              <div className="flex items-center justify-between text-amber-800 dark:text-amber-200 font-bold text-sm bg-amber-50 dark:bg-amber-950/60 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/70">
                <div className="flex items-center space-x-2">
                  <UserX className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Calling Vacant</span>
                </div>
                {isAdmin && onDirectEditCalling && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onDirectEditCalling(calling);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-bold text-xs transition-colors shadow-2xs"
                  >
                    Assign Now
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold text-sm">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>{calling.memberName}</span>
                  </div>
                  {isAdmin && onDirectReleaseCalling && (
                    <button
                      type="button"
                      onClick={() => {
                        onDirectReleaseCalling(calling.id);
                        onClose();
                      }}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 text-[11px] font-semibold hover:underline cursor-pointer"
                    >
                      Release Member
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block">Sustained Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDateForDisplay(calling.sustainedDate)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block">Time Served (Tenure)</span>
                    <span className={`inline-flex items-center space-x-1 font-bold text-xs px-2 py-0.5 rounded-full border ${
                      tenure.badgeColor === 'purple' ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60' :
                      tenure.badgeColor === 'amber' ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' :
                      'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{tenure.displayText}</span>
                    </span>
                  </div>
                </div>

                {/* Set Apart Status */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Set Apart Status:</span>
                  <button
                    onClick={() => onToggleSetApart(calling.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      calling.setApart
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                    }`}
                  >
                    {calling.setApart ? '✓ Set Apart' : '⚠ Needs Setting Apart'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Proposal Alert Banner */}
          {activeProposal && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Active Proposal in Progress</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                  {activeProposal.finalStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Proposed Candidate: <strong className="text-blue-950 dark:text-white font-bold">{activeProposal.proposedMemberName}</strong>
                {activeProposal.candidates && activeProposal.candidates.length > 1 && (
                  <span className="ml-1 text-slate-500 dark:text-slate-400">({activeProposal.candidates.length} in candidate pool)</span>
                )}
              </p>
            </div>
          )}

          {/* Proposals History */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Proposals History ({callingProposals.length})
            </span>

            {callingProposals.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {callingProposals.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>Proposed: {p.proposedMemberName}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          p.finalStatus === 'declined' 
                            ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300' 
                            : p.finalStatus === 'approved_for_action'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                            : p.finalStatus === 'sustained'
                            ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}>
                          {p.finalStatus.replace(/_/g, ' ')}
                        </span>
                        {(p.finalStatus === 'declined' || p.finalStatus === 'approved_for_action') && onResetProposal && isAdmin && (
                          <button
                            type="button"
                            onClick={() => onResetProposal(p.id, 'Re-opened via Calling Details for discussion')}
                            className="px-2 py-0.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg transition-colors text-[10px] font-bold flex items-center space-x-1 border border-amber-300 dark:border-amber-700 cursor-pointer"
                            title="Reset 3-point approvals and return proposal to Pending Review for discussion"
                          >
                            <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Reset</span>
                          </button>
                        )}
                        {onDeleteProposal && (
                          <button
                            type="button"
                            onClick={() => onDeleteProposal(p.id, p.callingTitle || calling.title)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Delete proposal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Multiple Candidates Pool Display */}
                    {p.candidates && p.candidates.length > 1 && (
                      <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/80 dark:border-slate-700 text-[11px] space-y-1">
                        <span className="font-semibold text-slate-600 dark:text-slate-300 block">Candidate Discussion Pool ({p.candidates.length}):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {p.candidates.map(c => (
                            <span 
                              key={c.id} 
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                c.id === p.selectedCandidateId || c.name.toLowerCase() === p.proposedMemberName.toLowerCase()
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {c.name} {c.id === p.selectedCandidateId ? '✓' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Proposed by {p.proposedByName} on {p.dateProposed}</p>
                    {p.reasonNote && <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">"{p.reasonNote}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No previous proposals recorded for this position.</p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>

              {calling.isVacant && onDeleteCalling && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCalling(calling.id, calling.title);
                    onClose();
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Vacant Position</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isAdmin && onDirectEditCalling && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDirectEditCalling(calling);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Direct Edit</span>
                </button>
              )}

              {calling.isVacant ? (
                <button
                  onClick={() => {
                    onClose();
                    onProposeForCalling(calling);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Suggest Candidate</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onProposeForCalling(calling);
                  }}
                  className="bg-slate-800 dark:bg-blue-600 hover:bg-slate-900 dark:hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Recommend Release &amp; Replace</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
