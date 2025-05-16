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
  imagePath: text()
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
