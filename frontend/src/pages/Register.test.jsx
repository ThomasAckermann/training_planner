import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register.jsx";

vi.mock("../hooks/useAuth.js", () => ({
  useAuth: () => ({ register: vi.fn() }),
}));

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );
}

describe("Register page", () => {
  it("renders all form fields", () => {
    renderRegister();
    expect(screen.getByPlaceholderText("Jane Smith")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("coach@example.com"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Min. 8 characters"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Repeat your password"),
    ).toBeInTheDocument();
  });

  it("renders a submit button", () => {
    renderRegister();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("renders a Google OAuth link", () => {
    renderRegister();
    const googleLink = screen.getByRole("link", {
      name: /continue with google/i,
    });
    expect(googleLink).toBeInTheDocument();
    expect(googleLink).toHaveAttribute("href", "/api/auth/google");
  });

  it("shows validation error when name is too short", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText("Jane Smith"), "A");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(
      await screen.findByText(/at least 2 characters/i),
    ).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText("Jane Smith"), "Jane Smith");
    await user.type(
      screen.getByPlaceholderText("coach@example.com"),
      "not-an-email",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByPlaceholderText("Jane Smith"), "Jane Smith");
    await user.type(
      screen.getByPlaceholderText("coach@example.com"),
      "coach@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("Min. 8 characters"),
      "password123",
    );
    await user.type(
      screen.getByPlaceholderText("Repeat your password"),
      "different123",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));
    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
  });

  it("renders a link to the login page", () => {
    renderRegister();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
