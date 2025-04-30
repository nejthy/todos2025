import { drizzle } from "drizzle-orm/libsql"
import { eq } from "drizzle-orm"
import { todosTable } from "./schema.js"

export const db = drizzle({
    connection:
      process.env.NODE_ENV === "test"
        ? "file::memory:"
        : "file:db.sqlite",
    logger: process.env.NODE_ENV !== "test",
  })
  
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
