import {
  sqliteTable,
  int,
  text,
} from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

export const todosTable = sqliteTable("todos", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  done: int({ mode: "boolean" }).notNull(),
  priority: text({ enum: ['low', 'normal', 'high'] }).notNull().default('normal'),
  userId: int(),
})

export const usersTable = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  hashedPassword: text().notNull(),
  token: text().notNull(),
  salt: text().notNull()
})

export const todosRelation = relations(
  todosTable, 
  ({one}) => ({
    user: one(usersTable),
  })
)

export const usersRelation = relations(
  usersTable, 
  ({many}) => ({
    user: many(todosTable),
  })
)