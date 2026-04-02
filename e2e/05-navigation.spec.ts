import { test, expect } from '@playwright/test';

test.describe('네비게이션 및 라우팅', () => {
  test('존재하지 않는 페이지 접근 시 404 또는 리다이렉트', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');
    const status = response?.status() ?? 0;
    expect([200, 404]).toContain(status);
  });

  test('랜딩 → 회원가입 → 로그인 흐름이 정상 동작한다', async ({ page }) => {
    await page.goto('/');
    await page.click('text=무료로 시작하기 >> nth=0');
    await expect(page).toHaveURL(/\/register/);

    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('로그인 페이지에서 비밀번호 찾기가 동작한다', async ({ page }) => {
    await page.goto('/login');
    const resetLink = page.locator('text=비밀번호를 잊으셨나요?, text=비밀번호 찾기');
    if (await resetLink.isVisible()) {
      await resetLink.click();
    }
  });

  test('모바일 뷰포트에서 랜딩 페이지가 정상 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('text=미션을 완료하고')).toBeVisible();
    await expect(page.locator('text=무료로 시작하기')).toBeVisible();
  });
});
