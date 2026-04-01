import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, serverTimestamp,
  onSnapshot, Timestamp, writeBatch,
} from 'firebase/firestore';
import { db } from './client';
import type { Family, Profile, Mission, MissionSubmission, PointTransaction, WithdrawalRequest, MissionTemplate, SubmissionWithDetails } from '@/types';

// ── 컬렉션 참조 ──────────────────────────────────────────

export const familiesCol = () => collection(db, 'families');
export const usersCol = () => collection(db, 'users');
export const missionsCol = () => collection(db, 'missions');
export const templatesCol = () => collection(db, 'mission_templates');
export const transactionsCol = () => collection(db, 'transactions');
export const withdrawalsCol = () => collection(db, 'withdrawal_requests');
export const submissionsCol = (missionId: string) =>
  collection(db, 'missions', missionId, 'submissions');

// ── 사용자 프로필 ─────────────────────────────────────────

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(usersCol(), uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Profile) : null;
}

export async function createProfile(uid: string, data: Omit<Profile, 'id' | 'createdAt'>): Promise<void> {
  await setDoc(doc(usersCol(), uid), { ...data, points: 0, createdAt: serverTimestamp() });
}

export async function updateProfile(uid: string, data: Partial<Profile>): Promise<void> {
  await updateDoc(doc(usersCol(), uid), data);
}

// ── 가족 ─────────────────────────────────────────────────

export async function createFamily(data: Omit<Family, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(familiesCol(), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getFamily(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(familiesCol(), familyId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Family) : null;
}

export async function getFamilyByInviteCode(code: string): Promise<Family | null> {
  const q = query(familiesCol(), where('inviteCode', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Family;
}

export async function getFamilyMembers(familyId: string): Promise<Profile[]> {
  const q = query(usersCol(), where('familyId', '==', familyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Profile));
}

// ── 미션 ─────────────────────────────────────────────────

export async function createMission(data: Omit<Mission, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(missionsCol(), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getFamilyMissions(familyId: string): Promise<Mission[]> {
  const q = query(missionsCol(), where('familyId', '==', familyId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Mission));
}

export async function getMission(missionId: string): Promise<Mission | null> {
  const snap = await getDoc(doc(missionsCol(), missionId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Mission) : null;
}

export async function updateMissionStatus(missionId: string, status: Mission['status']): Promise<void> {
  await updateDoc(doc(missionsCol(), missionId), { status });
}

export async function updateMission(missionId: string, data: Partial<Pick<Mission, 'title' | 'description' | 'points' | 'dueDate' | 'isRecurring'>>): Promise<void> {
  await updateDoc(doc(missionsCol(), missionId), data);
}

export async function deleteMission(missionId: string): Promise<void> {
  await deleteDoc(doc(missionsCol(), missionId));
}

export function subscribeToFamilyMissions(familyId: string, cb: (missions: Mission[]) => void) {
  const q = query(missionsCol(), where('familyId', '==', familyId), orderBy('createdAt', 'desc'));
  return onSnapshot(q,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mission))),
    err => { console.error('[subscribeToFamilyMissions]', err); cb([]); },
  );
}

// ── 미션 제출(인증) ───────────────────────────────────────

export async function createSubmission(
  missionId: string,
  data: Omit<MissionSubmission, 'id' | 'createdAt'>
): Promise<string> {
  const batch = writeBatch(db);
  const subRef = doc(submissionsCol(missionId));
  batch.set(subRef, { ...data, createdAt: serverTimestamp() });
  batch.update(doc(missionsCol(), missionId), { status: 'submitted' });
  await batch.commit();
  return subRef.id;
}

export async function getMissionSubmissions(missionId: string): Promise<MissionSubmission[]> {
  const snap = await getDocs(submissionsCol(missionId));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MissionSubmission));
}

export async function approveSubmission(
  missionId: string,
  submissionId: string,
  childId: string,
  points: number,
  reviewerId: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(submissionsCol(missionId), submissionId), {
    status: 'approved', reviewedBy: reviewerId, reviewedAt: serverTimestamp(),
  });
  batch.update(doc(missionsCol(), missionId), { status: 'approved' });
  batch.update(doc(usersCol(), childId), { points: (await getProfile(childId))!.points + points });
  const txRef = doc(transactionsCol());
  batch.set(txRef, {
    profileId: childId, amount: points, type: 'earned',
    missionId, description: '미션 완료 포인트', createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function rejectSubmission(
  missionId: string,
  submissionId: string,
  reviewerId: string,
  reason: string
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(submissionsCol(missionId), submissionId), {
    status: 'rejected', reviewedBy: reviewerId, reviewedAt: serverTimestamp(), rejectionReason: reason,
  });
  batch.update(doc(missionsCol(), missionId), { status: 'rejected' });
  await batch.commit();
}

export function subscribeToPendingSubmissions(familyId: string, cb: (missions: Mission[]) => void) {
  const q = query(missionsCol(), where('familyId', '==', familyId), where('status', '==', 'submitted'));
  return onSnapshot(q,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mission))),
    err => { console.error('[subscribeToPendingSubmissions]', err); cb([]); },
  );
}

// ── 출금 요청 ─────────────────────────────────────────────

export async function createWithdrawalRequest(childId: string, points: number): Promise<void> {
  await addDoc(withdrawalsCol(), {
    childId, points, status: 'pending', createdAt: serverTimestamp(),
  });
}

export async function getFamilyWithdrawals(familyId: string): Promise<WithdrawalRequest[]> {
  const members = await getFamilyMembers(familyId);
  const childIds = members.filter(m => m.role === 'child').map(m => m.id);
  if (childIds.length === 0) return [];
  const q = query(withdrawalsCol(), where('childId', 'in', childIds), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest));
}

export async function approveWithdrawal(
  withdrawalId: string,
  childId: string,
  points: number,
  approverId: string
): Promise<void> {
  const profile = await getProfile(childId);
  if (!profile) throw new Error('사용자를 찾을 수 없습니다.');
  const batch = writeBatch(db);
  batch.update(doc(withdrawalsCol(), withdrawalId), {
    status: 'approved', approvedBy: approverId, approvedAt: serverTimestamp(),
  });
  batch.update(doc(usersCol(), childId), { points: Math.max(0, profile.points - points) });
  const txRef = doc(transactionsCol());
  batch.set(txRef, {
    profileId: childId, amount: -points, type: 'paid',
    description: '용돈 출금', createdAt: serverTimestamp(),
  });
  await batch.commit();
}

// ── 포인트 거래 내역 ──────────────────────────────────────

export async function getTransactions(profileId: string): Promise<PointTransaction[]> {
  const q = query(transactionsCol(), where('profileId', '==', profileId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PointTransaction));
}

// ── 가족 전체 pending submissions 조회 ────────────────────

export async function getPendingFamilySubmissions(familyId: string): Promise<SubmissionWithDetails[]> {
  const submittedMissions = await getFamilyMissions(familyId);
  const pending = submittedMissions.filter(m => m.status === 'submitted');

  const result: SubmissionWithDetails[] = [];
  for (const mission of pending) {
    const subs = await getMissionSubmissions(mission.id);
    for (const sub of subs) {
      if (sub.status !== 'pending') continue;
      const childProfile = await getProfile(sub.childId);
      result.push({ ...sub, mission, childProfile: childProfile ?? undefined });
    }
  }
  return result;
}

// ── 미션 템플릿 ───────────────────────────────────────────

export async function getMissionTemplates(): Promise<MissionTemplate[]> {
  const snap = await getDocs(templatesCol());
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MissionTemplate));
}
