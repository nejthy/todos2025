import test from "ava"
import { db } from "../src/db.js"
import { recipesTable } from "../src/schema.js"
import {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
} from "../src/db.js"
import { migrate } from "drizzle-orm/libsql/migrator";





test.beforeEach("delete recipes", async () => {
  await db.delete(recipesTable)
})

test.serial("getRecipeById returns recipe", async (t) => {
  await db.insert(recipesTable).values({
    id: 1,
    title: "Test recept",
    ingredients: "sůl, voda",
    steps: "1. přidej sůl, 2. přidej vodu",
    category: "Snídaně",
  })

  const recipe = await getRecipeById(1)

  t.is(recipe.title, "Test recept")
  t.is(recipe.category, "Snídaně")
})

test.serial("getAllRecipes returns all recipes", async (t) => {
  await db.insert(recipesTable).values([
    {
      title: "Recept 1",
      ingredients: "x",
      steps: "krok 1",
      category: "Hlavní jídlo",
    },
    {
      title: "Recept 2",
      ingredients: "y",
      steps: "krok 2",
      category: "Svačina",
    },
    {
      title: "Recept 3",
      ingredients: "z",
      steps: "krok 3",
      category: "Dezert",
    },
  ])

  const recipes = await getAllRecipes()

  t.is(recipes.length, 3)
})

test.serial("createRecipe creates recipe", async (t) => {
  await createRecipe({
    title: "Nový recept",
    ingredients: "něco",
    steps: "něco dělej",
    category: "Svačina",
  })

  const recipes = await getAllRecipes()

  t.is(recipes[0].title, "Nový recept")
})

test.serial("updateRecipe updates recipe", async (t) => {
  await createRecipe({
    id: 1,
    title: "a",
    ingredients: "něco",
    steps: "něco",
    category: "Hlavní jídlo",
  })

  await updateRecipe(1, {
    title: "b",
    category: "Dezert",
    ingredients: "něco jiného",
    steps: "jiný postup",
  })

  const recipe = await getRecipeById(1)

  t.is(recipe.title, "b")
  t.is(recipe.category, "Dezert")
  t.is(recipe.steps, "jiný postup")
})

test.serial("deleteRecipe deletes recipe", async (t) => {
  await createRecipe({
    title: "Recept",
    ingredients: "něco",
    steps: "něco",
    category: "Snídaně",
  })

  const recipesBefore = await getAllRecipes()
  t.is(recipesBefore.length, 1)

  await deleteRecipe(recipesBefore[0].id)

  const recipesAfter = await getAllRecipes()
  t.is(recipesAfter.length, 0)
})
