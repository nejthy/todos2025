import { renderFile } from "ejs";
import { Hono } from "hono";

export const usersRoute = new Hono()

usersRoute.get("/register", async (c) =>{
  const rendered = await renderFile("views/index.html")
})