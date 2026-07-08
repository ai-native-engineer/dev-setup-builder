import { expect, test } from "@playwright/test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const screenshotDir = join("test-results", "screenshots");

test.beforeAll(() => {
  rmSync(screenshotDir, { recursive: true, force: true });
  mkdirSync(screenshotDir, { recursive: true });
});

test("builds scripts and captures primary states", async ({ page }) => {
  await page.goto("./");

  const toolList = page.getByLabel("설치할 도구");

  await expect(page.getByRole("heading", { name: "개발 환경 설치 도우미" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "macOS" })).toHaveAttribute("aria-checked", "true");
  await expect(toolList.getByRole("checkbox", { name: /Windows WSL2/ })).toHaveCount(0);
  await expect(toolList.getByRole("checkbox")).toHaveCount(19);
  await expect(toolList.getByRole("checkbox", { name: /Bun/ })).toBeChecked();
  await expect(toolList.getByRole("checkbox", { name: /Git 사용자 정보 기본값/ })).toBeChecked();
  await expect(page.getByRole("textbox", { name: "수집 서버 주소" })).toHaveValue("http://localhost:4317");
  const promptBodyToggles = page.getByRole("checkbox", { name: "프롬프트 본문 수집" });
  await expect(promptBodyToggles).toHaveCount(2);
  await expect(promptBodyToggles.first()).not.toBeChecked();
  await expect(promptBodyToggles.last()).not.toBeChecked();
  await expect(page.getByRole("textbox", { name: "생성된 설치 스크립트" })).toHaveValue(/#!\/bin\/bash/);
  await page.screenshot({ path: join(screenshotDir, "mac-home.png"), fullPage: true });

  await page.getByRole("button", { name: /기본 도구/ }).click();
  await expect(page.getByRole("button", { name: /기본 도구/ })).toHaveAttribute("aria-expanded", "false");
  await expect(toolList.getByRole("checkbox", { name: /Bun/ })).toHaveCount(0);
  await page.screenshot({ path: join(screenshotDir, "category-collapsed.png"), fullPage: true });

  await page.getByRole("button", { name: /기본 도구/ }).click();
  await expect(page.getByRole("button", { name: /기본 도구/ })).toHaveAttribute("aria-expanded", "true");
  await expect(toolList.getByRole("checkbox", { name: /Bun/ })).toBeChecked();

  await page.getByRole("button", { name: "터미널에서 바로 실행 명령어 복사" }).click();
  await expect(page.getByRole("button", { name: /터미널에서 바로 실행 명령어 복사/ })).toContainText("복사됨");
  await expect(page.getByText("명령어 복사 완료")).toHaveCount(0);

  await page.getByRole("button", { name: "복사", exact: true }).click();
  await expect(page.getByRole("button", { name: "복사됨", exact: true })).toBeVisible();
  await expect(page.getByText("복사 완료")).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "copy-state.png"), fullPage: true });

  await page.getByRole("radio", { name: "Windows" }).click();
  await expect(toolList.getByRole("checkbox", { name: /Windows WSL2/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "생성된 설치 스크립트" })).toHaveValue(/Install-WSL2/);
  await page.screenshot({ path: join(screenshotDir, "windows-home.png"), fullPage: true });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "다운로드" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("setup-windows.bat");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "개발 환경 설치 도우미" })).toBeVisible();
  await page.screenshot({ path: join(screenshotDir, "mobile-mac.png"), fullPage: true });
});
