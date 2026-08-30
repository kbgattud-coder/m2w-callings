import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  getDoc,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Calling, CallingProposal, CouncilMessage } from '../types';
import { INITIAL_CALLINGS, INITIAL_PROPOSALS } from '../data/initialData';

const CALLINGS_COLLECTION = 'callings';
const PROPOSALS_COLLECTION = 'proposals';
const MESSAGES_COLLECTION = 'council_messages';
const METADATA_COLLECTION = 'system_meta';

// Helper to remove undefined fields which Firestore does not allow
function cleanForFirestore<T>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as any)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      clean[key] = value.map(item => typeof item === 'object' && item !== null ? cleanForFirestore(item) : item);
    } else if (value !== null && typeof value === 'object') {
      clean[key] = cleanForFirestore(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Check if the Firestore database has been seeded; if empty, seed INITIAL_CALLINGS in batches.
 */
export async function ensureDatabaseSeeded(): Promise<void> {
  try {
    const callingsSnap = await getDocs(collection(db, CALLINGS_COLLECTION));
    if (callingsSnap.empty) {
      console.log('Firestore is empty. Seeding initial Masagana 2nd Ward callings & proposals...');
      await seedInitialData();
    } else {
      // Sync released callings if previously seeded with old data
      const ss9DocRef = doc(db, CALLINGS_COLLECTION, 'ss-9');
      const ss9Snap = await getDoc(ss9DocRef);
      if (ss9Snap.exists() && ss9Snap.data()?.memberName === 'Bala, Antonette Triñanes Oneza') {
        const ss9Calling = INITIAL_CALLINGS.find(c => c.id === 'ss-9');
        if (ss9Calling) {
          await setDoc(ss9DocRef, cleanForFirestore(ss9Calling), { merge: true });
        }
      }

      const oth6DocRef = doc(db, CALLINGS_COLLECTION, 'oth-6');
      const oth6Snap = await getDoc(oth6DocRef);
      if (oth6Snap.exists() && oth6Snap.data()?.memberName === 'Reyes, Matfrancis Castillo') {
        const oth6Calling = INITIAL_CALLINGS.find(c => c.id === 'oth-6');
        if (oth6Calling) {
          await setDoc(oth6DocRef, cleanForFirestore(oth6Calling), { merge: true });
        }
      }
    }
  } catch (error) {
    console.error('Error checking or seeding Firestore database:', error);
  }
}

/**
 * Seed initial ward callings and proposals to Firestore in chunked batches (max 500 per batch).
 */
export async function seedInitialData(): Promise<void> {
  try {
    // 1. Seed Callings
    const chunkSize = 400;
    for (let i = 0; i < INITIAL_CALLINGS.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = INITIAL_CALLINGS.slice(i, i + chunkSize);
      for (const calling of chunk) {
        const callingRef = doc(db, CALLINGS_COLLECTION, calling.id);
        batch.set(callingRef, cleanForFirestore(calling));
      }
      await batch.commit();
    }

    // 2. Seed Proposals if any exist
    if (INITIAL_PROPOSALS.length > 0) {
      const proposalBatch = writeBatch(db);
      for (const proposal of INITIAL_PROPOSALS) {
        const propRef = doc(db, PROPOSALS_COLLECTION, proposal.id);
        proposalBatch.set(propRef, cleanForFirestore(proposal));
      }
      await proposalBatch.commit();
    }

    // 3. Mark seed complete in metadata
    const metaRef = doc(db, METADATA_COLLECTION, 'seed_info');
    await setDoc(metaRef, {
      seededAt: new Date().toISOString(),
      version: 'v3',
      initialCallingsCount: INITIAL_CALLINGS.length,
    });

    console.log('Successfully seeded Masagana 2nd Ward data to Firestore.');
  } catch (error) {
    console.error('Error seeding initial data to Firestore:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time Callings updates
 */
export function subscribeToCallings(
  onUpdate: (callings: Calling[]) => void,
  onError?: (error: Error) => void
): () => void {
  const callingsQuery = query(collection(db, CALLINGS_COLLECTION));
  
  return onSnapshot(
    callingsQuery,
    (snapshot) => {
      if (snapshot.empty) {
        // If snapshot is empty, trigger seed in background
        ensureDatabaseSeeded().then(() => {
          onUpdate(INITIAL_CALLINGS);
        });
        return;
      }
      const loadedCallings: Calling[] = [];
      snapshot.forEach((docSnap) => {
        loadedCallings.push({ ...docSnap.data(), id: docSnap.id } as Calling);
      });
      onUpdate(loadedCallings);
    },
    (error) => {
      console.error('Firestore Callings onSnapshot error:', error);
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
  const proposalsQuery = query(collection(db, PROPOSALS_COLLECTION));

  return onSnapshot(
    proposalsQuery,
    (snapshot) => {
      const loadedProposals: CallingProposal[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as Partial<CallingProposal>;
        const history = Array.isArray(raw.statusHistory)
          ? raw.statusHistory.map((h, idx) => ({
              ...h,
              id: h.id || `h-${docSnap.id}-${idx}-${h.date || 'entry'}`
            }))
          : [];

        const sanitized: CallingProposal = {
          ...raw,
          id: docSnap.id,
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
        loadedProposals.push(sanitized);
      });
      onUpdate(loadedProposals);
    },
    (error) => {
      console.error('Firestore Proposals onSnapshot error:', error);
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
  const messagesQuery = query(collection(db, MESSAGES_COLLECTION));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const loadedMessages: CouncilMessage[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as Partial<CouncilMessage>;
        loadedMessages.push({
          id: docSnap.id,
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
        });
      });

      // Sort by creation date ascending (oldest to newest)
      loadedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(loadedMessages);
    },
    (error) => {
      console.error('Firestore Council Messages onSnapshot error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save a new or edited Council Message to Firestore
 */
export async function saveCouncilMessageToFirestore(message: CouncilMessage): Promise<void> {
  try {
    const msgRef = doc(db, MESSAGES_COLLECTION, message.id);
    await setDoc(msgRef, cleanForFirestore(message), { merge: true });
  } catch (error) {
    console.error('Error saving council message to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a specific Council Message from Firestore
 */
export async function deleteCouncilMessageFromFirestore(messageId: string): Promise<void> {
  try {
    const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
    await deleteDoc(msgRef);
  } catch (error) {
    console.error('Error deleting council message from Firestore:', error);
    throw error;
  }
}

/**
 * Clear all Council Messages for a given proposal
 */
export async function clearProposalCouncilMessages(proposalId: string): Promise<void> {
  try {
    const messagesSnap = await getDocs(collection(db, MESSAGES_COLLECTION));
    const batch = writeBatch(db);
    let count = 0;
    messagesSnap.forEach((docSnap) => {
      const data = docSnap.data() as Partial<CouncilMessage>;
      if (data.proposalId === proposalId) {
        batch.delete(docSnap.ref);
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error('Error clearing proposal messages in Firestore:', error);
    throw error;
  }
}

/**
 * Save / Update a single Calling in Firestore
 */
export async function saveCallingToFirestore(calling: Calling): Promise<void> {
  try {
    const callingRef = doc(db, CALLINGS_COLLECTION, calling.id);
    await setDoc(callingRef, cleanForFirestore(calling), { merge: true });
  } catch (error) {
    console.error('Error saving calling to Firestore:', error);
    throw error;
  }
}

/**
 * Save / Update multiple Callings in batch in Firestore
 */
export async function saveCallingsBatchToFirestore(callings: Calling[]): Promise<void> {
  try {
    const chunkSize = 400;
    for (let i = 0; i < callings.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = callings.slice(i, i + chunkSize);
      for (const calling of chunk) {
        const callingRef = doc(db, CALLINGS_COLLECTION, calling.id);
        batch.set(callingRef, cleanForFirestore(calling), { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    console.error('Error saving callings batch to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a Calling from Firestore
 */
export async function deleteCallingFromFirestore(callingId: string): Promise<void> {
  try {
    const callingRef = doc(db, CALLINGS_COLLECTION, callingId);
    await deleteDoc(callingRef);
  } catch (error) {
    console.error('Error deleting calling from Firestore:', error);
    throw error;
  }
}

/**
 * Save / Update a Proposal in Firestore
 */
export async function saveProposalToFirestore(proposal: CallingProposal): Promise<void> {
  try {
    const proposalRef = doc(db, PROPOSALS_COLLECTION, proposal.id);
    await setDoc(proposalRef, cleanForFirestore(proposal), { merge: true });
  } catch (error) {
    console.error('Error saving proposal to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a Proposal from Firestore
 */
export async function deleteProposalFromFirestore(proposalId: string): Promise<void> {
  try {
    const proposalRef = doc(db, PROPOSALS_COLLECTION, proposalId);
    await deleteDoc(proposalRef);
  } catch (error) {
    console.error('Error deleting proposal from Firestore:', error);
    throw error;
  }
}

/**
 * Clear action logs for all proposals in Firestore
 */
export async function clearAllProposalsHistory(): Promise<void> {
  try {
    const proposalsSnap = await getDocs(collection(db, PROPOSALS_COLLECTION));
    if (proposalsSnap.empty) return;

    const chunkSize = 400;
    const docs = proposalsSnap.docs;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + chunkSize);
      for (const docSnap of chunk) {
        batch.update(docSnap.ref, {
          statusHistory: [],
          'approvals.bishop.note': '',
          'approvals.first_counselor.note': '',
          'approvals.second_counselor.note': '',
        });
      }
      await batch.commit();
    }
    console.log('Successfully cleared discussion and action logs for all proposals.');
  } catch (error) {
    console.error('Error clearing all proposal logs in Firestore:', error);
    throw error;
  }
}

/**
 * Clear action logs for a single proposal in Firestore
 */
export async function clearProposalHistory(proposalId: string): Promise<void> {
  try {
    const proposalRef = doc(db, PROPOSALS_COLLECTION, proposalId);
    await setDoc(proposalRef, {
      statusHistory: [],
      approvals: {
        bishop: { note: '' },
        first_counselor: { note: '' },
        second_counselor: { note: '' }
      }
    }, { merge: true });
  } catch (error) {
    console.error('Error clearing proposal history in Firestore:', error);
    throw error;
  }
}

/**
 * Reset entire cloud Firestore database back to INITIAL_CALLINGS default
 */
export async function resetFirestoreToDefaults(): Promise<void> {
  try {
    // 1. Delete all current proposals
    const proposalsSnap = await getDocs(collection(db, PROPOSALS_COLLECTION));
    const batch1 = writeBatch(db);
    proposalsSnap.forEach((docSnap) => {
      batch1.delete(docSnap.ref);
    });
    await batch1.commit();

    // 2. Delete all current callings
    const callingsSnap = await getDocs(collection(db, CALLINGS_COLLECTION));
    const deleteBatch = writeBatch(db);
    callingsSnap.forEach((docSnap) => {
      deleteBatch.delete(docSnap.ref);
    });
    await deleteBatch.commit();

    // 3. Re-seed default callings
    await seedInitialData();
  } catch (error) {
    console.error('Error resetting Firestore to defaults:', error);
    throw error;
  }
}
