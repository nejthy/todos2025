import { test, expect } from "@playwright/test"

// Uložíme si storageState (pro session login) do souboru
test('user can register and see "Oblíbené recepty"', async ({ page }) => {
  await page.goto('/')
  await page.getByText("Registrovat se").click()
  await page.getByRole('textbox', { name: 'Jméno' }).fill("Adik")
  await page.getByRole('textbox', { name: 'Heslo', exact: true }).fill("Adik")
  await page.getByRole('textbox', { name: 'Potvrdit heslo', exact: true }).fill("Adik")
  await page.getByText("Registrovat se").click()

  // Ověříme, že je přihlášený uživatel a má vidět "Oblíbené recepty"
  await expect(page.getByText("Oblíbené recepty")).toBeVisible()

})


test('user login and can create a new recipe', async ({ page }) => {
  await page.goto('/')

  await page.getByText("Přihlásit se").click()
  await page.getByRole('textbox', { name: 'Jméno' }).fill("Adik")
  await page.getByRole('textbox', { name: 'Heslo', exact: true }).fill("Adik")
  await page.getByText("Přihlásit se").click()

  await page.getByText("Přidat recept").click()
  await page.getByRole('textbox', { name: 'Název receptu' }).fill("Můj testovací recept")
  await page.getByRole('textbox', { name: 'Napiš ingredienci' }).fill("1. ingredience, 2. ingredience")
  await page.getByLabel('Kategorie').selectOption('Snídaně')
  await page.getByRole('textbox', { name: 'Postup' }).fill("1. krok, 2. krok")
  await page.getByText("Uložit").click()


})

test('user can edit recipe', async ({ page }) => {
  await page.goto('/')
  await page.getByText("Přihlásit se").click()
  await page.getByRole('textbox', { name: 'Jméno' }).fill("Adik")
  await page.getByRole('textbox', { name: 'Heslo', exact: true }).fill("Adik")
  await page.getByText("Přihlásit se").click()

  // Klikneme na recept
  await page.getByText("Můj testovací recept").click()
  await page.getByRole('button', { name: 'Upravit recept' }).click()
  await page.getByRole('textbox', { name: 'Název receptu' }).fill("Můj upravený recept")
  await page.getByText("Uložit").click()

  // Ověříme, že se změnil
  await expect(page.getByText("Můj upravený recept")).toBeVisible()
})


