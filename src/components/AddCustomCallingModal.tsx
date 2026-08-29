import React, { useState, useEffect } from 'react';
import { Calling, WardMember } from '../types';
import { ORGANIZATIONS } from './Sidebar';
import { X, PlusCircle, Building2, User, Calendar, CheckCircle2 } from 'lucide-react';

interface AddCustomCallingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrg?: string;
  wardMembers: WardMember[];
  onAddCalling: (callingData: {
    organization: string;
    subOrg: string;
    title: string;
    memberName: string | null;
    sustainedDate: string | null;
    setApart: boolean;
    isVacant: boolean;
  }) => void;
}

// Suggested sub-organizations for quick selection per auxiliary
const SUGGESTED_SUB_ORGS: Record<string, string[]> = {
  'Bishopric': ['Bishopric', 'Secretaries & Clerks'],
  'Elders Quorum': ['Elders Quorum Presidency', 'Teachers', 'Activities', 'Service', 'Ministering', 'Additional Callings'],
  'Relief Society': ['Relief Society Presidency', 'Teachers', 'Activities', 'Service', 'Ministering', 'Additional Callings'],
  'Aaronic Priesthood': ['Priests Quorum Presidency', 'Priests Quorum Adult Leaders', 'Teachers Quorum Presidency', 'Teachers Quorum Adult Leaders', 'Deacons Quorum Presidency', 'Deacons Quorum Adult Leaders', 'Additional Aaronic Priesthood'],
  'Young Women': ['Young Women Presidency', 'Gatherers of Light Class', 'Messengers of Hope Class', 'Builders of Faith Class', 'Additional Young Women'],
  'Sunday School': ['Sunday School Presidency', 'Adult Sunday School', 'Course 17', 'Course 16', 'Course 15', 'Course 14', 'Course 13', 'Course 12', 'Course 11', 'Resource Center'],
  'Primary': ['Primary Presidency', 'Music', 'Nursery', 'Valiant 10', 'Valiant 9', 'Valiant 8', 'Valiant 7', 'CTR 6', 'CTR 5', 'CTR 4', 'Sunbeam', 'Activities'],
  'Ward Missionaries': ['Missionary Team', 'Temple & Family History'],
  'Temple & Family History': ['Temple & Family History', 'Temple Preparation', 'Family History Consultants'],
  'Young Single Adult': ['YSA Committee', 'Activities', 'FHE Committee'],
  'Other Callings': ['Facilities', 'Music', 'Welfare and Self-Reliance', 'History', 'Technology', 'Additional Callings']
};

export const AddCustomCallingModal: React.FC<AddCustomCallingModalProps> = ({
  isOpen,
  onClose,
  defaultOrg,
  wardMembers,
  onAddCalling,
}) => {
  const [organization, setOrganization] = useState<string>('Elders Quorum');
  const [subOrg, setSubOrg] = useState<string>('Additional Callings');
  const [customSubOrg, setCustomSubOrg] = useState<string>('');
  const [useCustomSubOrg, setUseCustomSubOrg] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [isVacant, setIsVacant] = useState<boolean>(true);
  const [memberName, setMemberName] = useState<string>('');
  const [sustainedDate, setSustainedDate] = useState<string>('26 Jul 2026');
  const [setApart, setSetApart] = useState<boolean>(false);

  // Sync defaultOrg when opening
  useEffect(() => {
    if (isOpen) {
      const validOrg = defaultOrg && defaultOrg !== 'All Organizations' && defaultOrg !== 'All' 
        ? defaultOrg 
        : 'Elders Quorum';
      setOrganization(validOrg);
      const suggestions = SUGGESTED_SUB_ORGS[validOrg] || ['General'];
      setSubOrg(suggestions[suggestions.length - 1] || 'Additional Callings');
      setUseCustomSubOrg(false);
      setCustomSubOrg('');
      setTitle('');
      setIsVacant(true);
      setMemberName('');
      setSetApart(false);
    }
  }, [isOpen, defaultOrg]);

  // When org changes, pick top suggestion
  const handleOrgChange = (newOrg: string) => {
    setOrganization(newOrg);
    const suggestions = SUGGESTED_SUB_ORGS[newOrg] || ['General'];
    setSubOrg(suggestions[0] || 'General');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a calling title.');
      return;
    }

    const finalSubOrg = useCustomSubOrg ? (customSubOrg.trim() || 'General') : subOrg;

    if (!isVacant && !memberName.trim()) {
      alert('Please enter or select a member name for this calling, or mark it as a vacant position.');
      return;
    }

    onAddCalling({
      organization,
      subOrg: finalSubOrg,
      title: title.trim(),
      memberName: isVacant ? null : memberName.trim(),
      sustainedDate: isVacant ? null : sustainedDate.trim(),
      setApart: isVacant ? false : setApart,
      isVacant,
    });

    onClose();
  };

  const orgList = ORGANIZATIONS.filter(o => o !== 'All Organizations');
  const currentSuggestions = SUGGESTED_SUB_ORGS[organization] || ['General'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Add Custom Calling Position</h3>
              <p className="text-xs text-slate-400">Add a new auxiliary, specialist, or custom ward calling</p>
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
          
          {/* Organization Selection */}
          <div>
            <label className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
              Organization / Auxiliary:
            </label>
            <select
              value={organization}
              onChange={(e) => handleOrgChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {orgList.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>

          {/* Sub-Organization / Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800 uppercase tracking-wider block">
                Sub-Organization / Category:
              </label>
              <button
                type="button"
                onClick={() => setUseCustomSubOrg(!useCustomSubOrg)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                {useCustomSubOrg ? 'Choose from list' : '+ Custom Category'}
              </button>
            </div>

            {useCustomSubOrg ? (
              <input
                type="text"
                placeholder="e.g. Activities Committee, Youth Specialist, etc."
                value={customSubOrg}
                onChange={(e) => setCustomSubOrg(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <select
                value={subOrg}
                onChange={(e) => setSubOrg(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentSuggestions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          {/* Calling Title */}
          <div>
            <label className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
              Calling Title:
            </label>
            <input
              type="text"
              placeholder="e.g. Assistant Activity Coordinator, Welfare Specialist, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Initial Status Toggle */}
          <div className="pt-2 border-t border-slate-200">
            <label className="font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Initial Position Status:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsVacant(true)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isVacant 
                    ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-400/20' 
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold block text-xs">Vacant Position</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Position needs to be filled</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVacant(false)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !isVacant 
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400/20' 
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold block text-xs">Filled / Assigned</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Currently held by a member</span>
              </button>
            </div>
          </div>

          {/* If Filled, Member Assignment Details */}
          {!isVacant && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div>
                <label className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Member Name:
                </label>
                <input
                  type="text"
                  placeholder="Enter member name (e.g. Reyes, Francisco)..."
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Sustained Date:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 26 Jul 2026"
                    value={sustainedDate}
                    onChange={(e) => setSustainedDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setApart}
                      onChange={(e) => setSetApart(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-semibold text-xs text-slate-700">Already Set Apart</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Calling Position</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
