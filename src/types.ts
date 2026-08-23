export type BishopricRole = 'bishop' | 'first_counselor' | 'second_counselor' | 'executive_secretary';

export type UserRole = BishopricRole | 'super_admin';

export interface AuthUser {
  id: string;
  name: string;
  calling: string;
  email: string;
  role: BishopricRole | 'super_admin';
  isSuperAdmin: boolean;
}

export type ProposalType = 'fill_vacancy' | 'release_and_replace';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface BishopricApproval {
  status: ApprovalStatus;
  updatedAt?: string;
  note?: string;
}

export interface ApprovalsState {
  bishop: BishopricApproval;
  first_counselor: BishopricApproval;
  second_counselor: BishopricApproval;
}

export interface CandidateOption {
  id: string;
  name: string;
  note?: string;
  addedBy?: string;
  dateAdded?: string;
  isSelected?: boolean;
}

export interface CallingProposal {
  id: string;
  callingId: string;
  callingTitle: string;
  organization: string;
  subOrg: string;
  type: ProposalType;
  currentMemberName: string | null;
  proposedMemberName: string;
  candidates?: CandidateOption[];
  selectedCandidateId?: string;
  proposedByRole?: BishopricRole;
  proposedByName: string;
  reasonNote: string;
  dateProposed: string;
  approvals: ApprovalsState;
  finalStatus: 'pending_review' | 'approved_for_action' | 'sustained' | 'declined';
  statusHistory: Array<{
    date: string;
    action: string;
    actor: string;
    note?: string;
  }>;
}

export interface Calling {
  id: string;
  organization: string;
  subOrg: string;
  title: string;
  memberName: string | null; // null or 'Calling Vacant'
  sustainedDate: string | null; // e.g. "2024-09-08" or "8 Sep 2024"
  setApart: boolean;
  isVacant: boolean;
  isCustom?: boolean;
}

export interface WardMember {
  id: string;
  name: string;
  gender: 'M' | 'F';
  priesthood?: string;
  currentCallings: string[];
}

export type ViewTab = 'org_chart' | 'needs_approval' | 'needs_set_apart' | 'consider_review' | 'analytics';

export type CallingFilterStatus = 'all' | 'vacant' | 'filled' | 'needs_set_apart' | 'long_tenure' | 'has_proposal';
