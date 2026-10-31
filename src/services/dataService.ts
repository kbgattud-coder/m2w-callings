import type { Calling, CallingProposal, CouncilMessage } from '../types';
import type { Doc, WriteOp } from '../lib/syncProtocol';
import { INITIAL_CALLINGS, INITIAL_PROPOSALS } from '../data/initialData';
import { fetchAll, subscribe, write } from './liveStore';

// Remove undefined fields, as the app did when it saved to Firestore, so stored documents keep the same shape
function cleanDoc<T>(data: T): Doc {
  const clean: Doc = {};
  for (const [key, value] of Object.entries(data as any)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      clean[key] = value.map(item => typeof item === 'object' && item !== null ? cleanDoc(item) : item);
    } else if (value !== null && typeof value === 'object') {
      clean[key] = cleanDoc(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

const seedOps = (): WriteOp[] => [
  ...INITIAL_CALLINGS.map((calling): WriteOp => ({ op: 'set', collection: 'callings', id: calling.id, data: cleanDoc(calling) })),
  ...INITIAL_PROPOSALS.map((proposal): WriteOp => ({ op: 'set', collection: 'proposals', id: proposal.id, data: cleanDoc(proposal) })),
  {
    op: 'set',
    collection: 'system_meta',
    id: 'seed_info',
    data: { seededAt: new Date().toISOString(), version: 'v3', initialCallingsCount: INITIAL_CALLINGS.length },
  },
];

// Callings that older seeds still listed under members who have since been released
const RELEASED_SEED_MEMBERS: Record<string, string> = {
  'ss-9': 'Bala, Antonette Triñanes Oneza',
  'oth-6': 'Reyes, Matfrancis Castillo',
};

/**
 * Seed the ward's callings if the database is empty; otherwise sync callings released since an older seed.
 */
export async function ensureDatabaseSeeded(): Promise<void> {
  try {
    const all = await fetchAll();
    if (Object.keys(all.callings).length === 0) {
      console.log('Database is empty. Seeding initial Masagana 2nd Ward callings & proposals...');
      await seedInitialData();
      return;
    }
    const ops: WriteOp[] = [];
    for (const [id, releasedMember] of Object.entries(RELEASED_SEED_MEMBERS)) {
      const seeded = INITIAL_CALLINGS.find(c => c.id === id);
      if (seeded && all.callings[id]?.memberName === releasedMember) {
        ops.push({ op: 'set', collection: 'callings', id, data: cleanDoc(seeded), merge: true });
      }
    }
    await write(ops);
  } catch (error) {
    console.error('Error checking or seeding the database:', error);
  }
}

/**
 * Seed the initial ward callings and proposals, and record when.
 */
export async function seedInitialData(): Promise<void> {
  try {
    await write(seedOps());
    console.log('Successfully seeded Masagana 2nd Ward data.');
  } catch (error) {
    console.error('Error seeding initial data:', error);
    throw error;
  }
}

let seededFromEmptyUpdate = false;

/**
 * Subscribe to real-time Callings updates
 */
export function subscribeToCallings(
  onUpdate: (callings: Calling[]) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribe(
    'callings',
    (entries) => {
      if (entries.length === 0) {
        // If the database is empty, seed it in the background (once, so a failing save can't loop)
        if (seededFromEmptyUpdate) return;
        seededFromEmptyUpdate = true;
        ensureDatabaseSeeded().then(() => {
          onUpdate(INITIAL_CALLINGS);
        });
        return;
      }
      onUpdate(entries.map(([id, data]) => ({ ...data, id } as Calling)));
    },
    (error) => {
      console.error('Callings live sync error:', error);
      if (onError) onError(error);
    }
  );
}

/**
  * Subscribe to real-time Proposals updates
  */
export function subscribeToProposals(
  onUpdate: (proposals: CallingProposal[]) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribe(
    'proposals',
    (entries) => {
      const loadedProposals: CallingProposal[] = entries.map(([id, data]) => {
        const raw = data as Partial<CallingProposal>;
        const history = Array.isArray(raw.statusHistory)
          ? raw.statusHistory.map((h, idx) => ({
              ...h,
              id: h.id || `h-${id}-${idx}-${h.date || 'entry'}`
            }))
          : [];

        return {
          ...raw,
          id,
          callingId: raw.callingId || '',
          callingTitle: raw.callingTitle || 'Calling',
          organization: raw.organization || 'Other Callings',
          subOrg: raw.subOrg || '',
          type: raw.type || 'fill_vacancy',
          currentMemberName: raw.currentMemberName || null,
          proposedMemberName: raw.proposedMemberName || '',
          candidates: raw.candidates || [],
          selectedCandidateId: raw.selectedCandidateId,
          proposedByName: raw.proposedByName || 'Leader',
          reasonNote: raw.reasonNote || '',
          dateProposed: raw.dateProposed || '2026-07-26',
          approvals: {
            bishop: { status: raw.approvals?.bishop?.status || 'pending', ...(raw.approvals?.bishop || {}) },
            first_counselor: { status: raw.approvals?.first_counselor?.status || 'pending', ...(raw.approvals?.first_counselor || {}) },
            second_counselor: { status: raw.approvals?.second_counselor?.status || 'pending', ...(raw.approvals?.second_counselor || {}) },
          },
          finalStatus: raw.finalStatus || 'pending_review',
          statusHistory: history,
        };
      });
      onUpdate(loadedProposals);
    },
    (error) => {
      console.error('Proposals live sync error:', error);
      if (onError) onError(error);
    }
  );
}

/**
  * Subscribe to real-time Council Message Board updates
  */
export function subscribeToCouncilMessages(
  onUpdate: (messages: CouncilMessage[]) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribe(
    'council_messages',
    (entries) => {
      const loadedMessages: CouncilMessage[] = entries.map(([id, data]) => {
        const raw = data as Partial<CouncilMessage>;
        return {
          id,
          proposalId: raw.proposalId || '',
          callingId: raw.callingId,
          callingTitle: raw.callingTitle || 'Calling',
          organization: raw.organization || '',
          authorName: raw.authorName || 'Leader',
          authorRole: raw.authorRole || 'Council Member',
          authorCalling: raw.authorCalling,
          authorId: raw.authorId,
          text: raw.text || '',
          createdAt: raw.createdAt || new Date().toISOString(),
          timestampFormatted: raw.timestampFormatted,
        };
      });

      // Sort by creation date ascending (oldest to newest)
      loadedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(loadedMessages);
    },
    (error) => {
      console.error('Council messages live sync error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save a new or edited Council Message
 */
export async function saveCouncilMessage(message: CouncilMessage): Promise<void> {
  try {
    await write([{ op: 'set', collection: 'council_messages', id: message.id, data: cleanDoc(message), merge: true }]);
  } catch (error) {
    console.error('Error saving council message:', error);
    throw error;
  }
}

/**
 * Delete a specific Council Message
 */
export async function deleteCouncilMessage(messageId: string): Promise<void> {
  try {
    await write([{ op: 'delete', collection: 'council_messages', id: messageId }]);
  } catch (error) {
    console.error('Error deleting council message:', error);
    throw error;
  }
}

/**
 * Clear all Council Messages for a given proposal
 */
export async function clearProposalCouncilMessages(proposalId: string): Promise<void> {
  try {
    const all = await fetchAll();
    await write(
      Object.entries(all.council_messages)
        .filter(([, data]) => data.proposalId === proposalId)
        .map(([id]): WriteOp => ({ op: 'delete', collection: 'council_messages', id }))
    );
  } catch (error) {
    console.error('Error clearing proposal messages:', error);
    throw error;
  }
}

/**
 * Save / Update a single Calling
 */
export async function saveCalling(calling: Calling): Promise<void> {
  try {
    await write([{ op: 'set', collection: 'callings', id: calling.id, data: cleanDoc(calling), merge: true }]);
  } catch (error) {
    console.error('Error saving calling:', error);
    throw error;
  }
}

/**
 * Save / Update multiple Callings together
 */
export async function saveCallingsBatch(callings: Calling[]): Promise<void> {
  try {
    await write(callings.map((calling): WriteOp => ({ op: 'set', collection: 'callings', id: calling.id, data: cleanDoc(calling), merge: true })));
  } catch (error) {
    console.error('Error saving callings batch:', error);
    throw error;
  }
}

/**
 * Delete a Calling
 */
export async function deleteCalling(callingId: string): Promise<void> {
  try {
    await write([{ op: 'delete', collection: 'callings', id: callingId }]);
  } catch (error) {
    console.error('Error deleting calling:', error);
    throw error;
  }
}

/**
 * Save / Update a Proposal
 */
export async function saveProposal(proposal: CallingProposal): Promise<void> {
  try {
    await write([{ op: 'set', collection: 'proposals', id: proposal.id, data: cleanDoc(proposal), merge: true }]);
  } catch (error) {
    console.error('Error saving proposal:', error);
    throw error;
  }
}

/**
 * Delete a Proposal
 */
export async function deleteProposal(proposalId: string): Promise<void> {
  try {
    await write([{ op: 'delete', collection: 'proposals', id: proposalId }]);
  } catch (error) {
    console.error('Error deleting proposal:', error);
    throw error;
  }
}

const CLEARED_HISTORY: Doc = {
  statusHistory: [],
  approvals: {
    bishop: { note: '' },
    first_counselor: { note: '' },
    second_counselor: { note: '' }
  }
};

/**
 * Clear action logs for all proposals
 */
export async function clearAllProposalsHistory(): Promise<void> {
  try {
    const all = await fetchAll();
    await write(
      Object.keys(all.proposals).map((id): WriteOp => ({ op: 'set', collection: 'proposals', id, data: CLEARED_HISTORY, merge: true }))
    );
    console.log('Successfully cleared discussion and action logs for all proposals.');
  } catch (error) {
    console.error('Error clearing all proposal logs:', error);
    throw error;
  }
}

/**
 * Clear action logs for a single proposal
 */
export async function clearProposalHistory(proposalId: string): Promise<void> {
  try {
    await write([{ op: 'set', collection: 'proposals', id: proposalId, data: CLEARED_HISTORY, merge: true }]);
  } catch (error) {
    console.error('Error clearing proposal history:', error);
    throw error;
  }
}

/**
 * Reset callings and proposals back to the INITIAL_CALLINGS default (council messages are kept)
 */
export async function resetToDefaults(): Promise<void> {
  try {
    const all = await fetchAll();
    await write([
      ...Object.keys(all.proposals).map((id): WriteOp => ({ op: 'delete', collection: 'proposals', id })),
      ...Object.keys(all.callings).map((id): WriteOp => ({ op: 'delete', collection: 'callings', id })),
      ...seedOps(),
    ]);
  } catch (error) {
    console.error('Error resetting to defaults:', error);
    throw error;
  }
}
