// ============================================================
// PocketMission 공통 타입 정의 (Firebase Firestore 기반)
// ============================================================
import type { Timestamp } from 'firebase/firestore';

export type Role = 'parent' | 'child';
export type SubscriptionStatus = 'free' | 'premium';
export type MissionStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType = 'earned' | 'requested' | 'paid';
export type WithdrawalStatus = 'pending' | 'approved';

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string;
  pointRate: number;
  createdAt: Timestamp;
}

export interface Profile {
  id: string;
  familyId: string | null;
  role: Role;
  name: string;
  points: number;
  createdAt: Timestamp;
}

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  defaultPoints: number;
  category: string;
}

export interface Mission {
  id: string;
  familyId: string;
  createdBy: string;
  assignedTo: string | null;
  title: string;
  description: string;
  points: number;
  templateId?: string;
  status: MissionStatus;
  dueDate?: Timestamp;
  isRecurring: boolean;
  createdAt: Timestamp;
}

export interface MissionWithProfile extends Mission {
  assignedProfile?: Profile;
}

export interface MissionSubmission {
  id: string;
  missionId: string;
  childId: string;
  photoUrl: string;
  memo: string;
  status: SubmissionStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface SubmissionWithDetails extends MissionSubmission {
  mission?: Mission;
  childProfile?: Profile;
}

export interface PointTransaction {
  id: string;
  profileId: string;
  amount: number;
  type: TransactionType;
  missionId?: string;
  description: string;
  createdAt: Timestamp;
}

export interface WithdrawalRequest {
  id: string;
  childId: string;
  points: number;
  status: WithdrawalStatus;
  approvedBy?: string;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
}

// API 요청/응답 타입
export interface CreateFamilyRequest {
  name: string;
}

export interface CreateFamilyResponse {
  id: string;
  invite_code: string;
}

export interface JoinFamilyRequest {
  invite_code: string;
  name: string;
  role: Role;
}

export interface JoinFamilyResponse {
  family_id: string;
}

export interface CreateMissionRequest {
  title: string;
  description: string;
  points: number;
  due_date?: string;
  is_recurring: boolean;
  template_id?: string;
  assigned_to?: string;
}

export interface SubmitMissionRequest {
  photo_url: string;
  memo: string;
}

export interface ReviewSubmissionRequest {
  action: 'approve' | 'reject';
  reason?: string;
}

export interface ReviewSubmissionResponse {
  status: SubmissionStatus;
  points_awarded?: number;
}

export interface WalletResponse {
  balance: number;
  transactions: PointTransaction[];
}

export interface WithdrawRequest {
  points: number;
}

export interface ApiError {
  error: string;
}
