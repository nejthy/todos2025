import {
  sqliteTable,
  int,
  text,
  real,
} from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

export const recipesTable = sqliteTable("recipes", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  ingredients: text().notNull(), 
  steps: text().notNull(),       
  averageRating: real().default(0), 
  votesCount: int().default(0),     
  userId: int().references(() => usersTable.id),
  imagePath: text(),
  category: text({ enum: ["Snídaně", "Hlavní jídlo", "Dezert","Svačina"] })
  .notNull()
  .default("Hlavní jídlo"),
})

export const usersTable = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  hashedPassword: text().notNull(),
  salt: text().notNull(),
  token: text().notNull(),
})

export const ratingsTable = sqliteTable("ratings", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => usersTable.id),
  recipeId: int().notNull().references(() => recipesTable.id),
  rating: int().notNull(), // 1 až 5
});

export const favoritesTable = sqliteTable("favorites", {
  userId: int().references(() => usersTable.id),
  recipeId: int().references(() => recipesTable.id),
});

export const recipesRelations = relations(recipesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [recipesTable.userId],
    references: [usersTable.id],
  }),
  ratings: many(ratingsTable),
}));



export const usersRelations = relations(usersTable, ({ many }) => ({
  recipes: many(recipesTable),
  ratings: many(ratingsTable),
}));

export const ratingsRelations = relations(ratingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [ratingsTable.userId],
    references: [usersTable.id],
  }),
  recipe: one(recipesTable, {
    fields: [ratingsTable.recipeId],
    references: [recipesTable.id],
  }),
}));
