import test from "ava"
import { testClient } from "hono/testing"
import { app } from "../src/app.js"
import { db, createRecipe, createUser } from "../src/db.js"
import {
  recipesTable,
  usersTable,
} from "../src/schema.js"
import { filterRecipes } from "../src/filter.js"


const client = testClient(app)



test.beforeEach(async () => {
  await db.delete(recipesTable).run()
  await db.delete(usersTable).run()
})

test.serial("filterRecipes bez filtrů vrací všechno", t => {
  const input = [
    { category: "Snídaně", ingredients: "vejce, mouka" },
    { category: "Dezert",    ingredients: "čokoláda, cukr" },
  ]
  const { recipes } = filterRecipes(input, {})
  t.is(recipes.length, 2)
})

test.serial("filterRecipes podle kategorie", t => {
  const input = [
    { category: "Snídaně", ingredients: "vejce" },
    { category: "Dezert",    ingredients: "cukr" },
  ]
  const { recipes } = filterRecipes(input, { category: ["Dezert"] })
  t.is(recipes.length, 1)
  t.is(recipes[0].category, "Dezert")
})

test.serial("filterRecipes podle ingredience", t => {
  const input = [
    { category: "Snídaně", ingredients: "vejce, mouka" },
    { category: "Dezert",    ingredients: "čokoláda, cukr" },
  ]
  const { recipes } = filterRecipes(input, { ingredients: ["cukr","mouka"] })
  t.is(recipes.length, 2)
})

async function signupAndGetToken(t) {
  const user = await createUser("testuser", "password123")
  return user.token
}

test.serial("GET / vrací titulní stránku s nadpisem RECEPTY", async t => {
  const res = await client["/"].$get()
  t.is(res.status, 200)
  const html = await res.text()
  t.true(html.includes("<h1>RECEPTY</h1>"))
})

test.serial("GET /recipes/new přesměruje, pokud nejsem přihlášený", async t => {
  const res = await client["/recipes/new"].$get()
  t.is(res.status, 302)
  t.is(res.headers.get("location"), "/login")
})

test.serial("POST /recipes/new vytvoří recept, pokud jsem přihlášený", async t => {
  const token = await signupAndGetToken(t)

  const fd = new FormData()
  fd.append("title", "Zeleninový salát")
  fd.append("ingredients[]", "rajče")
  fd.append("ingredients[]", "okurka")
  fd.append("steps", "Nakrájej, promíchej, dochuť.")
  fd.append("category", "Snídaně")

  const res1 = await app.request("/recipes/new", {
    method: "POST",
    headers: { cookie: `token=${token}` },
    body: fd,
  })
  t.is(res1.status, 302)
  t.is(res1.headers.get("location"), "/")

  const res2 = await client["/"].$get({ headers: { cookie: `token=${token}` } })
  const html2 = await res2.text()
  t.true(html2.includes("Zeleninový salát"))
})

