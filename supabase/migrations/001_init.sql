-- ============================================================
-- PocketMission 초기 스키마 마이그레이션
-- ============================================================

-- 1. families 테이블
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. profiles 테이블
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. mission_templates 테이블
CREATE TABLE IF NOT EXISTS mission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  default_points INTEGER NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. missions 테이블
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL,
  template_id UUID REFERENCES mission_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected')),
  due_date TIMESTAMPTZ,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. mission_submissions 테이블
CREATE TABLE IF NOT EXISTS mission_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. point_transactions 테이블
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'requested', 'paid')),
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. withdrawal_requests 테이블
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_missions_family_id ON missions(family_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_assigned_to ON missions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_status ON mission_submissions(status);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_mission_id ON mission_submissions(mission_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_profile_id ON point_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_child_id ON withdrawal_requests(child_id);

-- ============================================================
-- RLS 활성화
-- ============================================================
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS 정책
-- ============================================================

-- profiles: 본인 또는 같은 가족만 조회 가능
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR family_id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- families: 같은 가족만 조회
CREATE POLICY "families_select" ON families
  FOR SELECT USING (
    id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "families_insert" ON families
  FOR INSERT WITH CHECK (true);

CREATE POLICY "families_update" ON families
  FOR UPDATE USING (
    id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

-- missions: 같은 가족만 접근
CREATE POLICY "missions_select" ON missions
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "missions_insert" ON missions
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "missions_update" ON missions
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- mission_templates: 모두 읽기 가능 (공용 템플릿)
CREATE POLICY "mission_templates_select" ON mission_templates
  FOR SELECT USING (true);

-- mission_submissions: 같은 가족만 접근
CREATE POLICY "submissions_select" ON mission_submissions
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM profiles WHERE family_id IN (
        SELECT family_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "submissions_insert" ON mission_submissions
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'child'
    )
  );

CREATE POLICY "submissions_update" ON mission_submissions
  FOR UPDATE USING (
    child_id IN (
      SELECT id FROM profiles WHERE family_id IN (
        SELECT family_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- point_transactions: 본인 또는 같은 가족 부모
CREATE POLICY "transactions_select" ON point_transactions
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles WHERE family_id IN (
        SELECT family_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "transactions_insert" ON point_transactions
  FOR INSERT WITH CHECK (true);

-- withdrawal_requests: 같은 가족
CREATE POLICY "withdrawals_select" ON withdrawal_requests
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM profiles WHERE family_id IN (
        SELECT family_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "withdrawals_insert" ON withdrawal_requests
  FOR INSERT WITH CHECK (
    child_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'child'
    )
  );

CREATE POLICY "withdrawals_update" ON withdrawal_requests
  FOR UPDATE USING (
    child_id IN (
      SELECT id FROM profiles WHERE family_id IN (
        SELECT family_id FROM profiles WHERE user_id = auth.uid() AND role = 'parent'
      )
    )
  );

-- ============================================================
-- 시드 데이터: mission_templates (10개)
-- ============================================================
INSERT INTO mission_templates (title, description, default_points, category) VALUES
  ('숙제하기', '오늘 학교 숙제를 모두 완료해요', 50, '학습'),
  ('방 청소', '내 방을 깨끗하게 정리정돈해요', 30, '청소'),
  ('운동 30분', '줄넘기, 자전거, 달리기 등 운동을 30분 해요', 40, '건강'),
  ('설거지', '사용한 그릇을 깨끗하게 씻어요', 20, '청소'),
  ('책 읽기', '책을 30분 이상 읽어요', 35, '학습'),
  ('일기 쓰기', '오늘 하루를 일기로 기록해요', 25, '학습'),
  ('분리수거', '재활용품을 분리수거해요', 20, '청소'),
  ('화분 물주기', '집에 있는 식물에 물을 줘요', 15, '돌봄'),
  ('저녁 준비 돕기', '부모님의 저녁 준비를 도와요', 45, '돌봄'),
  ('세탁물 개기', '깨끗이 세탁된 옷을 개서 정리해요', 25, '청소')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RPC 함수: 포인트 원자적 증가 (레이스 컨디션 방지)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_points(profile_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET points = points + amount
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Storage 버킷 (Supabase Dashboard에서 직접 생성 필요)
-- 버킷명: mission-photos, public: false
-- ============================================================
-- NOTE: Storage 버킷은 SQL로 생성 불가, Dashboard > Storage에서 직접 생성
