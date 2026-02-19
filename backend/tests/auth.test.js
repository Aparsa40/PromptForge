const request = require("supertest");
const app = require("../src/app");

describe("Authentication API", () => {
  it("should return 400 for invalid login payload", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it("should return 200 for health check", async () => {
    const res = await request(app)
      .get("/api/chat/welcome");

    expect(res.statusCode).toBe(200);
  });
});
