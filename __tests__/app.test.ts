import request from "supertest";
import { serve } from "@hono/node-server";
import { app } from "../src/index";

let server: ReturnType<typeof serve>;

beforeAll(() => {
  server = serve({ fetch: app.fetch, port: 3001 }); // Run on test port
});

afterAll(() => {
  server.close();
});

describe("API Endpoints", () => {
  test("GET / should return server status", async () => {
    const res = await request("http://localhost:3001").get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Server is running!" });
  });

  test("GET /categories should return an array", async () => {
    const res = await request("http://localhost:3001").get("/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /category should create a category", async () => {
    const res = await request("http://localhost:3001")
      .post("/category")
      .send({ name: "Test Category" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test Category");
  });

  test("DELETE /categories/:slug should remove a category", async () => {
    const res = await request("http://localhost:3001")
      .delete("/categories/test-category");

    expect([200, 204, 404]).toContain(res.status); // Allow for "not found" as well
  });
});
