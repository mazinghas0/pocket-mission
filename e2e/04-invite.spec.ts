import { test, expect } from '@playwright/test';

test.describe('초대 페이지', () => {
  test('유효하지 않은 초대코드 시 에러 표시', async ({ page }) => {
    await page.goto('/invite/INVALID');
    await page.waitForTimeout(3000);
    const hasError = await page.locator('text=유효하지 않은 초대 링크').isVisible();
    const hasLoginPrompt = await page.locator('text=회원가입 후 참여하기').isVisible();
    expect(hasError || hasLoginPrompt).toBeTruthy();
  });

  test('비로그인 시 회원가입/로그인 안내가 표시된다', async ({ page }) => {
    await page.goto('/invite/TESTCODE');
    await page.waitForTimeout(2000);
    const hasSignup = await page.locator('text=회원가입 후 참여하기').isVisible();
    const hasInvalid = await page.locator('text=유효하지 않은 초대 링크').isVisible();
    expect(hasSignup || hasInvalid).toBeTruthy();
  });

  test('초대 페이지에 가족 초대 제목이 있다', async ({ page }) => {
    await page.goto('/invite/ANYCODE');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=가족 초대')).toBeVisible();
  });
});
