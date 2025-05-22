import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import { recipesTable, usersTable, ratingsTable, favoritesTable, commentsTable } from "./schema.js"
import crypto from 'crypto'
import { and } from "drizzle-orm"



const isTest = process.env.NODE_ENV === "test"

export const db = drizzle({
  connection: isTest ? "file::memory:" : "file:db.sqlite",
  logger: !isTest,
})


export const getAllRecipes = async (userId) => {
  const results = await db
    .select()
    .from(recipesTable)
    .leftJoin(usersTable, eq(recipesTable.userId, usersTable.id))
    .all();

  let favorites = [];
  if (userId) {
    favorites = await db
      .select({ recipeId: favoritesTable.recipeId })
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId))
      .all();
  }

  const favoriteIds = favorites.map(f => f.recipeId);

  const recipes = results.map(result => ({
    ...result.recipes,
    user: result.users,
    isFavorite: favoriteIds.includes(result.recipes.id),
  }));

  return recipes;
};


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


export const getRatingByUserAndRecipe = async (userId, recipeId) => {
  return await db
    .select()
    .from(ratingsTable)
    .where(and(eq(ratingsTable.userId, userId), eq(ratingsTable.recipeId, recipeId)))
    .get()
}

export const createRating = async (userId, recipeId, rating) => {
  return await db.insert(ratingsTable).values({
    userId,
    recipeId,
    rating,
  })
}

export const updateRating = async (id, rating) => {
  return await db.update(ratingsTable)
    .set({ rating })
    .where(eq(ratingsTable.id, id))
}

export const getRatingsForRecipe = async (recipeId) => {
  return await db
    .select({ rating: ratingsTable.rating })
    .from(ratingsTable)
    .where(eq(ratingsTable.recipeId, recipeId))
}

export const updateRecipeRatingStats = async (recipeId, average, count) => {
  return await db.update(recipesTable)
    .set({
      averageRating: average,
      votesCount: count,
    })
    .where(eq(recipesTable.id, recipeId))
}

export const addFavorite = async (userId, recipeId) => {
  return await db.insert(favoritesTable).values({ userId, recipeId });
};

export const removeFavorite = async (userId, recipeId) => {
  return await db.delete(favoritesTable).where(
    and(eq(favoritesTable.userId, userId), eq(favoritesTable.recipeId, recipeId))
  );
};

export const isFavorite = async (userId, recipeId) => {
  return await db
      .select()
      .from(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.recipeId, recipeId))).get();
}

export const getCommentsByRecipe = async (recipeId) => {
  const results = await db
    .select()
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
    .where(eq(commentsTable.recipeId, recipeId))
    .orderBy(commentsTable.createdAt, 'asc')
    .all();

  return results.map(r => ({
    ...r.comments,
    user: r.users,
  }));
};

export const createComment = async (recipeId, userId, content) => {
  return await db
    .insert(commentsTable)
    .values({
      userId,
      recipeId,
      content,
    })
}