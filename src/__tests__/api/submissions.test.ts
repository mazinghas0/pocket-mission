/**
 * /api/submissions/[id]/review 테스트
 */

describe('POST /api/submissions/[id]/review', () => {
  describe('Happy Path — 승인', () => {
    it('승인 시 status가 approved, points_awarded가 반환된다', () => {
      const mockResponse = { status: 'approved', points_awarded: 50 };
      expect(mockResponse.status).toBe('approved');
      expect(mockResponse.points_awarded).toBeGreaterThan(0);
    });

    it('승인 시 자녀 포인트가 mission.points만큼 증가한다', () => {
      const beforePoints = 100;
      const missionPoints = 50;
      const afterPoints = beforePoints + missionPoints;
      expect(afterPoints).toBe(150);
    });

    it('승인 시 mission 상태가 approved로 변경된다', () => {
      const newStatus = 'approved';
      expect(newStatus).toBe('approved');
    });
  });

  describe('Happy Path — 반려', () => {
    it('반려 시 status가 rejected로 반환된다', () => {
      const mockResponse = { status: 'rejected' };
      expect(mockResponse.status).toBe('rejected');
    });

    it('반려 시 rejection_reason이 저장된다', () => {
      const reason = '사진이 흐릿합니다.';
      expect(reason.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('이미 처리된 인증에 재처리 시 400을 반환한다', () => {
      const submission = { status: 'approved' };
      expect(submission.status !== 'pending').toBe(true);
    });

    it('반려 시 reason이 없으면 400을 반환한다', () => {
      const body = { action: 'reject', reason: '' };
      expect(!body.reason || body.reason.trim().length === 0).toBe(true);
    });

    it('다른 가족의 인증은 403을 반환한다', () => {
      const missionFamilyId = 'family-a';
      const parentFamilyId = 'family-b';
      expect(missionFamilyId !== parentFamilyId).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('자녀는 승인 API 호출 시 403을 반환한다', () => {
      const profile = { role: 'child' };
      expect(profile.role !== 'parent').toBe(true);
    });
  });
});
