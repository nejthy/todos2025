import sharp from 'sharp'
import { Hono } from "hono"
import { setCookie } from "hono/cookie"
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
  getRatingByUserAndRecipe,
  createRating,
  updateRating,
  getRatingsForRecipe,
  updateRecipeRatingStats,
  addFavorite,
  isFavorite,
  removeFavorite
} from "./db.js"
import { usersRouter } from "./users.js"
import { getCookie } from "hono/cookie"
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
  const user = c.get("user");
  const recipes = await getAllRecipes(user?.id);

const index = await renderFile("views/index.html", {
  title: "Recepty",
  recipes,
  user,
});


  return c.html(index)
})

app.get("/recipes/new", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.redirect("/login");
  }

  const html = await renderFile("views/new.recipe.html", { user });
  return c.html(html);
});



app.post("/recipes/:id/rate", async (c) => {
  const id = Number(c.req.param("id"));
  const form = await c.req.formData();
  const rating = Number(form.get("rating"));
  const user = c.get("user");

  if (!user) {
    await setCookie(c, "flash", "Pro hodnocení se musíte přihlásit", {
      path: "/",
      httpOnly: false, 
      maxAge: 5,       
    });
  
    return c.redirect("/login");
  }

  const existing = await getRatingByUserAndRecipe(user.id, id);

  if (existing) {
    await updateRating(existing.id, rating);
  } else {
    await createRating(user.id, id, rating);
  }

  const ratings = await getRatingsForRecipe(id);
  const count = ratings.length;
  const total = ratings.reduce((sum, r) => sum + r.rating, 0);
  const average = total / count;

  await updateRecipeRatingStats(id, average, count);

  sendRecipesToAllConnections();
  sendRecipeDetailToAllConnections(id);

  const path = c.req.path

  return c.redirect(`/recipes/${id}`);


  

});

app.post("/recipes/new", async (c) => {
  const form = await c.req.formData();
  const image = form.get("image");

  const ingredientsArray = form.getAll("ingredients[]"); 
  const ingredientsString = ingredientsArray.join(", "); 


  const values = {
    title: form.get("title"),
    ingredients: ingredientsString,
    steps: form.get("steps"),
    user: c.get("user"),
    imagePath: "default.jpg", 
    category: form.get("category")
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

    await sharp(buffer)
      .resize({ width: 300 })
      .toFile(filepath);

    values.imagePath = filename;
  }

  await createRecipe(values);
  sendRecipesToAllConnections();

  return c.redirect("/");
});




app.get("/recipes/:id", async (c) => {
  const id = Number(c.req.param("id"))

  const user = c.get("user");
  const recipe = await getRecipeById(id);

let isFavorite = false;
if (user) {
  const favorite = await isFavoriteRecipe(user.id, recipe.id);
  isFavorite = !!favorite;
}

const detail = await renderFile("views/detail.html", {
  recipe,
  user,
  isFavorite,
});

  return c.html(detail)
})



app.post("/recipes/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const recipe = await getRecipeById(id);
  if (!recipe) return c.notFound();



  const form = await c.req.formData();
  const image = form.get("image");

  const ingredientsArray = form.getAll("ingredients[]");
  const ingredientsString = ingredientsArray.join(", ");

  let imagePath = recipe.imagePath;

  console.log("IMAGE DEBUG:", image);

  const values = {
    title: form.get("title"),
    ingredients: ingredientsString,
    steps: form.get("steps"),
    category: form.get("category")

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
  
    await sharp(buffer).resize({width: 300}).toFile(filepath),
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

app.post("/recipes/:id/favorite", async (c) => {
  const id = Number(c.req.param("id"))
  const user = c.get("user");

  const recipe = await getRecipeById(id)
  if (!recipe) return c.notFound()

  await addFavorite(user.index,id)

  sendRecipesToAllConnections()

  return c.redirect("/")
})

app.post("/recipes/:id/unfavorite", async (c) => {
  const id = Number(c.req.param("id"))
  const user = c.get("user");

  const recipe = await getRecipeById(id)
  if (!recipe) return c.notFound()

  await removeFavorite(user,id)

  sendRecipesToAllConnections()
  sendRecipeDeletedToAllConnections(id)


  return c.redirect("/")
})

/** @type{Set<WSContext<WebSocket>>} */
const connections = new Set()

app.get(
  "/ws",
  upgradeWebSocket(async (c) => {
    const token = getCookie(c, "token");
    const user = await getUserByToken(token); 

    return {
      onOpen: (ev, ws) => {
        ws.user = user; 
        connections.add(ws);
      },
      onClose: (ev, ws) => {
        connections.delete(ws);
      },
    };
  })
);


const sendRecipesToAllConnections = async () => {
  for (const connection of connections.values()) {
    const user = connection.user || null;

    const recipes = await getAllRecipes(user?.id);

    const rendered = await renderFile("views/_recipes.html", {
      recipes,
      user,
    });

    const data = JSON.stringify({
      type: "recipes",
      html: rendered,
    });

    connection.send(data);
  }
};


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



