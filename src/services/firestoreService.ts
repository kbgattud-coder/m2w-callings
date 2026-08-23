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
import { Calling, CallingProposal } from '../types';
import { INITIAL_CALLINGS, INITIAL_PROPOSALS } from '../data/initialData';

const CALLINGS_COLLECTION = 'callings';
const PROPOSALS_COLLECTION = 'proposals';
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
      // Sync released calling if previously seeded with old data
      const ss9DocRef = doc(db, CALLINGS_COLLECTION, 'ss-9');
      const ss9Snap = await getDoc(ss9DocRef);
      if (ss9Snap.exists() && ss9Snap.data()?.memberName === 'Bala, Antonette Triñanes Oneza') {
        const ss9Calling = INITIAL_CALLINGS.find(c => c.id === 'ss-9');
        if (ss9Calling) {
          await setDoc(ss9DocRef, cleanForFirestore(ss9Calling), { merge: true });
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
        loadedProposals.push({ ...docSnap.data(), id: docSnap.id } as CallingProposal);
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
