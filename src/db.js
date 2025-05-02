import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import { todosTable } from "./schema.js"
import { migrate } from "drizzle-orm/libsql/migrator"


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
