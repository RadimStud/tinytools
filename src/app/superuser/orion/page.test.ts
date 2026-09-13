import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VaultError } from "@/modules/superuser/domain/vault";
import { services } from "@/server/services";
import OrionLaunchPage from "./page";

vi.mock("@/server/services", () => ({ services: { vault: { requireUser: vi.fn() } } }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));

describe("superuser ORION entry", () => {
  beforeEach(() => {
    vi.mocked(services.vault.requireUser).mockReset();
    vi.stubEnv("ORION_WEB_URL", "https://orion.example.com");
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([[401, "/login"], [403, "/dashboard"]])("denies status %s before exposing the destination", async (status, path) => {
    vi.mocked(services.vault.requireUser).mockRejectedValue(new VaultError("Denied", status));
    await expect(OrionLaunchPage()).rejects.toThrow(`REDIRECT:${path}`);
  });

  it("launches only after the database superuser check", async () => {
    await expect(OrionLaunchPage()).rejects.toThrow("REDIRECT:https://orion.example.com/");
    expect(services.vault.requireUser).toHaveBeenCalledOnce();
  });

  it("fails closed when the authorization backend fails", async () => {
    vi.mocked(services.vault.requireUser).mockRejectedValue(new Error("Database unavailable"));
    await expect(OrionLaunchPage()).rejects.toThrow("Database unavailable");
  });

  it("shows an honest unavailable state without a configured deployment", async () => {
    vi.stubEnv("ORION_WEB_URL", "");
    const html = renderToStaticMarkup(await OrionLaunchPage());
    expect(html).toContain("ORION is not online yet.");
    expect(html).not.toContain("orion.example.com");
  });
});
