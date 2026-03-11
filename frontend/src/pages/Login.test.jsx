import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login.jsx";

// Mock the useAuth hook so the test doesn't hit the API
vi.mock("../hooks/useAuth.js", () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe("Login page", () => {
  it("renders the email and password fields", () => {
    renderLogin();
    expect(
      screen.getByPlaceholderText("coach@example.com"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("renders a submit button", () => {
    renderLogin();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows a validation error when submitted with an empty email", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it("shows a validation error when password is empty", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(
      screen.getByPlaceholderText("coach@example.com"),
      "coach@example.com",
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(
      await screen.findByText(/password is required/i),
    ).toBeInTheDocument();
  });
});
