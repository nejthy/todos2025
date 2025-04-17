import test from "ava"
import { migrate } from "drizzle-orm/libsql/migrator"
import {
  db,
  getTodoById,
  getAllTodos,
  updateTodoById,
  deleteTodoById,
} from "../src/db.js"
import { todosTable } from "../src/schema.js"

test.before("run migrations", async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
})

test("getTodoById returns id", async (t) => {
  await db
    .insert(todosTable)
    .values({ id: 1, title: "testovaci todo", done: false })

  const todo = await getTodoById(1)
  
  t.is(todo.title, "testovaci todo")
})

test("getAllTodos returns all todos", async (t) => {
  await db.insert(todosTable).values([
    { id: 3, title: "První", done: false },
    { id: 4, title: "Druhý", done: true },
  ])

  const todos = await getAllTodos()
  t.is(todos[1].title, "První")
  t.is(todos[2].done, true)
})

test("updateTodoById updates fields", async (t) => {
  await db.insert(todosTable).values({
    id: 5,
    title: "Původní",
    done: false,
    priority: "high",
  })

  await updateTodoById(5, {
    title: "Upravený",
    priority: "low",
  })

  const updated = await getTodoById(5)
  t.is(updated.title, "Upravený")
  t.is(updated.priority, "low")
})

test("deleteTodoById removes the todo", async (t) => {
  await db.insert(todosTable).values({
    id: 6,
    title: "Smazat mě",
    done: false,
  })

  await deleteTodoById(6)

  const todo = await getTodoById(6)
  t.is(todo, undefined)
})