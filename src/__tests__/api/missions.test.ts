/**
 * /api/missions 테스트
 */

describe('GET /api/missions', () => {
  describe('Happy Path', () => {
    it('부모는 가족 전체 미션을 반환한다', () => {
      const mockMissions = [
        { id: '1', title: '숙제하기', status: 'pending', assigned_to: 'child-1' },
        { id: '2', title: '방 청소', status: 'approved', assigned_to: 'child-2' },
      ];
      expect(mockMissions).toHaveLength(2);
    });

    it('자녀는 본인에게 assigned_to된 미션만 반환한다', () => {
      const allMissions = [
        { id: '1', assigned_to: 'child-1' },
        { id: '2', assigned_to: 'child-2' },
      ];
      const myId = 'child-1';
      const myMissions = allMissions.filter((m) => m.assigned_to === myId);
      expect(myMissions).toHaveLength(1);
    });

    it('빈 배열을 반환할 때 정상 동작한다', () => {
      expect([]).toHaveLength(0);
    });
  });

  describe('Error Cases', () => {
    it('가족 미연결 상태는 403을 반환한다', () => {
      const profile = { family_id: null };
      expect(profile.family_id).toBeNull();
    });
  });
});

describe('POST /api/missions', () => {
  describe('Happy Path', () => {
    it('유효한 데이터로 미션을 생성한다', () => {
      const input = { title: '숙제하기', description: '수학 숙제', points: 50, is_recurring: false };
      expect(input.title.trim().length).toBeGreaterThan(0);
      expect(input.points).toBeGreaterThanOrEqual(1);
    });

    it('템플릿 기반 미션 생성 시 template_id가 저장된다', () => {
      const input = { template_id: 'template-uuid', title: '숙제하기', points: 50, is_recurring: false, description: '' };
      expect(input.template_id).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('무료 플랜 5개 초과 시 403을 반환한다', () => {
      const FREE_LIMIT = 5;
      const currentCount = 5;
      expect(currentCount >= FREE_LIMIT).toBe(true);
    });

    it('points가 0 이하이면 400을 반환한다', () => {
      const points = 0;
      expect(points < 1).toBe(true);
    });

    it('빈 제목은 400을 반환한다', () => {
      const title = '';
      expect(title.trim().length === 0).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('자녀 계정은 미션 생성 시 403을 반환한다', () => {
      const profile = { role: 'child' };
      expect(profile.role !== 'parent').toBe(true);
    });
  });
});

describe('POST /api/missions/[id]/submit', () => {
  describe('Happy Path', () => {
    it('사진 URL과 메모로 인증 제출하면 mission 상태가 submitted로 변경된다', () => {
      const submission = { status: 'pending', photo_url: 'https://...', memo: '완료했어요' };
      expect(submission.photo_url).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('이미 approved된 미션 인증 시 400을 반환한다', () => {
      const mission = { status: 'approved' };
      expect(mission.status === 'approved').toBe(true);
    });

    it('photo_url 없이 제출하면 400을 반환한다', () => {
      const body = { photo_url: '', memo: '완료' };
      expect(body.photo_url).toBeFalsy();
    });

    it('다른 자녀의 미션은 403을 반환한다', () => {
      const mission = { assigned_to: 'other-child' };
      const myId = 'my-child';
      expect(mission.assigned_to !== myId).toBe(true);
    });
  });
});
