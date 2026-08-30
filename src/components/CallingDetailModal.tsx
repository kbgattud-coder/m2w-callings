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
  const isAdmin = currentUser?.isSuperAdmin || 
    currentUser?.role === 'bishop' || 
    currentUser?.role === 'first_counselor' || 
    currentUser?.role === 'second_counselor' || 
    currentUser?.role === 'clerk' || 
    currentUser?.role === 'exec_sec';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
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
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
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
                  className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors border border-blue-200 flex items-center space-x-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Direct Edit (Admin)</span>
                </button>
              )}
            </div>
            
            {calling.isVacant ? (
              <div className="flex items-center justify-between text-amber-800 font-bold text-sm bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                <div className="flex items-center space-x-2">
                  <UserX className="w-5 h-5 text-amber-600" />
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
                <div className="flex items-center justify-between text-slate-900 font-bold text-sm">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <span>{calling.memberName}</span>
                  </div>
                  {isAdmin && onDirectReleaseCalling && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Release ${calling.memberName} from ${calling.title} directly?`)) {
                          onDirectReleaseCalling(calling.id);
                          onClose();
                        }
                      }}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold hover:underline"
                    >
                      Release Member
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sustained Date</span>
                    <span className="font-semibold text-slate-800">{formatDateForDisplay(calling.sustainedDate)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Time Served (Tenure)</span>
                    <span className={`inline-flex items-center space-x-1 font-bold text-xs px-2 py-0.5 rounded-full border ${
                      tenure.badgeColor === 'purple' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      tenure.badgeColor === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{tenure.displayText}</span>
                    </span>
                  </div>
                </div>

                {/* Set Apart Status */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">Set Apart Status:</span>
                  <button
                    onClick={() => onToggleSetApart(calling.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      calling.setApart
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}
                  >
                    {calling.setApart ? '✓ Set Apart' : '⚠ Needs Setting Apart'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Proposals History */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Proposals History ({callingProposals.length})
            </span>

            {callingProposals.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {callingProposals.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Proposed: {p.proposedMemberName}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          p.finalStatus === 'declined' 
                            ? 'bg-rose-100 text-rose-800' 
                            : p.finalStatus === 'approved_for_action'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.finalStatus === 'sustained'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {p.finalStatus.replace(/_/g, ' ')}
                        </span>
                        {(p.finalStatus === 'declined' || p.finalStatus === 'approved_for_action') && onResetProposal && isAdmin && (
                          <button
                            type="button"
                            onClick={() => onResetProposal(p.id, 'Re-opened via Calling Details for discussion')}
                            className="px-2 py-0.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-[10px] font-bold flex items-center space-x-1 border border-amber-300"
                            title="Reset 3-point approvals and return proposal to Pending Review for discussion"
                          >
                            <RefreshCw className="w-3 h-3 text-amber-600" />
                            <span>Reset for Discussion</span>
                          </button>
                        )}
                        {onDeleteProposal && (
                          <button
                            type="button"
                            onClick={() => onDeleteProposal(p.id, p.callingTitle || calling.title)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete proposal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Multiple Candidates Pool Display */}
                    {p.candidates && p.candidates.length > 1 && (
                      <div className="bg-white p-2 rounded border border-slate-200/80 text-[11px] space-y-1">
                        <span className="font-semibold text-slate-600 block">Candidate Discussion Pool ({p.candidates.length}):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {p.candidates.map(c => (
                            <span 
                              key={c.id} 
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                c.id === p.selectedCandidateId || c.name.toLowerCase() === p.proposedMemberName.toLowerCase()
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {c.name} {c.id === p.selectedCandidateId ? '✓' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500">Proposed by {p.proposedByName} on {p.dateProposed}</p>
                    {p.reasonNote && <p className="text-[11px] text-slate-600 italic">"{p.reasonNote}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No previous proposals recorded for this position.</p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center space-x-1"
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
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
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
