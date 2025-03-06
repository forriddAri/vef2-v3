import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { serve } from "@hono/node-server";
import { z } from "zod";

const app = new Hono();
const prisma = new PrismaClient();

// ✅ Test route
app.get("/", (c) => {
  return c.json({ message: "Server is running!" });
});

// 🟢 Get all categories
app.get("/categories", async (c) => {
  try {
    const categories = await prisma.category.findMany();
    return c.json(categories);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// 🟢 Get category by slug
app.get("/categories/:slug", async (c) => {
  const slug = c.req.param("slug");
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { questions: true }, // Include questions in response
    });

    if (!category) {
      return c.json({ error: "Category not found" }, 404);
    }
    return c.json(category);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// 🟢 Create a new category
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

// 🟢 Delete a category
app.delete("/categories/:slug", async (c) => {
  const slug = c.req.param("slug");
  try {
    await prisma.category.delete({ where: { slug } });
    return c.body(null, 204);
  } catch (error) {
    return c.json({ error: "Category not found" }, 404);
  }
});

// 🟢 Get all questions
app.get("/questions", async (c) => {
  try {
    const questions = await prisma.question.findMany({
      include: { category: true }, // Include category info
    });
    return c.json(questions);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// 🟢 Get question by ID
app.get("/questions/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid question ID" }, 400);

  try {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { category: true },
    });

    return question ? c.json(question) : c.json({ error: "Question not found" }, 404);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// 🟢 Get questions by category slug
app.get("/categories/:slug/questions", async (c) => {
  const slug = c.req.param("slug");

  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { questions: true },
    });

    return category ? c.json(category.questions) : c.json({ error: "Category not found" }, 404);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// 🟢 Create a new question
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

// 🟢 Delete a question
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

// ✅ Get all answers
app.get("/answers", async (c) => {
  try {
    const answers = await prisma.answers.findMany({
      include: { question: true }, // Include related question
    });
    return c.json(answers);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ✅ Get answers for a specific question
app.get("/questions/:id/answers", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid question ID" }, 400);

  try {
    const answers = await prisma.answers.findMany({ where: { questionId: id } });
    return answers.length > 0 ? c.json(answers) : c.json({ error: "No answers found" }, 404);
  } catch (error) {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// ✅ Create a new answer
const answerSchema = z.object({ text: z.string().min(1) });

app.post("/questions/:id/answers", async (c) => {
  const questionId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid data" }, 400);

  try {
    const answer = await prisma.answers.create({ data: { text: body.text, questionId } });
    return c.json(answer, 201);
  } catch (error) {
    return c.json({ error: "Failed to create answer" }, 500);
  }
});

// ✅ Update an answer
app.patch("/answers/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  if (isNaN(id) || !body.text) return c.json({ error: "Invalid request data" }, 400);

  try {
    const updatedAnswer = await prisma.answers.update({
      where: { id },
      data: { text: body.text },
    });
    return c.json(updatedAnswer);
  } catch (error) {
    return c.json({ error: "Answer not found" }, 404);
  }
});

// ✅ Delete an answer
app.delete("/answers/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid answer ID" }, 400);

  try {
    await prisma.answers.delete({ where: { id } });
    return c.body(null, 204);
  } catch (error) {
    return c.json({ error: "Answer not found" }, 404);
  }
});

// ✅ Update a category
app.patch("/categories/:slug", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();

  if (!body.name) return c.json({ error: "Missing 'name' field" }, 400);

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

// ✅ Update a question
app.patch("/question/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  if (isNaN(id) || !body.question) return c.json({ error: "Invalid request data" }, 400);

  try {
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: { question: body.question },
    });
    return c.json(updatedQuestion);
  } catch (error) {
    return c.json({ error: "Question not found" }, 404);
  }
});



// ✅ Start the server
const port = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Server is running on http://localhost:${port}`);
