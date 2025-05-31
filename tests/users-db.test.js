import test from "ava"
import { usersTable } from "../src/schema.js"
import {
  createUser,
  db,
  getUser,
  getUserByToken,
} from "../src/db.js"


test.beforeEach(async () => {
  await db.delete(usersTable).run()
})


test.beforeEach("delete users", async () => {
  await db.delete(usersTable)
})

test.serial("createUser creates user", async (t) => {
  await createUser("naty", "heslo")

  const users = await db.select().from(usersTable).all()

  t.is(users.length, 1)
})

test.serial("getUser gets user", async (t) => {
  await createUser("naty", "heslo")

  const user = await getUser("naty", "heslo")

  t.is(user.username, "naty")
})

test.serial(
  "createUser also returns the user",
  async (t) => {
    const user = await createUser("naty", "heslo")

    t.is(user.username, "naty")
  }
)

test.serial(
  "getUserByToken gets user by token",
  async (t) => {
    const user = await createUser("naty", "heslo")

    const userByToken = await getUserByToken(user.token)

    t.is(userByToken.id, user.id)
  }
)
