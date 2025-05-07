import test from 'ava'
import { createUser,getUser, db } from '../src/db.js' 
import { usersTable } from '../src/schema.js' 

test.beforeEach("delete users", async () => {
    await db.delete(usersTable)
})


test.serial("createUser creates user", async (t) => {
    await createUser("Naty", "heslo")

    const users = await db.select().from(usersTable).all()

    t.is(users.length, 1)
})

test.serial("getUser gets user", async (t) => {
    await createUser("Naty","heslo")

    const user = await getUser("Naty","heslo")
    t.is(users.name, "Naty")
})