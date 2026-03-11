import { describe, expect, it } from "vitest";
import api from "./api.js";

describe("api (Axios instance)", () => {
  it("has an empty baseURL so all requests are same-origin", () => {
    expect(api.defaults.baseURL).toBe("");
  });

  it("sends credentials (cookies) with every request", () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("defaults to JSON content type", () => {
    // Axios stores common headers under defaults.headers.common or the method key
    const headers = api.defaults.headers;
    const contentType =
      headers["Content-Type"] ??
      headers.common?.["Content-Type"] ??
      headers.post?.["Content-Type"];
    expect(contentType).toBe("application/json");
  });

  it("has a response interceptor registered", () => {
    // Axios attaches interceptors to the handlers array
    expect(api.interceptors.response.handlers.length).toBeGreaterThan(0);
  });
});
