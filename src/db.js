import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import { recipesTable, usersTable } from "./schema.js"
import { migrate } from "drizzle-orm/libsql/migrator"
import crypto from 'crypto'


const isTest = process.env.NODE_ENV === "test"

export const db = drizzle({
  connection: isTest ? "file::memory:" : "file:db.sqlite",
  logger: !isTest,
})

await migrate(db, { migrationsFolder: "drizzle" })

export const getAllRecipes = async () => {
  const results = await db
    .select()
    .from(recipesTable)
    .leftJoin(
      usersTable,
      eq(recipesTable.userId, usersTable.id)
    )
    .all()

  const recipes = results.map((result) => ({
    ...result.recipes,
    user: result.users,
  }))

  return recipes
}

export const getRecipeById = async (id) => {
  const recipe = await db
    .select()
    .from(recipesTable)
    .where(eq(recipesTable.id, id))
    .get()

  return recipe
}

export const deleteRecipeById = async (id) => {
  const recipe = await db
    .delete()
    .where(eq(recipesTable.id, id))

  return recipe
}



export const createRecipe = async (values) => {
  return await db
    .insert(recipesTable)
    .values({
      ...values,
      userId: values.user ? values.user.id : null,
    })
    .returning(recipesTable)
    .get()
}

export const updateRecipe = async (id, values) => {
  await db
    .update(recipesTable)
    .set(values)
    .where(eq(recipesTable.id, id))
}

export const deleteRecipe = async (id) => {
  await db.delete(recipesTable).where(eq(recipesTable.id, id))
}

export const createUser = async (username, password) => {
  const salt = crypto.randomBytes(16).toString("hex")
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex")
  const token = crypto.randomBytes(16).toString("hex")

  const user = await db
    .insert(usersTable)
    .values({
      username,
      hashedPassword,
      token,
      salt,
    })
    .returning(usersTable)
    .get()

  return user
}

export const getUser = async (username, password) => {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .get()

  if (!user) return null

  const hashedPassword = crypto
    .pbkdf2Sync(password, user.salt, 100000, 64, "sha512")
    .toString("hex")

  if (user.hashedPassword !== hashedPassword) return null

  return user
}

export const getUserByToken = async (token) => {
  if (!token) return null

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.token, token))
    .get()

  return user
}
