import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PageTransition from "./PageTransition";

// useRouterState is called with a selector; the mock ignores it and returns a path.
vi.mock("@tanstack/react-router", () => ({
  useRouterState: () => "/tasks",
}));

let reduceMotion = false;
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return { ...actual, useReducedMotion: () => reduceMotion };
});

afterEach(() => {
  reduceMotion = false;
});

describe("PageTransition", () => {
  it("renders its children inside the animated wrapper", () => {
    render(
      <PageTransition>
        <p>page body</p>
      </PageTransition>,
    );
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it("renders children directly when reduced motion is preferred", () => {
    reduceMotion = true;
    render(
      <PageTransition>
        <p>plain body</p>
      </PageTransition>,
    );
    expect(screen.getByText("plain body")).toBeInTheDocument();
  });
});
