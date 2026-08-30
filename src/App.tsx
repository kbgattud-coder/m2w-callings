/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BishopricRole, 
  ViewTab, 
  Calling, 
  CallingProposal, 
  ApprovalStatus, 
  CallingFilterStatus,
  ProposalType,
  AuthUser,
  WardMember,
  CandidateOption
} from './types';
import { INITIAL_CALLINGS, INITIAL_PROPOSALS, WARD_MEMBERS, BISHOPRIC_LEADERS } from './data/initialData';
import { 
  subscribeToCallings, 
  subscribeToProposals, 
  saveCallingToFirestore, 
  deleteCallingFromFirestore, 
  saveProposalToFirestore, 
  deleteProposalFromFirestore, 
  resetFirestoreToDefaults,
  ensureDatabaseSeeded,
  clearAllProposalsHistory,
  clearProposalHistory
} from './services/firestoreService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { StatsOverview } from './components/StatsOverview';
import { OrgChartDirectory } from './components/OrgChartDirectory';
import { ApprovalsQueue } from './components/ApprovalsQueue';
import { NeedsSetApartView } from './components/NeedsSetApartView';
import { ConsiderForReviewView } from './components/ConsiderForReviewView';
import { AnalyticsView } from './components/AnalyticsView';
import { ProposalModal } from './components/ProposalModal';
import { CallingDetailModal } from './components/CallingDetailModal';
import { AddCustomCallingModal } from './components/AddCustomCallingModal';
import { ManualCallingModal } from './components/ManualCallingModal';
import { calculateTenure, getTodayDateString } from './utils/tenure';
import { sortCallings } from './utils/callingSort';

const STORAGE_KEYS = {
  AUTH_USER: 'masagana_2nd_ward_auth_user_v1',
  CALLINGS: 'masagana_2nd_ward_callings_v3',
  PROPOSALS: 'masagana_2nd_ward_proposals_v3',
  ROLE: 'masagana_2nd_ward_active_role_v1',
};

export default function App() {
  // Current Authenticated User State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  // Active Leader Role in 3-Point System
  const [activeRole, setActiveRole] = useState<BishopricRole>(() => {
    const savedUserStr = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.role && ['bishop', 'first_counselor', 'second_counselor', 'executive_secretary'].includes(parsed.role)) {
          return parsed.role as BishopricRole;
        }
      } catch (e) {
        console.error(e);
      }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    if (saved && (saved === 'bishop' || saved === 'first_counselor' || saved === 'second_counselor' || saved === 'executive_secretary')) {
      return saved as BishopricRole;
    }
    return 'bishop';
  });

  // Active Main Tab/View
  const [activeTab, setActiveTab] = useState<ViewTab>('org_chart');

  // Active Approvals Stage Sub-tab
  const [approvalsSubTab, setApprovalsSubTab] = useState<'pending' | 'for_interview' | 'for_sustaining' | 'for_recording' | 'declined'>('pending');

  // Selected Organization in Sidebar Filter
  const [selectedOrg, setSelectedOrg] = useState<string>('All Organizations');

  // Mobile Sidebar Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Firestore Real-time Cloud Sync Status
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'connected' | 'syncing' | 'error'>('connecting');

  // Main Callings State (cached initially from localStorage or defaults, then synced via Firestore)
  const [callings, setCallings] = useState<Calling[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CALLINGS);
    if (saved) {
      try { return sortCallings(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    return sortCallings(INITIAL_CALLINGS);
  });

  // Calling Proposals State
  const [proposals, setProposals] = useState<CallingProposal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROPOSALS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PROPOSALS;
  });

  // Modals state
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalTargetCalling, setProposalTargetCalling] = useState<Calling | null>(null);
  const [selectedCallingDetail, setSelectedCallingDetail] = useState<Calling | null>(null);
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
  const [isManualCallingModalOpen, setIsManualCallingModalOpen] = useState(false);
  const [manualCallingTarget, setManualCallingTarget] = useState<Calling | null>(null);

  // 1. Setup Firestore Real-time Subscriptions & Cloud Sync
  useEffect(() => {
    setSyncStatus('connecting');

    // Ensure database is populated with initial seed if empty
    ensureDatabaseSeeded().catch((err) => {
      console.warn('Seeding check warning:', err);
    });

    // Real-time listener for Callings collection
    const unsubscribeCallings = subscribeToCallings(
      (loadedCallings) => {
        if (loadedCallings && loadedCallings.length > 0) {
          setCallings(sortCallings(loadedCallings));
        }
        setSyncStatus('connected');
      },
      (error) => {
        console.error('Callings subscription failed:', error);
        setSyncStatus('error');
      }
    );

    // Real-time listener for Proposals collection
    const unsubscribeProposals = subscribeToProposals(
      (loadedProposals) => {
        setProposals(loadedProposals);
        setSyncStatus('connected');

        // If any proposals contain old discussion logs, auto-clear them once to clean up
        const hasLogs = loadedProposals.some(p => p.statusHistory && p.statusHistory.length > 0);
        if (hasLogs) {
          clearAllProposalsHistory().catch(err => console.warn('Auto clear logs err:', err));
        }
      },
      (error) => {
        console.error('Proposals subscription failed:', error);
        setSyncStatus('error');
      }
    );

    return () => {
      unsubscribeCallings();
      unsubscribeProposals();
    };
  }, []);

  // Sync auth user to localStorage
  useEffect(() => {
    localStorage.removeItem('masagana_2nd_ward_proposals_v1');
    localStorage.removeItem('masagana_2nd_ward_callings_v2');
    localStorage.removeItem('masagana_2nd_ward_proposals_v2');
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  }, [currentUser]);

  // Sync state to localStorage cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CALLINGS, JSON.stringify(callings));
  }, [callings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, activeRole);
  }, [activeRole]);

  // Handle Login & Role Assignment
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.isSuperAdmin) {
      setActiveRole('bishop');
    } else {
      setActiveRole(user.role as BishopricRole);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  };

  // Derived Summary Metrics
  const metrics = useMemo(() => {
    const totalCallings = callings.length;
    const vacantCount = callings.filter(c => c.isVacant).length;
    
    const pendingApprovalsCount = proposals.filter(
      p => p.finalStatus === 'pending_review' || p.finalStatus === 'approved_for_action'
    ).length;

    const needsSetApartCount = callings.filter(c => !c.isVacant && !c.setApart).length;

    const longTenureCount = callings.filter(c => {
      if (c.isVacant) return false;
      const tenure = calculateTenure(c.sustainedDate);
      return tenure.totalMonths >= 36;
    }).length;

    return {
      totalCallings,
      vacantCount,
      pendingApprovalsCount,
      needsSetApartCount,
      longTenureCount,
    };
  }, [callings, proposals]);

  // Calling count map grouped by organization
  const callingCountByOrg = useMemo(() => {
    const counts: Record<string, number> = {};
    callings.forEach(c => {
      counts[c.organization] = (counts[c.organization] || 0) + 1;
    });
    return counts;
  }, [callings]);

  // Dynamically compute members list including any new custom candidates from callings/proposals
  const allMembers = useMemo(() => {
    const memberMap = new Map<string, WardMember>();
    WARD_MEMBERS.forEach(m => memberMap.set(m.name, m));

    callings.forEach(c => {
      if (c.memberName && !memberMap.has(c.memberName)) {
        memberMap.set(c.memberName, {
          id: `m-dyn-${c.memberName}`,
          name: c.memberName,
          gender: 'M',
          currentCallings: [],
        });
      }
    });

    proposals.forEach(p => {
      if (p.proposedMemberName && !memberMap.has(p.proposedMemberName)) {
        memberMap.set(p.proposedMemberName, {
          id: `m-dyn-${p.proposedMemberName}`,
          name: p.proposedMemberName,
          gender: 'M',
          currentCallings: [],
        });
      }
    });

    return Array.from(memberMap.values());
  }, [callings, proposals]);

  // Handlers
  const handleRoleChange = (role: BishopricRole) => {
    setActiveRole(role);
  };

  const handleStatsFilterClick = (status: CallingFilterStatus) => {
    if (status === 'has_proposal') {
      setActiveTab('needs_approval');
    } else if (status === 'needs_set_apart') {
      setActiveTab('needs_set_apart');
    } else if (status === 'long_tenure' || status === 'vacant') {
      setActiveTab('consider_review');
    } else {
      setSelectedOrg('All Organizations');
      setActiveTab('org_chart');
    }
  };

  const handleToggleSetApart = async (callingId: string) => {
    const target = callings.find(c => c.id === callingId);
    if (!target) return;

    const updatedCalling = { ...target, setApart: !target.setApart };

    // Optimistic local update
    setCallings(prev => prev.map(c => c.id === callingId ? updatedCalling : c));

    if (selectedCallingDetail && selectedCallingDetail.id === callingId) {
      setSelectedCallingDetail(updatedCalling);
    }

    // Persist to Cloud Firestore
    setSyncStatus('syncing');
    try {
      await saveCallingToFirestore(updatedCalling);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync setApart status to Firestore:', e);
      setSyncStatus('error');
    }
  };

  const handleOpenProposeForCalling = (calling: Calling) => {
    setProposalTargetCalling(calling);
    setIsProposalModalOpen(true);
  };

  // 3-Point Approval Action
  const handleUpdateApproval = async (
    proposalId: string, 
    role: BishopricRole, 
    status: ApprovalStatus, 
    note?: string
  ) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const actorLeader = BISHOPRIC_LEADERS[role] || { title: 'Leader', name: 'Leader', shortName: 'Leader' };
    const todayStr = new Date().toISOString().split('T')[0];

    const currentApprovals = prop.approvals || {
      bishop: { status: 'pending' },
      first_counselor: { status: 'pending' },
      second_counselor: { status: 'pending' },
    };

    const updatedApprovals = {
      bishop: { status: currentApprovals.bishop?.status || 'pending', ...(currentApprovals.bishop || {}) },
      first_counselor: { status: currentApprovals.first_counselor?.status || 'pending', ...(currentApprovals.first_counselor || {}) },
      second_counselor: { status: currentApprovals.second_counselor?.status || 'pending', ...(currentApprovals.second_counselor || {}) },
    };

    if (role === 'bishop' || role === 'first_counselor' || role === 'second_counselor') {
      updatedApprovals[role] = {
        status,
        updatedAt: todayStr,
        note: note !== undefined ? note : (currentApprovals[role]?.note || ''),
      };
    }

    // Recalculate Final Status (Stage 1 -> Stage 2 transition)
    const statuses = [
      updatedApprovals.bishop.status,
      updatedApprovals.first_counselor.status,
      updatedApprovals.second_counselor.status,
    ];

    const approvedCount = statuses.filter(s => s === 'approved').length;
    const rejectedCount = statuses.filter(s => s === 'rejected').length;

    let newFinalStatus = prop.finalStatus;
    if (rejectedCount > 0) {
      newFinalStatus = 'declined';
    } else if (approvedCount === 3) {
      newFinalStatus = 'for_interview';
    } else {
      newFinalStatus = 'pending_review';
    }

    const actionText = status === 'approved' ? 'Approved proposal' : status === 'rejected' ? 'Declined proposal' : 'Reset approval';
    const actorName = currentUser?.isSuperAdmin 
      ? `${currentUser.name} (acting as ${actorLeader.title})`
      : currentUser?.name ? `${currentUser.name} (${currentUser.calling})` : actorLeader.name;

    const updatedProposal: CallingProposal = {
      ...prop,
      approvals: updatedApprovals,
      finalStatus: newFinalStatus,
      statusHistory: [
        ...(prop.statusHistory || []),
        {
          date: todayStr,
          action: `${actionText} as ${actorLeader.title}`,
          actor: actorName,
          note: note || undefined,
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync proposal approval to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Assign Interviewer in Stage 2 (For Interview)
  const handleAssignInterviewer = async (
    proposalId: string, 
    interviewerRole: BishopricRole, 
    interviewerName: string, 
    interviewDate?: string, 
    note?: string
  ) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const todayIso = new Date().toISOString().split('T')[0];
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : 'Bishopric';

    const updatedProposal: CallingProposal = {
      ...prop,
      assignedInterviewerRole: interviewerRole,
      assignedInterviewer: interviewerName,
      interviewDate: interviewDate || prop.interviewDate,
      interviewNotes: note || prop.interviewNotes,
      statusHistory: [
        ...(prop.statusHistory || []),
        {
          date: todayIso,
          action: `Interview assigned to ${interviewerName} (${interviewerRole.replace('_', ' ')})`,
          actor: actorName,
          note: note || undefined,
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync interviewer assignment:', e);
      setSyncStatus('error');
    }
  };

  // Stage 2 -> Stage 3: Interview Completed & Calling Accepted
  const handleInterviewCompleted = async (proposalId: string, note?: string, targetSunday?: string) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const todayIso = new Date().toISOString().split('T')[0];
    const interviewer = prop.assignedInterviewer || (currentUser ? currentUser.name : 'Bishopric');

    const updatedProposal: CallingProposal = {
      ...prop,
      finalStatus: 'for_sustaining',
      interviewNotes: note || prop.interviewNotes,
      statusHistory: [
        ...(prop.statusHistory || []),
        {
          date: todayIso,
          action: `Interview conducted by ${interviewer} — Calling extended & accepted`,
          actor: currentUser ? `${currentUser.name} (${currentUser.calling})` : interviewer,
          note: note || 'Candidate accepted calling. Advanced to Stage 3: For Sustaining.',
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync interview completion:', e);
      setSyncStatus('error');
    }
  };

  // Member Declined Calling Interview -> Reset for Discussion
  const handleMemberDeclined = async (proposalId: string, reasonNote: string, resetForDiscussion: boolean = true) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const todayIso = new Date().toISOString().split('T')[0];
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : 'Bishopric';

    const resetApprovals = {
      bishop: { status: 'pending' as ApprovalStatus, updatedAt: todayIso, note: '' },
      first_counselor: { status: 'pending' as ApprovalStatus, updatedAt: todayIso, note: '' },
      second_counselor: { status: 'pending' as ApprovalStatus, updatedAt: todayIso, note: '' },
    };

    const updatedProposal: CallingProposal = {
      ...prop,
      approvals: resetApprovals,
      finalStatus: 'pending_review',
      statusHistory: [
        ...(prop.statusHistory || []),
        {
          date: todayIso,
          action: `Member declined calling — Reset for Bishopric discussion`,
          actor: actorName,
          note: reasonNote || 'Candidate unable to accept calling. Reset to Stage 1: Pending Review for alternative candidate consideration.',
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync member decline to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Stage 4: Mark Recorded in Leader and Clerk Resources (LCR)
  const handleMarkRecordedInLCR = async (proposalId: string, lcrNote?: string, clerkName?: string) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const todayIso = new Date().toISOString().split('T')[0];
    const recordedBy = clerkName || (currentUser ? currentUser.name : 'Ward Clerk');

    const updatedProposal: CallingProposal = {
      ...prop,
      isRecordedInLCR: true,
      recordedInLCRDate: todayIso,
      recordedByClerk: recordedBy,
      statusHistory: [
        ...(prop.statusHistory || []),
        {
          date: todayIso,
          action: `Recorded in Leader and Clerk Resources (LCR)`,
          actor: recordedBy,
          note: lcrNote || 'Sustained calling entry recorded in Church LCR system.',
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync LCR recording status:', e);
      setSyncStatus('error');
    }
  };

  // Super Admin / Bishopric Reset Proposal for Discussion (Re-open declined or existing proposals)
  const handleResetProposal = async (proposalId: string, reason?: string) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const actorName = currentUser 
      ? (currentUser.isSuperAdmin ? `${currentUser.name} (Super Admin)` : `${currentUser.name} (${currentUser.calling})`)
      : 'Super Admin';

    const resetApprovals = {
      bishop: { status: 'pending' as ApprovalStatus, updatedAt: todayStr, note: '' },
      first_counselor: { status: 'pending' as ApprovalStatus, updatedAt: todayStr, note: '' },
      second_counselor: { status: 'pending' as ApprovalStatus, updatedAt: todayStr, note: '' },
    };

    const updatedProposal: CallingProposal = {
      ...prop,
      approvals: resetApprovals,
      finalStatus: 'pending_review',
      statusHistory: [
        ...(prop.statusHistory || []),
        {
          date: todayStr,
          action: 'Reset proposal for discussion (Re-opened)',
          actor: actorName,
          note: reason || 'Re-opened proposal for bishopric review',
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync proposal reset to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Clear all discussion & action logs across all proposals
  const handleClearAllLogs = async () => {
    setProposals(prev => prev.map(p => ({
      ...p,
      statusHistory: [],
      approvals: {
        bishop: { ...p.approvals.bishop, note: '' },
        first_counselor: { ...p.approvals.first_counselor, note: '' },
        second_counselor: { ...p.approvals.second_counselor, note: '' },
      }
    })));

    setSyncStatus('syncing');
    try {
      await clearAllProposalsHistory();
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to clear all proposal logs:', e);
      setSyncStatus('error');
    }
  };

  // Clear log for a single proposal
  const handleClearProposalHistory = async (proposalId: string) => {
    setProposals(prev => prev.map(p => p.id === proposalId ? {
      ...p,
      statusHistory: [],
      approvals: {
        bishop: { ...p.approvals.bishop, note: '' },
        first_counselor: { ...p.approvals.first_counselor, note: '' },
        second_counselor: { ...p.approvals.second_counselor, note: '' },
      }
    } : p));

    setSyncStatus('syncing');
    try {
      await clearProposalHistory(proposalId);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to clear proposal history in Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Super Admin Instant 3-Point Approval -> Moves to For Interview
  const handleSuperAdminApproveAll = async (proposalId: string) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const updatedApprovals = {
      bishop: { status: 'approved' as ApprovalStatus, updatedAt: todayStr, note: 'Approved via Super Admin' },
      first_counselor: { status: 'approved' as ApprovalStatus, updatedAt: todayStr, note: 'Approved via Super Admin' },
      second_counselor: { status: 'approved' as ApprovalStatus, updatedAt: todayStr, note: 'Approved via Super Admin' },
    };

    const updatedProposal: CallingProposal = {
      ...prop,
      approvals: updatedApprovals,
      finalStatus: 'for_interview',
      statusHistory: [
        ...prop.statusHistory,
        {
          date: todayStr,
          action: 'Super Admin Unanimous 3-Point Approval',
          actor: 'Super Admin',
          note: 'All 3 sign-offs authorized by Super Admin — Advanced to Stage 2: For Interview',
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync superadmin approval to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Select a Candidate from Proposal Discussion Pool
  const handleSelectCandidate = async (proposalId: string, candidateId: string) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const candidate = prop.candidates?.find(c => c.id === candidateId);
    if (!candidate) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name;

    const updatedCandidates = (prop.candidates || []).map(c => ({
      ...c,
      isSelected: c.id === candidateId
    }));

    const updatedProposal: CallingProposal = {
      ...prop,
      proposedMemberName: candidate.name,
      selectedCandidateId: candidate.id,
      candidates: updatedCandidates,
      statusHistory: [
        ...prop.statusHistory,
        {
          date: todayStr,
          action: `Selected candidate for recommendation: ${candidate.name}`,
          actor: actorName,
          note: candidate.note ? `Candidate note: ${candidate.note}` : undefined,
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync candidate selection to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Add an Alternative Candidate to Proposal Discussion Pool
  const handleAddCandidateToProposal = async (proposalId: string, candidateName: string, note?: string) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name;

    const newCandidate: CandidateOption = {
      id: `cand-${Date.now()}`,
      name: candidateName.trim(),
      note: note?.trim() || undefined,
      addedBy: actorName,
      dateAdded: todayStr,
      isSelected: false,
    };

    const existingCandidates = prop.candidates || [];
    const shouldAutoSelect = existingCandidates.length === 0 || prop.proposedMemberName.toLowerCase().includes('to be discussed');

    const updatedCandidates = [
      ...existingCandidates.map(c => shouldAutoSelect ? { ...c, isSelected: false } : c),
      { ...newCandidate, isSelected: shouldAutoSelect }
    ];

    const updatedProposal: CallingProposal = {
      ...prop,
      proposedMemberName: shouldAutoSelect ? newCandidate.name : prop.proposedMemberName,
      selectedCandidateId: shouldAutoSelect ? newCandidate.id : prop.selectedCandidateId,
      candidates: updatedCandidates,
      statusHistory: [
        ...prop.statusHistory,
        {
          date: todayStr,
          action: `Added alternative candidate to pool: ${newCandidate.name}`,
          actor: actorName,
          note: note ? `Reason: ${note}` : undefined,
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync added candidate to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Remove a Candidate from Proposal Discussion Pool
  const handleRemoveCandidateFromProposal = async (proposalId: string, candidateId: string) => {
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop || !prop.candidates) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name;

    const removed = prop.candidates.find(c => c.id === candidateId);
    const filtered = prop.candidates.filter(c => c.id !== candidateId);
    
    let newSelectedId = prop.selectedCandidateId;
    let newProposedName = prop.proposedMemberName;

    if (prop.selectedCandidateId === candidateId) {
      if (filtered.length > 0) {
        newSelectedId = filtered[0].id;
        newProposedName = filtered[0].name;
        filtered[0].isSelected = true;
      } else {
        newSelectedId = undefined;
        newProposedName = 'To be discussed';
      }
    }

    const updatedProposal: CallingProposal = {
      ...prop,
      candidates: filtered,
      selectedCandidateId: newSelectedId,
      proposedMemberName: newProposedName,
      statusHistory: [
        ...prop.statusHistory,
        {
          date: todayStr,
          action: `Removed candidate from pool: ${removed?.name || candidateId}`,
          actor: actorName,
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync candidate removal to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Update Candidate Name on an existing proposal
  const handleUpdateProposalCandidate = async (proposalId: string, candidateName: string) => {
    if (!candidateName.trim()) {
      alert('Please enter a candidate name.');
      return;
    }
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name;

    const newCandId = `cand-${Date.now()}`;
    const newCand: CandidateOption = {
      id: newCandId,
      name: candidateName.trim(),
      addedBy: actorName,
      dateAdded: todayStr,
      isSelected: true
    };

    const existing = prop.candidates || [];
    const updatedCandidates = [
      ...existing.map(c => ({ ...c, isSelected: false })),
      newCand
    ];

    const updatedProposal: CallingProposal = {
      ...prop,
      proposedMemberName: candidateName.trim(),
      selectedCandidateId: newCandId,
      candidates: updatedCandidates,
      statusHistory: [
        ...prop.statusHistory,
        {
          date: todayStr,
          action: `Proposed candidate name: ${candidateName.trim()}`,
          actor: actorName,
        }
      ]
    };

    setProposals(prev => prev.map(p => p.id === proposalId ? updatedProposal : p));

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(updatedProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync candidate update to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Stage 3 -> Stage 4: Mark Sustained in Sacrament Meeting & Update Main Calling Record
  const handleSustainCalling = async (proposal: CallingProposal, sacramentDate?: string) => {
    if (proposal.proposedMemberName.toLowerCase().includes('to be discussed') || !proposal.proposedMemberName.trim()) {
      alert('Please propose and assign a specific candidate name before marking as sustained.');
      return;
    }

    const todayStr = sacramentDate || getTodayDateString();
    const todayIso = new Date().toISOString().split('T')[0];
    const targetCalling = callings.find(c => c.id === proposal.callingId);
    if (!targetCalling) return;

    // 1. Updated Calling Position
    const updatedCalling: Calling = {
      ...targetCalling,
      memberName: proposal.proposedMemberName,
      sustainedDate: todayStr,
      setApart: false, // Needs setting apart after sustaining
      isVacant: false,
    };

    // 2. Updated Proposal Status (Moves to Stage 4: For Recording)
    const updatedProposal: CallingProposal = {
      ...proposal,
      finalStatus: 'for_recording',
      sustainedDate: todayStr,
      statusHistory: [
        ...proposal.statusHistory,
        {
          date: todayIso,
          action: `Sustained in Ward Sacrament Meeting on ${todayStr} — Advanced to Stage 4: For Recording`,
          actor: currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name,
        }
      ]
    };

    // Update local state
    setCallings(prev => sortCallings(prev.map(c => c.id === proposal.callingId ? updatedCalling : c)));
    setProposals(prev => prev.map(p => p.id === proposal.id ? updatedProposal : p));

    // Save to Firestore
    setSyncStatus('syncing');
    try {
      await Promise.all([
        saveCallingToFirestore(updatedCalling),
        saveProposalToFirestore(updatedProposal)
      ]);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync sustained status to Firestore:', e);
      setSyncStatus('error');
    }

    setApprovalsSubTab('for_recording');
  };

  // Open Direct Calling Edit Modal (Admin bypass)
  const handleOpenDirectEdit = (calling?: Calling) => {
    setManualCallingTarget(calling || null);
    setIsManualCallingModalOpen(true);
  };

  // Admin Direct Update Calling (Bypasses proposal queue or syncs directly)
  const handleDirectUpdateCalling = async (callingId: string, updates: {
    memberName: string | null;
    sustainedDate: string | null;
    setApart: boolean;
    isVacant: boolean;
    note?: string;
  }) => {
    const targetCalling = callings.find(c => c.id === callingId);
    if (!targetCalling) return;

    const todayIso = new Date().toISOString().split('T')[0];
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : 'Administrator';

    const updatedCalling: Calling = {
      ...targetCalling,
      memberName: updates.isVacant ? null : updates.memberName,
      sustainedDate: updates.isVacant ? null : (updates.sustainedDate || null),
      setApart: updates.isVacant ? false : updates.setApart,
      isVacant: updates.isVacant,
    };

    // Check if there's an active proposal for this position
    const matchingProposal = proposals.find(
      p => p.callingId === callingId && (p.finalStatus === 'pending_review' || p.finalStatus === 'approved_for_action')
    );

    let updatedProposal: CallingProposal | null = null;
    if (matchingProposal && !updates.isVacant && updates.memberName) {
      updatedProposal = {
        ...matchingProposal,
        proposedMemberName: updates.memberName,
        finalStatus: 'sustained',
        statusHistory: [
          ...(matchingProposal.statusHistory || []),
          {
            date: todayIso,
            action: 'Direct manual calling assignment by administrator',
            actor: actorName,
            note: updates.note || 'Calling assigned directly in ward directory',
          }
        ]
      };
    }

    // Update state immediately
    setCallings(prev => sortCallings(prev.map(c => c.id === callingId ? updatedCalling : c)));
    if (updatedProposal) {
      setProposals(prev => prev.map(p => p.id === updatedProposal!.id ? updatedProposal! : p));
    }
    if (selectedCallingDetail && selectedCallingDetail.id === callingId) {
      setSelectedCallingDetail(updatedCalling);
    }

    setSyncStatus('syncing');
    try {
      await saveCallingToFirestore(updatedCalling);
      if (updatedProposal) {
        await saveProposalToFirestore(updatedProposal);
      }
      setSyncStatus('connected');
    } catch (err) {
      console.error('Failed to sync direct calling update to Firestore:', err);
      setSyncStatus('error');
    }
  };

  // Admin Direct Release Member from Calling (Immediate vacancy)
  const handleDirectReleaseCalling = async (callingId: string) => {
    const targetCalling = callings.find(c => c.id === callingId);
    if (!targetCalling) return;

    await handleDirectUpdateCalling(callingId, {
      memberName: null,
      sustainedDate: null,
      setApart: false,
      isVacant: true,
      note: `Released ${targetCalling.memberName || 'member'} from ${targetCalling.title} directly`,
    });
  };

  // Create New Calling Proposal
  const handleCreateProposal = async (data: {
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
  }) => {
    const todayStr = '2026-07-26';

    const initialApprovals = {
      bishop: { status: 'pending' as ApprovalStatus },
      first_counselor: { status: 'pending' as ApprovalStatus },
      second_counselor: { status: 'pending' as ApprovalStatus },
    };

    const newProposal: CallingProposal = {
      id: `prop-${Date.now()}`,
      callingId: data.callingId,
      callingTitle: data.callingTitle,
      organization: data.organization,
      subOrg: data.subOrg,
      type: data.type,
      currentMemberName: data.currentMemberName,
      proposedMemberName: data.proposedMemberName,
      proposedByName: data.proposedByName,
      reasonNote: data.reasonNote,
      candidates: data.candidates,
      selectedCandidateId: data.selectedCandidateId,
      dateProposed: todayStr,
      approvals: initialApprovals,
      finalStatus: 'pending_review',
      statusHistory: [
        {
          date: todayStr,
          action: data.candidates && data.candidates.length > 1
            ? `Proposed calling recommendation with ${data.candidates.length} candidates in discussion pool`
            : 'Proposed calling recommendation',
          actor: data.proposedByName,
          note: data.reasonNote || undefined,
        }
      ]
    };

    setProposals(prev => [newProposal, ...prev]);
    setActiveTab('needs_approval');

    setSyncStatus('syncing');
    try {
      await saveProposalToFirestore(newProposal);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync new proposal to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Add Custom Calling Position
  const handleAddCustomCalling = async (data: {
    organization: string;
    subOrg: string;
    title: string;
    memberName: string | null;
    sustainedDate: string | null;
    setApart: boolean;
    isVacant: boolean;
  }) => {
    const newCalling: Calling = {
      id: `custom-${Date.now()}`,
      organization: data.organization,
      subOrg: data.subOrg,
      title: data.title,
      memberName: data.memberName,
      sustainedDate: data.sustainedDate,
      setApart: data.setApart,
      isVacant: data.isVacant,
      isCustom: true,
    };

    setCallings(prev => sortCallings([newCalling, ...prev]));
    setSelectedOrg(data.organization);
    setActiveTab('org_chart');

    setSyncStatus('syncing');
    try {
      await saveCallingToFirestore(newCalling);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync custom calling to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Delete Vacant Calling Position
  const handleDeleteCalling = async (callingId: string, callingTitle?: string) => {
    const target = callings.find(c => c.id === callingId);
    const title = callingTitle || target?.title || 'this position';

    if (!confirm(`Are you sure you want to delete the vacant position "${title}"? This will remove it from the organization directory.`)) {
      return;
    }

    const relatedProposals = proposals.filter(p => p.callingId === callingId);

    // 1. Remove from callings list
    setCallings(prev => prev.filter(c => c.id !== callingId));

    // 2. Remove any proposals for this calling
    setProposals(prev => prev.filter(p => p.callingId !== callingId));

    // 3. Close detail modal if open
    if (selectedCallingDetail && selectedCallingDetail.id === callingId) {
      setSelectedCallingDetail(null);
    }

    setSyncStatus('syncing');
    try {
      await deleteCallingFromFirestore(callingId);
      await Promise.all(relatedProposals.map(p => deleteProposalFromFirestore(p.id)));
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to sync calling deletion to Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Delete a Calling Proposal
  const handleDeleteProposal = async (proposalId: string, callingTitle?: string) => {
    const target = proposals.find(p => p.id === proposalId);
    const title = callingTitle || target?.callingTitle || 'this proposal';

    if (!confirm(`Are you sure you want to delete the proposal for "${title}"? This will permanently remove it from the approvals queue.`)) {
      return;
    }

    // 1. Optimistic removal from state
    setProposals(prev => prev.filter(p => p.id !== proposalId));

    // 2. Persist locally
    const updated = proposals.filter(p => p.id !== proposalId);
    localStorage.setItem(STORAGE_KEYS.PROPOSALS, JSON.stringify(updated));

    setSyncStatus('syncing');
    try {
      await deleteProposalFromFirestore(proposalId);
      setSyncStatus('connected');
    } catch (e) {
      console.error('Failed to delete proposal from Firestore:', e);
      setSyncStatus('error');
    }
  };

  // Reset Data to Original Default in Cloud Firestore
  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all calling approvals and restoration data to the ward default report in cloud Firestore?')) {
      setSyncStatus('syncing');
      try {
        await resetFirestoreToDefaults();
        setCallings(sortCallings(INITIAL_CALLINGS));
        setProposals(INITIAL_PROPOSALS);
        localStorage.removeItem(STORAGE_KEYS.CALLINGS);
        localStorage.removeItem(STORAGE_KEYS.PROPOSALS);
        setSyncStatus('connected');
        alert('Ward database successfully reset and synced to cloud Firestore defaults.');
      } catch (e) {
        console.error('Failed to reset Firestore to defaults:', e);
        setSyncStatus('error');
        alert('Failed to reset cloud database. Please verify your connection.');
      }
    }
  };

  // Render Login Screen if user is not authenticated
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Top Header for Mobile */}
      <Navbar
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        syncStatus={syncStatus}
      />

      {/* Main Body Layout with Sticky Sidebar + Main View */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto min-h-screen">
        
        {/* Left Side Navigation (Sticky, with brand logo on top, sync status, and account at bottom) */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedOrg={selectedOrg}
          onSelectOrg={setSelectedOrg}
          metrics={metrics}
          callingCountByOrg={callingCountByOrg}
          syncStatus={syncStatus}
          onResetData={handleResetData}
          onLogout={handleLogout}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Main View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden min-w-0">
          
          {/* Summary Overview Cards */}
          <StatsOverview
            userName={currentUser.name.split(' ')[0]}
            totalCallings={metrics.totalCallings}
            vacantCount={metrics.vacantCount}
            pendingApprovalsCount={metrics.pendingApprovalsCount}
            needsSetApartCount={metrics.needsSetApartCount}
            longTenureCount={metrics.longTenureCount}
            onFilterClick={handleStatsFilterClick}
          />

          {/* View 1: Full Org Chart & Directory */}
          {activeTab === 'org_chart' && (
            <OrgChartDirectory
              callings={callings}
              proposals={proposals}
              selectedOrg={selectedOrg}
              onSelectOrg={setSelectedOrg}
              onProposeForCalling={handleOpenProposeForCalling}
              onToggleSetApart={handleToggleSetApart}
              onSelectCalling={setSelectedCallingDetail}
              onOpenAddCustomCalling={() => setIsAddCustomModalOpen(true)}
              onOpenDirectEdit={handleOpenDirectEdit}
              onDeleteCalling={handleDeleteCalling}
              currentUser={currentUser}
              onSelectCandidate={handleSelectCandidate}
              onAddCandidate={handleAddCandidateToProposal}
              onNavigateToApprovals={(tabKey) => {
                setActiveTab('needs_approval');
                if (tabKey) setApprovalsSubTab(tabKey);
              }}
            />
          )}

          {/* View 2: Callings Needing Approval (4-Stage Workflow) */}
          {activeTab === 'needs_approval' && (
            <ApprovalsQueue
              currentUser={currentUser}
              proposals={proposals}
              allCallings={callings}
              activeRole={activeRole}
              onRoleChange={setActiveRole}
              onUpdateApproval={handleUpdateApproval}
              onAssignInterviewer={handleAssignInterviewer}
              onInterviewCompleted={handleInterviewCompleted}
              onMemberDeclined={handleMemberDeclined}
              onMarkSustained={handleSustainCalling}
              onMarkRecordedInLCR={handleMarkRecordedInLCR}
              onToggleSetApart={handleToggleSetApart}
              onResetProposal={handleResetProposal}
              onClearAllLogs={handleClearAllLogs}
              onClearProposalHistory={handleClearProposalHistory}
              onUpdateProposalCandidate={handleUpdateProposalCandidate}
              onSelectCandidate={handleSelectCandidate}
              onAddCandidateToProposal={handleAddCandidateToProposal}
              onRemoveCandidateFromProposal={handleRemoveCandidateFromProposal}
              onSuperAdminApproveAll={handleSuperAdminApproveAll}
              onDeleteProposal={handleDeleteProposal}
              activeSubTab={approvalsSubTab}
              onSubTabChange={setApprovalsSubTab}
            />
          )}

          {/* View 3: Callings Needing Setting Apart */}
          {activeTab === 'needs_set_apart' && (
            <NeedsSetApartView
              callings={callings}
              onToggleSetApart={handleToggleSetApart}
              onProposeForCalling={handleOpenProposeForCalling}
              onSelectCalling={setSelectedCallingDetail}
            />
          )}

          {/* View 4: Consider for Review (Vacant & Long Tenure) */}
          {activeTab === 'consider_review' && (
            <ConsiderForReviewView
              callings={callings}
              onProposeForCalling={handleOpenProposeForCalling}
              onSelectCalling={setSelectedCallingDetail}
              onDeleteCalling={handleDeleteCalling}
            />
          )}

          {/* View 5: Tenure & Analytics */}
          {activeTab === 'analytics' && (
            <AnalyticsView
              callings={callings}
              onSelectCalling={setSelectedCallingDetail}
              onProposeForCalling={handleOpenProposeForCalling}
            />
          )}

        </main>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <p>
          Masagana 2nd Ward (298506) • Antipolo Philippines Stake (527467) • Calling Approvals System • Cloud Firestore Synced
        </p>
      </footer>

      {/* MODALS */}
      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        targetCalling={proposalTargetCalling}
        allCallings={callings}
        wardMembers={allMembers}
        activeRole={activeRole}
        currentUser={currentUser}
        onSubmitProposal={handleCreateProposal}
      />

      <CallingDetailModal
        calling={selectedCallingDetail}
        proposals={proposals}
        currentUser={currentUser}
        onClose={() => setSelectedCallingDetail(null)}
        onProposeForCalling={handleOpenProposeForCalling}
        onToggleSetApart={handleToggleSetApart}
        onDirectEditCalling={handleOpenDirectEdit}
        onDirectReleaseCalling={handleDirectReleaseCalling}
        onDeleteCalling={handleDeleteCalling}
        onDeleteProposal={handleDeleteProposal}
        onResetProposal={handleResetProposal}
      />

      <AddCustomCallingModal
        isOpen={isAddCustomModalOpen}
        onClose={() => setIsAddCustomModalOpen(false)}
        defaultOrg={selectedOrg}
        wardMembers={allMembers}
        onAddCalling={handleAddCustomCalling}
      />

      <ManualCallingModal
        isOpen={isManualCallingModalOpen}
        onClose={() => {
          setIsManualCallingModalOpen(false);
          setManualCallingTarget(null);
        }}
        calling={manualCallingTarget}
        allCallings={callings}
        proposals={proposals}
        onSaveCalling={handleDirectUpdateCalling}
        currentUser={currentUser}
      />

    </div>
  );
}
