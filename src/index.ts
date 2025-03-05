import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { serve } from "@hono/node-server"; // ✅ Import the Hono server

const app = new Hono();
const prisma = new PrismaClient();

// ✅ Test route
app.get("/", (c) => {
  return c.json({ message: "Server is running!" });
});

// 🟢 Get all categories
app.get("/categories", async (c) => {
  const categories = await prisma.category.findMany();
  return c.json(categories);
});

// 🟢 Get category by slug
app.get("/categories/:slug", async (c) => {
  const slug = c.req.param("slug");
  const category = await prisma.category.findUnique({ where: { slug } });

  if (!category) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(category);
});

// 🟢 Create a new category
app.post("/category", async (c) => {
  const body = await c.req.json();
  const { name, slug } = body;

  if (!name || !slug) {
    return c.json({ error: "Missing fields" }, 400);
  }

  const newCategory = await prisma.category.create({
    data: { name, slug },
  });

  return c.json(newCategory, 201);
});

// 🟢 Update a category
app.patch("/category/:slug", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();

  if (!body.name) {
    return c.json({ error: "Missing field 'name'" }, 400);
  }

  try {
    const updatedCategory = await prisma.category.update({
      where: { slug },
      data: { name: body.name },
    });

    return c.json(updatedCategory);
  } catch (error) {
    return c.json({ error: "Category not found" }, 404);
  }
});

// 🟢 Delete a category
app.delete("/category/:slug", async (c) => {
  const slug = c.req.param("slug");

  try {
    await prisma.category.delete({ where: { slug } });
    return c.body(null, 204); // ✅ Correctly return 204 with no content
  } catch (error) {
    return c.json({ error: "Category not found" }, 404);
  }
});

// ✅ Start the server (This keeps Node.js running)
const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Server is running on http://localhost:${port}`);
