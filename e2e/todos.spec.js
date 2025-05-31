import { test, expect } from "@playwright/test"
import { migrate } from "drizzle-orm/libsql/migrator";

test.before("run migrations", async () => {
  console.log("Spouštím migrace...")
  await migrate(db, { migrationsFolder: "drizzle" })
  console.log("Migrace dokončeny!")
})

test("index page has title", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByText("RECIPES")).toBeDefined()
})

test("form on index page creates new todos", async ({
  page,
}) => {
  await page.getByRole('textbox').fill("E2E todo")
  await page.getByText("Přidat todo").click()
  await expect(page.getByText("E2E todo")).toBeVisible()
})


test("check text edit ", async ({ page }) => {
  await page.getByText("E2E todo").click()
  await expect(page.getByText("Upravit todočko")).toBeVisible()
})

test("Change title on recipe", async ({ page }) => {
  await page.getByText("E2E todo").click()
  await page.getByRole('textbox', { name: 'Titulek' }).fill("Koupit psa")
  await page.getByText("Uložit").click()

})

test("Change ingredients", async ({ page }) => {
  await page.getByText("Koupit psa").click()
  const select = page.getByLabel(/Priorita/i)
  await expect(select).toBeVisible()
  await select.selectOption({ label: "Low" })
  await page.getByText("Uložit").click()
  await expect(page.getByText("Priorita: low")).toBeVisible()

})


test("Give like", async ({ page }) => {
  await page.getByText("Koupit psa").click()
  await page.getByText("Nedokončeno").click()
  await expect(page.getByText("Dokončeno")).toBeVisible()
})

test("Delete recipe", async ({ page }) => {
  await page.getByText("Koupit psa").click()
  await page.getByText("odebrat").click()
  await page.goto("/")
  await expect(page.getByText("MY TODO APP")).toBeVisible()
  await expect(page.getByText("Koupit psa")).not.toBeVisible()
})




