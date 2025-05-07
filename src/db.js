import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import { todosTable, usersTable } from "./schema.js"
import { migrate } from "drizzle-orm/libsql/migrator"
import crypto from 'crypto'


const isTest = process.env.NODE_ENV === "test"

export const db = drizzle({
  connection: isTest ? "file::memory:" : "file:db.sqlite",
  logger: !isTest,
})

await migrate(db, { migrationsFolder: "drizzle" })
export const getTodoById = async (id) => {
  const todo = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id, id))
    .get()

  return todo
}

export const createTodo = async (values) => {
  return await db
    .insert(todosTable)
    .values(values)
    .returning(todosTable)
    .get()
}


export const getAllTodos = async () => {
  const todos = await db
    .select()
    .from(todosTable)
    .all()

  return todos
}

export const deleteTodoById = async (id) => {
  return db
    .delete(todosTable)
    .where(eq(todosTable.id, id))
}


export const updateTodoById = async (id, updates) => {
  const result = await db
    .update(todosTable)
    .set(updates)
    .where(eq(todosTable.id, id))

  return result
}

export const createUser = async (username, password) => {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  const token = crypto.randomBytes(16).toString('hex')

  return await db
  .insert(usersTable)
  .values(values)
  .returning(usersTable)
  .get() // dodelat createUser

}

export const getUser = async (username, password) => {
  const user = await db
    .select(username)
    .from(usersTable)
    .where(eq(usersTable.username, username))

  if (!user) return null

  const hashedPassword = crypto.pbkdf2Sync(password, user.salt, 100000, 64, "sha512").toString("hex")

  if (user.hashedPassword !== hashedPassword) return null

  return user
  
}

