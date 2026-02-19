import { render, screen } from "@testing-library/react";
import App from "../src/App";

describe("App Component", () => {
  it("renders application without crashing", () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });
});
