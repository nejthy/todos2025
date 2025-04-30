// @ts-check
import { test, expect } from '@playwright/test';

test('index page has title' , async ({page}) => {
  await page.goto("/")

  await expect(page.getByText('MY TODO APP')).toBeDefined()
})