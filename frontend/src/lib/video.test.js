import { describe, expect, it } from "vitest";
import { getEmbedUrl } from "./video.js";

describe("getEmbedUrl", () => {
  it("returns null for falsy input", () => {
    expect(getEmbedUrl(null)).toBeNull();
    expect(getEmbedUrl("")).toBeNull();
    expect(getEmbedUrl(undefined)).toBeNull();
  });

  it("converts a youtube.com watch URL", () => {
    expect(getEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("converts a youtu.be short URL", () => {
    expect(getEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("passes through an already-embed YouTube URL", () => {
    expect(getEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("converts a vimeo.com URL", () => {
    expect(getEmbedUrl("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789",
    );
  });

  it("converts a vimeo.com/video/ URL", () => {
    expect(getEmbedUrl("https://vimeo.com/video/123456789")).toBe(
      "https://player.vimeo.com/video/123456789",
    );
  });

  it("returns null for an unrecognised URL", () => {
    expect(getEmbedUrl("https://example.com/video")).toBeNull();
  });
});
