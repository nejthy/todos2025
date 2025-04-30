import test from 'ava'
import { testClient } from 'hono/testing'
import { app } from "../src/app.js"
import { migrate } from 'drizzle-orm/libsql/migrator'
import { todosTable } from '../src/schema.js'
import {
  db, createTodo
} from "../src/db.js"

const client = testClient(app)

test.before("run migrations", async () => {
  await migrate(db, {migrationsFolder: "drizzle"})
})

test.afterEach("delete todos", async () => {
  await db.delete(todosTable)
})

test.serial("GET / returns index with title" , async (t) => {
  const response = await client["/"].$get()
  const text = await response.text()

  t.assert(text.includes("<h1>MY TODO APP</h1>"))
})

test.serial("GET / show todos" , async (t) => {
  await  createTodo({
    title: "Testovaci todo!!!",
    done: false,
  })

  const response = await client["/"].$get()
  const text = await response.text()

  t.assert(text.includes("Testovaci todo!!!"))
})

