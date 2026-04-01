// ============================================================
// PocketMission 공통 타입 정의
// ============================================================

export type Role = 'parent' | 'child';
export type SubscriptionStatus = 'free' | 'premium';
export type MissionStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType = 'earned' | 'requested' | 'paid';
export type WithdrawalStatus = 'pending' | 'approved';

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  family_id: string | null;
  role: Role;
  name: string;
  points: number;
  created_at: string;
}

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  default_points: number;
  category: string;
  created_at: string;
}

export interface Mission {
  id: string;
  family_id: string;
  created_by: string;
  assigned_to: string | null;
  title: string;
  description: string;
  points: number;
  template_id: string | null;
  status: MissionStatus;
  due_date: string | null;
  is_recurring: boolean;
  created_at: string;
}

export interface MissionWithProfile extends Mission {
  assigned_profile?: Profile;
}

export interface MissionSubmission {
  id: string;
  mission_id: string;
  child_id: string;
  photo_url: string;
  memo: string;
  status: SubmissionStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SubmissionWithDetails extends MissionSubmission {
  mission?: Mission;
  child_profile?: Profile;
}

export interface PointTransaction {
  id: string;
  profile_id: string;
  amount: number;
  type: TransactionType;
  mission_id: string | null;
  description: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  child_id: string;
  points: number;
  status: WithdrawalStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
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
