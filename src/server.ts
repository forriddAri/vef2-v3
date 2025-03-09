import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { serve } from '@hono/node-server';
import { z } from 'zod';

const app = new Hono();
const prisma = new PrismaClient();


// Sækja alla flokka
app.get('/categories/:slug', async (c) => {
  const slug = c.req.param('slug');
  const category = await prisma.category.findUnique({ where: { slug } });
  return category ? c.json(category) : c.notFound();
});


// Sækja ákveðinn flokk eftir slug
app.get('/categories/:slug', async (c) => {
  const slug = c.req.param('slug');
  const category = await prisma.category.findUnique({ where: { slug } });
  return category ? c.json(category) : c.notFound();
});

// Búa til nýjan flokk
const categorySchema = z.object({ name: z.string().min(1) });

app.post('/category', async (c) => {
  const body = await c.req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Invalid data' }, 400);

  const slug = body.name.toLowerCase().replace(/\s+/g, '-');

  try {
    const category = await prisma.category.create({ data: { name: body.name, slug } });
    return c.json(category, 201);
  } catch (error) {
    if (error.code === 'P2002') { // Prisma unique constraint error
      return c.json({ error: "Category already exists" }, 400);
    }
    return c.json({ error: "Something went wrong" }, 500);
  }
});


// ✅ Nota @hono/node-server til að keyra appið
const port = 3000;
serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server is running on http://localhost:${port}`);
console.log(`🚀 Server running on http://localhost:${port}`);