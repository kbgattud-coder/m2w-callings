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
import { calculateTenure } from './utils/tenure';

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
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    if (saved && (saved === 'bishop' || saved === 'first_counselor' || saved === 'second_counselor' || saved === 'executive_secretary')) {
      return saved as BishopricRole;
    }
    return 'bishop';
  });

  // Active Main Tab/View
  const [activeTab, setActiveTab] = useState<ViewTab>('org_chart');

  // Selected Organization in Sidebar Filter
  const [selectedOrg, setSelectedOrg] = useState<string>('All Organizations');

  // Mobile Sidebar Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Main Callings State
  const [callings, setCallings] = useState<Calling[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CALLINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CALLINGS;
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

  // Sync auth user to localStorage
  useEffect(() => {
    // Clear old legacy cache versions
    localStorage.removeItem('masagana_2nd_ward_proposals_v1');
    localStorage.removeItem('masagana_2nd_ward_callings_v2');
    localStorage.removeItem('masagana_2nd_ward_proposals_v2');
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  }, [currentUser]);

  // Sync state to localStorage
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
      return tenure.totalMonths >= 24;
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

  const handleToggleSetApart = (callingId: string) => {
    setCallings(prev => prev.map(c => {
      if (c.id === callingId) {
        return { ...c, setApart: !c.setApart };
      }
      return c;
    }));

    if (selectedCallingDetail && selectedCallingDetail.id === callingId) {
      setSelectedCallingDetail(prev => prev ? { ...prev, setApart: !prev.setApart } : null);
    }
  };

  const handleOpenProposeForCalling = (calling: Calling) => {
    setProposalTargetCalling(calling);
    setIsProposalModalOpen(true);
  };

  // 3-Point Approval Action
  const handleUpdateApproval = (
    proposalId: string, 
    role: BishopricRole, 
    status: ApprovalStatus, 
    note?: string
  ) => {
    const actorLeader = BISHOPRIC_LEADERS[role];
    const todayStr = '2026-07-26';

    setProposals(prev => prev.map(prop => {
      if (prop.id !== proposalId) return prop;

      const updatedApprovals = {
        ...prop.approvals,
        [role]: {
          status,
          updatedAt: todayStr,
          note: note || prop.approvals[role].note,
        }
      };

      // Recalculate Final Status
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
        newFinalStatus = 'approved_for_action';
      } else {
        newFinalStatus = 'pending_review';
      }

      const actionText = status === 'approved' ? 'Approved proposal' : 'Declined proposal';
      const actorName = currentUser?.isSuperAdmin 
        ? `${currentUser.name} (acting as ${actorLeader.title})`
        : currentUser?.name || actorLeader.name;

      return {
        ...prop,
        approvals: updatedApprovals,
        finalStatus: newFinalStatus,
        statusHistory: [
          ...prop.statusHistory,
          {
            date: todayStr,
            action: `${actionText} as ${actorLeader.title}`,
            actor: actorName,
            note: note || undefined,
          }
        ]
      };
    }));
  };

  // Super Admin Instant 3-Point Approval
  const handleSuperAdminApproveAll = (proposalId: string) => {
    const todayStr = '2026-07-26';

    setProposals(prev => prev.map(prop => {
      if (prop.id !== proposalId) return prop;

      const updatedApprovals = {
        bishop: { status: 'approved' as ApprovalStatus, updatedAt: todayStr, note: 'Approved via Super Admin' },
        first_counselor: { status: 'approved' as ApprovalStatus, updatedAt: todayStr, note: 'Approved via Super Admin' },
        second_counselor: { status: 'approved' as ApprovalStatus, updatedAt: todayStr, note: 'Approved via Super Admin' },
      };

      return {
        ...prop,
        approvals: updatedApprovals,
        finalStatus: 'approved_for_action',
        statusHistory: [
          ...prop.statusHistory,
          {
            date: todayStr,
            action: 'Super Admin Unanimous 3-Point Approval',
            actor: 'Super Admin',
            note: 'All 3 sign-offs authorized by Super Admin',
          }
        ]
      };
    }));
  };

  // Select a Candidate from Proposal Discussion Pool
  const handleSelectCandidate = (proposalId: string, candidateId: string) => {
    const todayStr = '2026-07-26';
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name;

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        const candidate = p.candidates?.find(c => c.id === candidateId);
        if (!candidate) return p;

        const updatedCandidates = (p.candidates || []).map(c => ({
          ...c,
          isSelected: c.id === candidateId
        }));

        return {
          ...p,
          proposedMemberName: candidate.name,
          selectedCandidateId: candidate.id,
          candidates: updatedCandidates,
          statusHistory: [
            ...p.statusHistory,
            {
              date: todayStr,
              action: `Selected candidate for recommendation: ${candidate.name}`,
              actor: actorName,
              note: candidate.note ? `Candidate note: ${candidate.note}` : undefined,
            }
          ]
        };
      }
      return p;
    }));
  };

  // Add an Alternative Candidate to Proposal Discussion Pool
  const handleAddCandidateToProposal = (proposalId: string, candidateName: string, note?: string) => {
    const todayStr = '2026-07-26';
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name;

    const newCandidate: CandidateOption = {
      id: `cand-${Date.now()}`,
      name: candidateName.trim(),
      note: note?.trim() || undefined,
      addedBy: actorName,
      dateAdded: todayStr,
      isSelected: false,
    };

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        const existingCandidates = p.candidates || [];
        const shouldAutoSelect = existingCandidates.length === 0 || p.proposedMemberName.toLowerCase().includes('to be discussed');

        const updatedCandidates = [
          ...existingCandidates.map(c => shouldAutoSelect ? { ...c, isSelected: false } : c),
          { ...newCandidate, isSelected: shouldAutoSelect }
        ];

        return {
          ...p,
          proposedMemberName: shouldAutoSelect ? newCandidate.name : p.proposedMemberName,
          selectedCandidateId: shouldAutoSelect ? newCandidate.id : p.selectedCandidateId,
          candidates: updatedCandidates,
          statusHistory: [
            ...p.statusHistory,
            {
              date: todayStr,
              action: `Added alternative candidate to pool: ${newCandidate.name}`,
              actor: actorName,
              note: note ? `Reason: ${note}` : undefined,
            }
          ]
        };
      }
      return p;
    }));
  };

  // Remove a Candidate from Proposal Discussion Pool
  const handleRemoveCandidateFromProposal = (proposalId: string, candidateId: string) => {
    const todayStr = '2026-07-26';
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name;

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId && p.candidates) {
        const removed = p.candidates.find(c => c.id === candidateId);
        const filtered = p.candidates.filter(c => c.id !== candidateId);
        
        let newSelectedId = p.selectedCandidateId;
        let newProposedName = p.proposedMemberName;

        if (p.selectedCandidateId === candidateId) {
          if (filtered.length > 0) {
            newSelectedId = filtered[0].id;
            newProposedName = filtered[0].name;
            filtered[0].isSelected = true;
          } else {
            newSelectedId = undefined;
            newProposedName = 'To be discussed';
          }
        }

        return {
          ...p,
          candidates: filtered,
          selectedCandidateId: newSelectedId,
          proposedMemberName: newProposedName,
          statusHistory: [
            ...p.statusHistory,
            {
              date: todayStr,
              action: `Removed candidate from pool: ${removed?.name || candidateId}`,
              actor: actorName,
            }
          ]
        };
      }
      return p;
    }));
  };

  // Update Candidate Name on an existing proposal
  const handleUpdateProposalCandidate = (proposalId: string, candidateName: string) => {
    if (!candidateName.trim()) {
      alert('Please enter a candidate name.');
      return;
    }
    const todayStr = '2026-07-26';
    const actorName = currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name;

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        const newCandId = `cand-${Date.now()}`;
        const newCand: CandidateOption = {
          id: newCandId,
          name: candidateName.trim(),
          addedBy: actorName,
          dateAdded: todayStr,
          isSelected: true
        };

        const existing = p.candidates || [];
        const updatedCandidates = [
          ...existing.map(c => ({ ...c, isSelected: false })),
          newCand
        ];

        return {
          ...p,
          proposedMemberName: candidateName.trim(),
          selectedCandidateId: newCandId,
          candidates: updatedCandidates,
          statusHistory: [
            ...p.statusHistory,
            {
              date: todayStr,
              action: `Proposed candidate name: ${candidateName.trim()}`,
              actor: actorName,
            }
          ]
        };
      }
      return p;
    }));
  };

  // Mark Sustained & Update Main Calling Record
  const handleSustainCalling = (proposal: CallingProposal) => {
    if (proposal.proposedMemberName.toLowerCase().includes('to be discussed') || !proposal.proposedMemberName.trim()) {
      alert('Please propose and assign a specific candidate name before marking as sustained.');
      return;
    }

    const todayStr = '26 Jul 2026';

    // 1. Update Calling Position
    setCallings(prev => prev.map(c => {
      if (c.id === proposal.callingId) {
        return {
          ...c,
          memberName: proposal.proposedMemberName,
          sustainedDate: todayStr,
          setApart: false, // Needs setting apart after sustaining
          isVacant: false,
        };
      }
      return c;
    }));

    // 2. Update Proposal Status
    setProposals(prev => prev.map(p => {
      if (p.id === proposal.id) {
        return {
          ...p,
          finalStatus: 'sustained',
          statusHistory: [
            ...p.statusHistory,
            {
              date: '2026-07-26',
              action: 'Calling sustained in Ward Meeting',
              actor: currentUser ? `${currentUser.name} (${currentUser.calling})` : BISHOPRIC_LEADERS[activeRole].name,
            }
          ]
        };
      }
      return p;
    }));

    alert(`Successfully recorded: ${proposal.proposedMemberName} sustained as ${proposal.callingTitle}!`);
  };

  // Create New Calling Proposal
  const handleCreateProposal = (data: {
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
  };

  // Add Custom Calling Position
  const handleAddCustomCalling = (data: {
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

    setCallings(prev => [newCalling, ...prev]);
    // Switch to that organization so the user immediately sees it
    setSelectedOrg(data.organization);
    setActiveTab('org_chart');
  };

  // Delete Vacant Calling Position
  const handleDeleteCalling = (callingId: string, callingTitle?: string) => {
    const target = callings.find(c => c.id === callingId);
    const title = callingTitle || target?.title || 'this position';

    if (!confirm(`Are you sure you want to delete the vacant position "${title}"? This will remove it from the organization directory.`)) {
      return;
    }

    // 1. Remove from callings list
    setCallings(prev => prev.filter(c => c.id !== callingId));

    // 2. Remove any proposals for this calling
    setProposals(prev => prev.filter(p => p.callingId !== callingId));

    // 3. Close detail modal if open
    if (selectedCallingDetail && selectedCallingDetail.id === callingId) {
      setSelectedCallingDetail(null);
    }
  };

  // Reset Data to Original Default
  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all calling approvals and restoration data to the ward default report?')) {
      setCallings(INITIAL_CALLINGS);
      setProposals(INITIAL_PROPOSALS);
      localStorage.removeItem(STORAGE_KEYS.CALLINGS);
      localStorage.removeItem(STORAGE_KEYS.PROPOSALS);
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
      />

      {/* Main Body Layout with Sticky Sidebar + Main View */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto min-h-screen">
        
        {/* Left Side Navigation (Sticky, with brand logo on top and account at bottom) */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedOrg={selectedOrg}
          onSelectOrg={setSelectedOrg}
          metrics={metrics}
          callingCountByOrg={callingCountByOrg}
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
              onDeleteCalling={handleDeleteCalling}
            />
          )}

          {/* View 2: Callings Needing Approval */}
          {activeTab === 'needs_approval' && (
            <ApprovalsQueue
              currentUser={currentUser}
              proposals={proposals}
              allCallings={callings}
              activeRole={activeRole}
              onUpdateApproval={handleUpdateApproval}
              onUpdateProposalCandidate={handleUpdateProposalCandidate}
              onSelectCandidate={handleSelectCandidate}
              onAddCandidateToProposal={handleAddCandidateToProposal}
              onRemoveCandidateFromProposal={handleRemoveCandidateFromProposal}
              onSuperAdminApproveAll={handleSuperAdminApproveAll}
              onSustainCalling={handleSustainCalling}
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
          Masagana 2nd Ward (298506) • Antipolo Philippines Stake (527467) • Calling Approvals System
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
        onClose={() => setSelectedCallingDetail(null)}
        onProposeForCalling={handleOpenProposeForCalling}
        onToggleSetApart={handleToggleSetApart}
        onDeleteCalling={handleDeleteCalling}
      />

      <AddCustomCallingModal
        isOpen={isAddCustomModalOpen}
        onClose={() => setIsAddCustomModalOpen(false)}
        defaultOrg={selectedOrg}
        wardMembers={allMembers}
        onAddCalling={handleAddCustomCalling}
      />

    </div>
  );
}
