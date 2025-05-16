import sharp from 'sharp'
import { Hono } from "hono"
import { serveStatic } from "@hono/node-server/serve-static"
import { renderFile } from "ejs"
import { createNodeWebSocket } from "@hono/node-ws"
import { WSContext } from "hono/ws"
import {
  createRecipe,
  deleteRecipe,
  getAllRecipes,
  getRecipeById,
  getUserByToken,
  updateRecipe,
} from "./db.js"
import { usersRouter } from "./users.js"
import { getCookie } from "hono/cookie"
import fs from "fs/promises";
import path from "path";

export const app = new Hono()

export const { injectWebSocket, upgradeWebSocket } =
  createNodeWebSocket({ app })

app.use(serveStatic({ root: "public" }))

app.use(async (c, next) => {
  const token = getCookie(c, "token")
  const user = await getUserByToken(token)
  c.set("user", user)
  await next()
})

app.route("/", usersRouter)

app.get("/", async (c) => {
  const recipes = await getAllRecipes()

  const index = await renderFile("views/index.html", {
    title: "Recepty",
    recipes,
    user: c.get("user"),
  })

  return c.html(index)
})

app.post("/recipes", async (c) => {
  const form = await c.req.formData()

  await createRecipe({
    title: form.get("title"),
    ingredients: form.get("ingredients"),
    steps: form.get("steps"),
    user: c.get("user"),
  })

  sendRecipesToAllConnections()

  return c.redirect("/")
})

app.get("/recipes/:id", async (c) => {
  const id = Number(c.req.param("id"))

  const recipe = await getRecipeById(id)

  if (!recipe) return c.notFound()

  const detail = await renderFile("views/detail.html", {
    recipe,
    user: c.get("user"), 
  })

  return c.html(detail)
})


app.post("/recipes/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const recipe = await getRecipeById(id);
  if (!recipe) return c.notFound();

  const form = await c.req.formData();
  const image = form.get("image");

  let imagePath = recipe.imagePath;

  console.log("IMAGE DEBUG:", image);

  const values = {
    title: form.get("title"),
    ingredients: form.get("ingredients"),
    steps: form.get("steps"),
  };
  
  if (
    image &&
    typeof image.name === "string" &&
    image.name !== "" &&
    typeof image.arrayBuffer === "function"
  ) {
    const filename = `${Date.now()}-${image.name}`;
    const filepath = path.join("public", "uploads", filename);
    const buffer = Buffer.from(await image.arrayBuffer());
  
    await sharp(buffer).resize({width: 500}).toFile(filepath),
    values.imagePath = filename;
  
  }

  await updateRecipe(id, values);
  
  sendRecipesToAllConnections();
  sendRecipeDetailToAllConnections(id);

  return c.redirect(c.req.header("Referer"));
});

app.get("/recipes/:id/remove", async (c) => {
  const id = Number(c.req.param("id"))

  const recipe = await getRecipeById(id)
  if (!recipe) return c.notFound()

  await deleteRecipe(id)

  sendRecipesToAllConnections()
  sendRecipeDeletedToAllConnections(id)

  return c.redirect("/")
})

/** @type{Set<WSContext<WebSocket>>} */
const connections = new Set()

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onOpen: (ev, ws) => {
        connections.add(ws)
      },
      onClose: (evt, ws) => {
        connections.delete(ws)
      },
    }
  })
)

const sendRecipesToAllConnections = async () => {
  const recipes = await getAllRecipes()

  const rendered = await renderFile("views/_recipes.html", {
    recipes,
  })

  for (const connection of connections.values()) {
    const data = JSON.stringify({
      type: "recipes",
      html: rendered,
    })

    connection.send(data)
  }
}

const sendRecipeDetailToAllConnections = async (id) => {
  const recipe = await getRecipeById(id)

  const rendered = await renderFile("views/_recipe.html", {
    recipe,
  })

  for (const connection of connections.values()) {
    const data = JSON.stringify({
      type: "recipe",
      id,
      html: rendered,
    })

    connection.send(data)
  }
}

const sendRecipeDeletedToAllConnections = async (id) => {
  for (const connection of connections.values()) {
    const data = JSON.stringify({
      type: "recipeDeleted",
      id,
    })

    connection.send(data)
  }
}



