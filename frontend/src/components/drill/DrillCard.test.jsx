import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import DrillCard from "./DrillCard.jsx";

// Mock react-router navigation so we can assert it was called
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const BASE_DRILL = {
  id: "drill-1",
  title: "Serve and Receive",
  description: "Basic serve and receive drill",
  duration_minutes: 20,
  num_players_min: 4,
  num_players_max: 8,
  focus_area: "SERVING",
  skill_level: "BEGINNER",
  age_range: "U16",
  likes_count: 5,
  drawing_thumb_url: null,
};

function renderCard(drill = BASE_DRILL) {
  return render(
    <MemoryRouter>
      <DrillCard drill={drill} />
    </MemoryRouter>,
  );
}

describe("DrillCard", () => {
  it("renders the drill title", () => {
    renderCard();
    expect(screen.getByText("Serve and Receive")).toBeInTheDocument();
  });

  it("renders the description", () => {
    renderCard();
    expect(
      screen.getByText("Basic serve and receive drill"),
    ).toBeInTheDocument();
  });

  it("renders duration in minutes", () => {
    renderCard();
    expect(screen.getByText("20 min")).toBeInTheDocument();
  });

  it("renders player range correctly", () => {
    renderCard();
    expect(screen.getByText("4–8 players")).toBeInTheDocument();
  });

  it("renders player min-only as '4+ players'", () => {
    renderCard({ ...BASE_DRILL, num_players_max: null });
    expect(screen.getByText("4+ players")).toBeInTheDocument();
  });

  it("renders player max-only as '≤8 players'", () => {
    renderCard({ ...BASE_DRILL, num_players_min: null });
    expect(screen.getByText("≤8 players")).toBeInTheDocument();
  });

  it("renders the likes count", () => {
    renderCard();
    expect(screen.getByText(/♥\s*5/)).toBeInTheDocument();
  });

  it("does not render likes when count is 0", () => {
    renderCard({ ...BASE_DRILL, likes_count: 0 });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders a thumbnail image when drawing_thumb_url is set", () => {
    renderCard({
      ...BASE_DRILL,
      drawing_thumb_url: "https://example.com/thumb.png",
    });
    const img = screen.getByAltText("Serve and Receive diagram");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/thumb.png");
  });

  it("does not render a thumbnail when drawing_thumb_url is null", () => {
    renderCard();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("navigates to drill detail on click", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByText("Serve and Receive"));
    expect(mockNavigate).toHaveBeenCalledWith("/drills/drill-1");
  });
});
