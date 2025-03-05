import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { serve } from "@hono/node-server";
import { z } from "zod";

const app = new Hono();
const prisma = new PrismaClient();

// ✅ Get all categories
app.get("/categories", async (c) => {
  try {
    const categories = await prisma.category.findMany();
    return c.json(categories);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ✅ Get category by slug
app.get("/categories/:slug", async (c) => {
  const slug = c.req.param("slug");
  const category = await prisma.category.findUnique({ where: { slug } });

  return category ? c.json(category) : c.json({ error: "Not found" }, 404);
});

// ✅ Create a new category
const categorySchema = z.object({ name: z.string().min(1) });

app.post("/category", async (c) => {
  const body = await c.req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid data" }, 400);

  const slug = body.name.toLowerCase().replace(/\s+/g, "-");

  try {
    const category = await prisma.category.create({ data: { name: body.name, slug } });
    return c.json(category, 201);
  } catch (error: any) {
    if (error.code === "P2002") return c.json({ error: "Category already exists" }, 400);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ✅ Delete a category
app.delete("/categories/:slug", async (c) => {
  const slug = c.req.param("slug");

  try {
    await prisma.category.delete({ where: { slug } });
    return c.body(null, 204);
  } catch (error) {
    return c.json({ error: "Category not found" }, 404);
  }
});

// ✅ Get all questions
app.get("/questions", async (c) => {
  try {
    const questions = await prisma.question.findMany();
    return c.json(questions);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ✅ Get question by ID
app.get("/questions/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) return c.json({ error: "Invalid question ID" }, 400);

  const question = await prisma.question.findUnique({ where: { id } });

  return question ? c.json(question) : c.json({ error: "Not found" }, 404);
});

// ✅ Get questions by category
app.get("/categories/:slug/questions", async (c) => {
  const slug = c.req.param("slug");

  const category = await prisma.category.findUnique({ where: { slug }, include: { questions: true } });

  return category ? c.json(category.questions) : c.json({ error: "Category not found" }, 404);
});

// ✅ Create a new question
const questionSchema = z.object({
  question: z.string().min(1),
  categoryId: z.number(),
});

app.post("/question", async (c) => {
  const body = await c.req.json();
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid data" }, 400);

  try {
    const question = await prisma.question.create({ data: body });
    return c.json(question, 201);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ✅ Delete a question
app.delete("/question/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) return c.json({ error: "Invalid question ID" }, 400);

  try {
    await prisma.question.delete({ where: { id } });
    return c.body(null, 204);
  } catch (error) {
    return c.json({ error: "Question not found" }, 404);
  }
});

// ✅ Start server on Render
const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Server is running on http://localhost:${port} or Render`);
