import React from 'react';
import { Calling, CallingProposal } from '../types';
import { calculateTenure, formatDateForDisplay } from '../utils/tenure';
import { X, UserCheck, UserX, Clock, Calendar, CheckCircle2, AlertCircle, FileCheck2, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';

interface CallingDetailModalProps {
  calling: Calling | null;
  proposals: CallingProposal[];
  onClose: () => void;
  onProposeForCalling: (calling: Calling) => void;
  onToggleSetApart: (callingId: string) => void;
  onDeleteCalling?: (callingId: string, callingTitle: string) => void;
}

export const CallingDetailModal: React.FC<CallingDetailModalProps> = ({
  calling,
  proposals,
  onClose,
  onProposeForCalling,
  onToggleSetApart,
  onDeleteCalling,
}) => {
  if (!calling) return null;

  const tenure = calculateTenure(calling.sustainedDate);
  const callingProposals = proposals.filter(p => p.callingId === calling.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-8">
        
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currently Called</span>
            
            {calling.isVacant ? (
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
                <UserX className="w-5 h-5 text-amber-600" />
                <span>Calling Vacant</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>{calling.memberName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sustained Date</span>
                    <span className="font-semibold text-slate-800">{formatDateForDisplay(calling.sustainedDate)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Time Served</span>
                    <span className={`inline-flex items-center space-x-1 font-bold text-xs px-2 py-0.5 rounded ${
                      tenure.badgeColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                      tenure.badgeColor === 'amber' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
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
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {p.finalStatus.replace('_', ' ')}
                      </span>
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
                <span>Recommend Release & Replace</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
