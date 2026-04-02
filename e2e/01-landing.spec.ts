import { test, expect } from '@playwright/test';

test.describe('랜딩 페이지', () => {
  test('비로그인 시 랜딩 페이지가 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=미션을 완료하고')).toBeVisible();
    await expect(page.locator('text=무료로 시작하기')).toBeVisible();
  });

  test('로그인 버튼이 /login으로 이동한다', async ({ page }) => {
    await page.goto('/');
    await page.click('text=로그인');
    await expect(page).toHaveURL(/\/login/);
  });

  test('무료로 시작하기 버튼이 /register로 이동한다', async ({ page }) => {
    await page.goto('/');
    await page.click('text=무료로 시작하기 >> nth=0');
    await expect(page).toHaveURL(/\/register/);
  });

  test('기능 소개 섹션이 3개 카드를 포함한다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=부모님이 미션을 만들어요')).toBeVisible();
    await expect(page.locator('text=아이가 사진으로 인증해요')).toBeVisible();
    await expect(page.locator('text=포인트를 모아 용돈으로 받아요')).toBeVisible();
  });

  test('레벨 시스템 섹션이 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=미션을 쌓을수록 레벨이 올라요')).toBeVisible();
  });
});
