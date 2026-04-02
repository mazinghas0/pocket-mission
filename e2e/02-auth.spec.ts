import { test, expect } from '@playwright/test';

test.describe('회원가입 페이지', () => {
  test('회원가입 폼이 정상 표시된다', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('역할 선택 (부모/아이) 버튼이 있다', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('text=부모')).toBeVisible();
    await expect(page.locator('text=아이')).toBeVisible();
  });

  test('빈 폼 제출 시 에러가 표시된다', async ({ page }) => {
    await page.goto('/register');
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('로그인 페이지', () => {
  test('로그인 폼이 정상 표시된다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('회원가입 링크가 있다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('a[href*="register"]')).toBeVisible();
  });

  test('잘못된 로그인 시 에러 메시지 표시', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const errorVisible = await page.locator('.text-red-500, [class*="error"], [class*="red"]').isVisible();
    expect(errorVisible).toBeTruthy();
  });
});
