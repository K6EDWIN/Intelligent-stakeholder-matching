import { describe, expect, it } from "vitest";
import { profilePathForRole } from "@/lib/profile-navigation";

describe("profile navigation", () => {
  it("opens the administrator profile as a separate admin route", () => {
    expect(profilePathForRole("ADMIN")).toBe("/admin/profile");
  });

  it("uses the member profile route for regular accounts", () => {
    expect(profilePathForRole("STAFF")).toBe("/profile");
    expect(profilePathForRole(undefined)).toBe("/profile");
  });
});
