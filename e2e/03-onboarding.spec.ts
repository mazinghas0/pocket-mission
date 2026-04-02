import { test, expect } from '@playwright/test';

test.describe('온보딩 페이지', () => {
  test('가족 설정 선택지가 표시된다', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('text=가족 설정')).toBeVisible();
    await expect(page.locator('text=새 가족 만들기')).toBeVisible();
    await expect(page.locator('text=초대코드로 참여')).toBeVisible();
  });

  test('새 가족 만들기 클릭 시 폼이 표시된다', async ({ page }) => {
    await page.goto('/onboarding');
    await page.click('text=새 가족 만들기');
    await expect(page.locator('input[placeholder*="가족"]')).toBeVisible();
    await expect(page.locator('text=가족 만들기')).toBeVisible();
  });

  test('초대코드 참여 클릭 시 입력 폼이 표시된다', async ({ page }) => {
    await page.goto('/onboarding');
    await page.click('text=초대코드로 참여');
    await expect(page.locator('input[placeholder*="ABC"]')).toBeVisible();
    await expect(page.locator('text=가족 참여')).toBeVisible();
  });

  test('돌아가기 버튼이 선택 화면으로 복귀한다', async ({ page }) => {
    await page.goto('/onboarding');
    await page.click('text=새 가족 만들기');
    await page.click('text=돌아가기');
    await expect(page.locator('text=가족 설정')).toBeVisible();
  });

  test('로그아웃 버튼이 있다', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('text=로그아웃')).toBeVisible();
  });
});
