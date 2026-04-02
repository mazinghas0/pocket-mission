import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, serverTimestamp,
  onSnapshot, Timestamp, writeBatch, limit,
} from 'firebase/firestore';
import { db } from './client';
import type {
  Family, Profile, Mission, MissionSubmission, PointTransaction,
  WithdrawalRequest, MissionTemplate, SubmissionWithDetails,
  MissionDefinition, MissionAssignment, AssignmentSubmission, AssignmentWithDetails,
  Role, SubscriptionStatus,
} from '@/types';

// ── 컬렉션 참조 ──────────────────────────────────────────

export const familiesCol = () => collection(db, 'families');
export const usersCol = () => collection(db, 'users');
export const missionsCol = () => collection(db, 'missions');
export const templatesCol = () => collection(db, 'mission_templates');
export const transactionsCol = () => collection(db, 'transactions');
export const withdrawalsCol = () => collection(db, 'withdrawal_requests');
export const submissionsCol = (missionId: string) =>
  collection(db, 'missions', missionId, 'submissions');

// ── 신규 컬렉션 참조 (정의/배정 구조) ────────────────────
export const definitionsCol = () => collection(db, 'mission_definitions');
export const assignmentsCol = () => collection(db, 'mission_assignments');
export const assignmentSubmissionsCol = (assignmentId: string) =>
  collection(db, 'mission_assignments', assignmentId, 'submissions');

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

export async function saveFcmToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(usersCol(), uid), { fcmToken: token });
}

export async function getParentFcmTokens(familyId: string): Promise<string[]> {
  const q = query(usersCol(), where('familyId', '==', familyId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => d.data() as Profile)
    .filter(p => p.role === 'parent' && !!p.fcmToken)
    .map(p => p.fcmToken as string);
}

export async function getChildFcmToken(childId: string): Promise<string | null> {
  const snap = await getDoc(doc(usersCol(), childId));
  if (!snap.exists()) return null;
  return (snap.data() as Profile).fcmToken ?? null;
}

// ── 가족 ─────────────────────────────────────────────────

export async function createFamily(data: Omit<Family, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(familiesCol(), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateFamily(familyId: string, data: Partial<Family>): Promise<void> {
  await updateDoc(doc(familiesCol(), familyId), data);
}

export async function getFamily(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(familiesCol(), familyId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, pointRate: 1, ...data } as Family;
}

export async function getFamilyByInviteCode(code: string): Promise<Family | null> {
  const q = query(familiesCol(), where('inviteCode', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const family = { id: d.id, ...d.data() } as Family;
  if (family.inviteCodeExpiresAt && family.inviteCodeExpiresAt.toMillis() < Date.now()) {
    return null;
  }
  return family;
}

export function getInviteCodeExpiry(): Timestamp {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return Timestamp.fromDate(expiresAt);
}

export async function regenerateInviteCode(familyId: string): Promise<{ code: string; expiresAt: Timestamp }> {
  const { nanoid } = await import('nanoid');
  const code = nanoid(6).toUpperCase();
  const expiresAt = getInviteCodeExpiry();
  await updateFamily(familyId, { inviteCode: code, inviteCodeExpiresAt: expiresAt } as Partial<Family>);
  return { code, expiresAt };
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
  const childProfile = await getProfile(childId);
  if (!childProfile) throw new Error('사용자를 찾을 수 없습니다.');
  const batch = writeBatch(db);
  batch.update(doc(submissionsCol(missionId), submissionId), {
    status: 'approved', reviewedBy: reviewerId, reviewedAt: serverTimestamp(),
  });
  batch.update(doc(missionsCol(), missionId), { status: 'approved' });
  batch.update(doc(usersCol(), childId), { points: childProfile.points + points });
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

export function subscribeToPendingAssignmentCount(familyId: string, cb: (count: number) => void): () => void {
  const q = query(assignmentsCol(), where('familyId', '==', familyId), where('status', '==', 'submitted'));
  return onSnapshot(q,
    snap => cb(snap.size),
    err => { console.error('[subscribeToPendingAssignmentCount]', err); cb(0); },
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

// ══════════════════════════════════════════════════════════
// 신규: 미션 정의 + 배정 구조
// ══════════════════════════════════════════════════════════

// ── 미션 정의 ─────────────────────────────────────────────

export async function createMissionDefinitionWithAssignments(
  defData: Omit<MissionDefinition, 'id' | 'createdAt'>,
  childIds: string[],
): Promise<string> {
  const batch = writeBatch(db);
  const defRef = doc(definitionsCol());
  batch.set(defRef, { ...defData, createdAt: serverTimestamp() });

  for (const childId of childIds) {
    const assignRef = doc(assignmentsCol());
    batch.set(assignRef, {
      definitionId: defRef.id,
      familyId: defData.familyId,
      childId,
      title: defData.title,
      description: defData.description,
      points: defData.points,
      isRecurring: defData.isRecurring,
      ...(defData.frequency && { frequency: defData.frequency }),
      ...(defData.category && { category: defData.category }),
      ...(defData.color && { color: defData.color }),
      ...(defData.emoji && { emoji: defData.emoji }),
      ...(defData.templateId && { templateId: defData.templateId }),
      ...(defData.dueDate && { dueDate: defData.dueDate }),
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return defRef.id;
}

export function subscribeFamilyDefinitions(
  familyId: string,
  cb: (defs: MissionDefinition[]) => void,
) {
  const q = query(definitionsCol(), where('familyId', '==', familyId), orderBy('createdAt', 'desc'));
  return onSnapshot(q,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as MissionDefinition))),
    err => { console.error('[subscribeFamilyDefinitions]', err); cb([]); },
  );
}

export async function getDefinitionAssignments(definitionId: string, familyId: string): Promise<MissionAssignment[]> {
  const q = query(assignmentsCol(), where('definitionId', '==', definitionId), where('familyId', '==', familyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MissionAssignment));
}

export async function getFamilyDefinitions(familyId: string): Promise<MissionDefinition[]> {
  const q = query(definitionsCol(), where('familyId', '==', familyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MissionDefinition));
}

export async function createSingleAssignment(def: MissionDefinition, childId: string): Promise<void> {
  await addDoc(assignmentsCol(), {
    definitionId: def.id,
    familyId: def.familyId,
    childId,
    title: def.title,
    description: def.description,
    points: def.points,
    isRecurring: def.isRecurring,
    ...(def.frequency && { frequency: def.frequency }),
    ...(def.category && { category: def.category }),
    ...(def.color && { color: def.color }),
    ...(def.emoji && { emoji: def.emoji }),
    ...(def.templateId && { templateId: def.templateId }),
    ...(def.dueDate && { dueDate: def.dueDate }),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function getFamilyAssignments(familyId: string): Promise<MissionAssignment[]> {
  const q = query(assignmentsCol(), where('familyId', '==', familyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MissionAssignment));
}

export async function updateDefinition(
  defId: string,
  familyId: string,
  data: Partial<Pick<MissionDefinition, 'title' | 'description' | 'points' | 'dueDate' | 'isRecurring'>>,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(definitionsCol(), defId), data);

  const assignments = await getDefinitionAssignments(defId, familyId);
  for (const a of assignments) {
    if (a.status === 'pending') {
      batch.update(doc(assignmentsCol(), a.id), data);
    }
  }
  await batch.commit();
}

export async function deleteMissionDefinition(defId: string, familyId: string): Promise<void> {
  const assignments = await getDefinitionAssignments(defId, familyId);
  const batch = writeBatch(db);

  for (const a of assignments) {
    const subSnap = await getDocs(assignmentSubmissionsCol(a.id));
    subSnap.docs.forEach(s => batch.delete(s.ref));
    batch.delete(doc(assignmentsCol(), a.id));
  }
  batch.delete(doc(definitionsCol(), defId));
  await batch.commit();
}

// ── 미션 배정 ─────────────────────────────────────────────

export async function getAssignment(assignmentId: string): Promise<MissionAssignment | null> {
  const snap = await getDoc(doc(assignmentsCol(), assignmentId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as MissionAssignment) : null;
}

export function subscribeChildAssignments(
  childId: string,
  familyId: string,
  cb: (assignments: MissionAssignment[]) => void,
) {
  const q = query(
    assignmentsCol(),
    where('childId', '==', childId),
    where('familyId', '==', familyId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as MissionAssignment))),
    err => { console.error('[subscribeChildAssignments]', err); cb([]); },
  );
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: MissionAssignment['status'],
): Promise<void> {
  await updateDoc(doc(assignmentsCol(), assignmentId), { status });
}

// ── 배정 인증(제출) ───────────────────────────────────────

export async function createAssignmentSubmission(
  assignmentId: string,
  data: Omit<AssignmentSubmission, 'id' | 'createdAt'>,
): Promise<string> {
  const batch = writeBatch(db);
  const subRef = doc(assignmentSubmissionsCol(assignmentId));
  batch.set(subRef, { ...data, createdAt: serverTimestamp() });
  batch.update(doc(assignmentsCol(), assignmentId), { status: 'submitted' });
  await batch.commit();
  return subRef.id;
}

export async function approveAssignmentSubmission(
  assignmentId: string,
  submissionId: string,
  childId: string,
  points: number,
  reviewerId: string,
): Promise<void> {
  const childProfile = await getProfile(childId);
  const batch = writeBatch(db);
  batch.update(doc(assignmentSubmissionsCol(assignmentId), submissionId), {
    status: 'approved', reviewedBy: reviewerId, reviewedAt: serverTimestamp(),
  });
  batch.update(doc(assignmentsCol(), assignmentId), { status: 'approved' });
  batch.update(doc(usersCol(), childId), { points: (childProfile?.points ?? 0) + points });
  const txRef = doc(transactionsCol());
  batch.set(txRef, {
    profileId: childId, amount: points, type: 'earned',
    missionId: assignmentId, description: '미션 완료 포인트', createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function rejectAssignmentSubmission(
  assignmentId: string,
  submissionId: string,
  reviewerId: string,
  reason: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(assignmentSubmissionsCol(assignmentId), submissionId), {
    status: 'rejected', reviewedBy: reviewerId, reviewedAt: serverTimestamp(), rejectionReason: reason,
  });
  batch.update(doc(assignmentsCol(), assignmentId), { status: 'rejected' });
  await batch.commit();
}

export async function createAssignmentsForNewChild(
  familyId: string,
  childId: string,
): Promise<void> {
  const snap = await getDocs(query(definitionsCol(), where('familyId', '==', familyId)));
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((defDoc) => {
    const def = defDoc.data() as Omit<MissionDefinition, 'id'>;
    const assignRef = doc(assignmentsCol());
    batch.set(assignRef, {
      definitionId: defDoc.id,
      familyId,
      childId,
      title: def.title,
      description: def.description,
      points: def.points,
      isRecurring: def.isRecurring,
      ...(def.templateId && { templateId: def.templateId }),
      ...(def.dueDate && { dueDate: def.dueDate }),
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
  const snap = await getDocs(assignmentSubmissionsCol(assignmentId));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssignmentSubmission));
}

export async function getPendingFamilyAssignmentSubmissions(
  familyId: string,
): Promise<AssignmentWithDetails[]> {
  const q = query(
    assignmentsCol(),
    where('familyId', '==', familyId),
    where('status', '==', 'submitted'),
  );
  const snap = await getDocs(q);
  const submittedAssignments = snap.docs.map(d => ({ id: d.id, ...d.data() } as MissionAssignment));

  const result: AssignmentWithDetails[] = [];
  for (const assignment of submittedAssignments) {
    const subs = await getAssignmentSubmissions(assignment.id);
    for (const sub of subs) {
      if (sub.status !== 'pending') continue;
      const childProfile = await getProfile(sub.childId);
      result.push({ ...sub, assignment, childProfile: childProfile ?? undefined });
    }
  }
  return result;
}

// ── 어드민 전용 쿼리 ──────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  role: Role;
  familyId: string | null;
  points: number;
  fcmToken?: string;
  createdAt: Timestamp;
}

export interface AdminFamily {
  id: string;
  name: string;
  inviteCode: string;
  subscriptionStatus: SubscriptionStatus;
  memberCount: number;
  createdAt: Timestamp;
}

export async function getAdminUsers(count = 50): Promise<AdminUser[]> {
  const q = query(usersCol(), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser));
}

export async function getAdminFamilies(count = 50): Promise<AdminFamily[]> {
  const q = query(familiesCol(), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  const families = snap.docs.map(d => ({ id: d.id, ...d.data() } as Family));

  const results: AdminFamily[] = await Promise.all(
    families.map(async (f) => {
      const membersSnap = await getDocs(query(usersCol(), where('familyId', '==', f.id)));
      return {
        id: f.id,
        name: f.name,
        inviteCode: f.inviteCode,
        subscriptionStatus: f.subscriptionStatus,
        memberCount: membersSnap.size,
        createdAt: f.createdAt,
      };
    }),
  );
  return results;
}
