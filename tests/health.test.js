const axios = require("axios");

describe("System Health", () => {
  it("backend should respond to health endpoint", async () => {
    const res = await axios.get("http://localhost:5000/api/chat/welcome");
    expect(res.status).toBe(200);
  });
});
