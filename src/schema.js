import {
  sqliteTable,
  int,
  text,
  real,
} from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

// Tabulka receptů
export const recipesTable = sqliteTable("recipes", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  ingredients: text().notNull(), // čárkami oddělené ingredience
  steps: text().notNull(),       // postup receptu
  averageRating: real().default(0), // průměrné hodnocení
  votesCount: int().default(0),     // počet hlasů
  userId: int().references(() => usersTable.id),
})

export const usersTable = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  hashedPassword: text().notNull(),
  salt: text().notNull(),
  token: text().notNull(),
})

export const recipesRelations = relations(recipesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [recipesTable.userId],
    references: [usersTable.id],
  }),
}));


export const usersRelations = relations(
  usersTable,
  ({ many }) => ({
    recipes: many(recipesTable),
  })
)
