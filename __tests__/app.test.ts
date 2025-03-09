import request from "supertest";
import { app, prisma } from "../src/index";

describe("API Endpoints", () => {
  afterAll(async () => {
    await prisma.$disconnect(); // ✅ Properly close Prisma connection
  });

  test("GET / should return server status", async () => {
    const res = await request(app.fetch).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Server is running!");
  });

  test("GET /categories should return an array", async () => {
    const res = await request(app.fetch).get("/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /category should create a category", async () => {
    const res = await request(app.fetch)
      .post("/category")
      .send({ name: "Test Category" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Category");
  });

  test("DELETE /categories/:slug should remove a category", async () => {
    const res = await request(app.fetch).delete("/categories/test-category");
    expect(res.status).toBe(204);
  });
});
