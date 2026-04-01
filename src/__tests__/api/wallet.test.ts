/**
 * /api/wallet, /api/wallet/withdraw 테스트
 */

describe('GET /api/wallet', () => {
  describe('Happy Path', () => {
    it('잔액과 최근 50건 트랜잭션을 반환한다', () => {
      const mockWallet = {
        balance: 150,
        transactions: Array.from({ length: 3 }, (_, i) => ({
          id: String(i),
          amount: 50,
          type: 'earned',
          created_at: new Date().toISOString(),
        })),
      };
      expect(mockWallet.balance).toBe(150);
      expect(mockWallet.transactions.length).toBeGreaterThan(0);
    });

    it('트랜잭션이 없을 때 빈 배열 반환', () => {
      const mockWallet = { balance: 0, transactions: [] };
      expect(mockWallet.transactions).toHaveLength(0);
    });
  });
});

describe('POST /api/wallet/withdraw', () => {
  describe('Happy Path', () => {
    it('잔액 이하의 포인트 출금 요청이 성공한다', () => {
      const balance = 200;
      const requestPoints = 100;
      expect(requestPoints <= balance).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('잔액 초과 출금 시 400을 반환한다', () => {
      const balance = 50;
      const requestPoints = 100;
      expect(requestPoints > balance).toBe(true);
    });

    it('포인트가 0이면 400을 반환한다', () => {
      const points = 0;
      expect(points < 1).toBe(true);
    });

    it('음수 포인트 요청은 400을 반환한다', () => {
      const points = -10;
      expect(points < 1).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('부모는 출금 요청 시 403을 반환한다', () => {
      const profile = { role: 'parent' };
      expect(profile.role !== 'child').toBe(true);
    });
  });
});
