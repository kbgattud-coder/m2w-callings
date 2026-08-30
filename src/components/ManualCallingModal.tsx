import React, { useState, useEffect } from 'react';
import { Calling, CallingProposal } from '../types';
import { getTodayDateString, formatDateForDisplay } from '../utils/tenure';
import { 
  X, 
  CheckCircle2, 
  UserCheck, 
  UserX, 
  Calendar, 
  Save, 
  ShieldCheck, 
  User, 
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface ManualCallingModalProps {
  isOpen: boolean;
  onClose: () => void;
  calling: Calling | null;
  allCallings: Calling[];
  proposals: CallingProposal[];
  onSaveCalling: (callingId: string, updates: {
    memberName: string | null;
    sustainedDate: string | null;
    setApart: boolean;
    isVacant: boolean;
    note?: string;
  }) => Promise<void>;
  currentUser?: {
    name: string;
    calling: string;
    isSuperAdmin?: boolean;
  };
}

export const ManualCallingModal: React.FC<ManualCallingModalProps> = ({
  isOpen,
  onClose,
  calling: initialCalling,
  allCallings,
  proposals,
  onSaveCalling,
  currentUser,
}) => {
  const [selectedCallingId, setSelectedCallingId] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [isVacant, setIsVacant] = useState<boolean>(false);
  const [sustainedDate, setSustainedDate] = useState<string>('');
  const [setApart, setSetApart] = useState<boolean>(false);
  const [adminNote, setAdminNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchCallingQuery, setSearchCallingQuery] = useState<string>('');

  const currentCalling = allCallings.find(c => c.id === selectedCallingId) || initialCalling;

  // Sync state when modal opens or initial calling changes
  useEffect(() => {
    if (initialCalling) {
      setSelectedCallingId(initialCalling.id);
      setMemberName(initialCalling.memberName || '');
      setIsVacant(initialCalling.isVacant);
      setSustainedDate(initialCalling.sustainedDate || '');
      setSetApart(initialCalling.setApart);
      setAdminNote('');
    } else if (allCallings.length > 0 && !selectedCallingId) {
      const first = allCallings[0];
      setSelectedCallingId(first.id);
      setMemberName(first.memberName || '');
      setIsVacant(first.isVacant);
      setSustainedDate(first.sustainedDate || '');
      setSetApart(first.setApart);
    }
  }, [initialCalling, isOpen]);

  // When selected calling in dropdown changes
  const handleSelectCalling = (id: string) => {
    setSelectedCallingId(id);
    const target = allCallings.find(c => c.id === id);
    if (target) {
      setMemberName(target.memberName || '');
      setIsVacant(target.isVacant);
      setSustainedDate(target.sustainedDate || '');
      setSetApart(target.setApart);
      setAdminNote('');
    }
  };

  if (!isOpen) return null;

  const handleSetToday = () => {
    setSustainedDate(getTodayDateString());
  };

  const handleClearDate = () => {
    setSustainedDate('');
  };

  const handleToggleVacant = (vacant: boolean) => {
    setIsVacant(vacant);
    if (vacant) {
      setMemberName('');
      setSustainedDate('');
      setSetApart(false);
    } else {
      if (!sustainedDate) {
        setSustainedDate(getTodayDateString());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCalling) return;

    if (!isVacant && !memberName.trim()) {
      alert('Please enter the name of the member being assigned, or mark the position as Vacant.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveCalling(currentCalling.id, {
        memberName: isVacant ? null : memberName.trim(),
        sustainedDate: isVacant ? null : (sustainedDate.trim() || null),
        setApart: isVacant ? false : setApart,
        isVacant: isVacant,
        note: adminNote.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error in manual calling update:', err);
      alert('Failed to update calling. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if there are active proposals for this calling
  const relatedProposals = proposals.filter(p => p.callingId === currentCalling?.id);
  const pendingProposal = relatedProposals.find(p => p.finalStatus === 'pending_review' || p.finalStatus === 'approved_for_action');

  const filteredCallingOptions = allCallings.filter(c => {
    if (!searchCallingQuery.trim()) return true;
    const q = searchCallingQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.organization.toLowerCase().includes(q) ||
      (c.subOrg && c.subOrg.toLowerCase().includes(q)) ||
      (c.memberName && c.memberName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded border border-blue-700/50">
                  Admin Direct Entry
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Bypasses Proposal Sign-offs</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 tracking-tight">
                Manual Calling Assignment & Edit
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors hover:bg-slate-800"
            id="btn-close-manual-calling"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">

          {/* Calling Selector if not predefined */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Position to Update
            </label>
            
            {allCallings.length > 1 && (
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Filter calling positions (e.g. Relief Society, Primary, Counselor)..."
                  value={searchCallingQuery}
                  onChange={(e) => setSearchCallingQuery(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <select
                  value={selectedCallingId}
                  onChange={(e) => handleSelectCalling(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs text-slate-900"
                >
                  {filteredCallingOptions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.organization} → {c.title} {c.memberName ? `(${c.memberName})` : '[VACANT]'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentCalling && (
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    {currentCalling.organization} {currentCalling.subOrg ? `• ${currentCalling.subOrg}` : ''}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{currentCalling.title}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    currentCalling.isVacant 
                      ? 'bg-amber-100 text-amber-800 border-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {currentCalling.isVacant ? 'Currently Vacant' : 'Currently Filled'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pending Proposal Notice */}
          {pendingProposal && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold">Active Proposal in Queue:</span> Candidate recommended is{' '}
                <strong className="text-amber-950">{pendingProposal.proposedMemberName}</strong>. 
                Saving a direct assignment here will immediately record this calling in the official ward directory and update dashboard tenure.
              </div>
            </div>
          )}

          {/* Vacant vs Filled Toggle */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Position Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleVacant(false)}
                className={`p-3 rounded-xl border text-left font-bold transition-all flex items-center space-x-2.5 ${
                  !isVacant
                    ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${!isVacant ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs">Assign Member</span>
                  <span className="block text-[10px] font-normal text-slate-500">Position is actively filled</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleVacant(true)}
                className={`p-3 rounded-xl border text-left font-bold transition-all flex items-center space-x-2.5 ${
                  isVacant
                    ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isVacant ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs">Mark as Vacant</span>
                  <span className="block text-[10px] font-normal text-slate-500">No member currently serving</span>
                </div>
              </button>
            </div>
          </div>

          {/* Member Name Input (if filled) */}
          {!isVacant && (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Member Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required={!isVacant}
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="e.g. Enguito, Zamina or Cruz, Juan"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-900 text-xs shadow-2xs"
                  />
                </div>
                {pendingProposal && pendingProposal.proposedMemberName && (
                  <button
                    type="button"
                    onClick={() => setMemberName(pendingProposal.proposedMemberName)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Use proposed candidate: "{pendingProposal.proposedMemberName}"</span>
                  </button>
                )}
              </div>

              {/* Sustained Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Date Sustained in Sacrament Meeting
                  </label>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={handleSetToday}
                      className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold transition-colors"
                    >
                      Set Today ({getTodayDateString()})
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDate}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={sustainedDate}
                    onChange={(e) => setSustainedDate(e.target.value)}
                    placeholder="e.g. 29 Aug 2026 or 2026-08-29"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-900 text-xs shadow-2xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Tip: Setting today's date starts tenure fresh at <strong>New (&lt; 1 mo)</strong>.
                </p>
              </div>

              {/* Setting Apart Status */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Setting Apart Status</span>
                  <span className="text-[10px] text-slate-500 block">Has this member received the setting apart ordinance?</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setApart}
                    onChange={(e) => setSetApart(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {setApart ? 'Set Apart' : 'Needs Setting Apart'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Admin Note */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Admin Log Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="e.g. Sustained in Ward Conference or direct bishopric appointment"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-800"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center space-x-2 disabled:opacity-50"
              id="btn-save-manual-calling"
            >
              {isSubmitting ? (
                <span>Saving to Ward Database...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save &amp; Update Calling Directly</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
