import { describe, it, expect } from "vitest";
import { resolveTrialPlan, TRIAL_DAYS } from "./billing";

const NOW = new Date("2026-06-25T12:00:00Z");
const future = (days: number) => new Date(NOW.getTime() + days * 86_400_000);
const past = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

describe("TRIAL_DAYS", () => {
  it("is 14 (matches the landing-page '14 Hari Gratis' claim)", () => {
    expect(TRIAL_DAYS).toBe(14);
  });
});

describe("resolveTrialPlan", () => {
  it("returns the GROWTH trial tier while the window is open", () => {
    expect(resolveTrialPlan({ trialEndsAt: future(10), trialTier: "GROWTH", now: NOW })).toBe("GROWTH");
  });

  it("returns the PRO trial tier when the signup trialed Pro", () => {
    // Honors "Coba Pro 14 Hari Gratis" — website (Pro-only) unlocks during trial.
    expect(resolveTrialPlan({ trialEndsAt: future(5), trialTier: "PRO", now: NOW })).toBe("PRO");
  });

  it("reverts to FREE once trialEndsAt has passed (lazy auto-revert)", () => {
    expect(resolveTrialPlan({ trialEndsAt: past(1), trialTier: "GROWTH", now: NOW })).toBe("FREE");
    expect(resolveTrialPlan({ trialEndsAt: past(1), trialTier: "PRO", now: NOW })).toBe("FREE");
  });

  it("treats trialEndsAt exactly at now as expired (<=)", () => {
    expect(resolveTrialPlan({ trialEndsAt: NOW, trialTier: "GROWTH", now: NOW })).toBe("FREE");
  });

  it("returns FREE when there is no trial window", () => {
    expect(resolveTrialPlan({ trialEndsAt: null, trialTier: "GROWTH", now: NOW })).toBe("FREE");
    expect(resolveTrialPlan({ trialEndsAt: null, trialTier: null, now: NOW })).toBe("FREE");
  });

  it("defaults an unknown/missing trialTier to GROWTH", () => {
    expect(resolveTrialPlan({ trialEndsAt: future(3), trialTier: null, now: NOW })).toBe("GROWTH");
    expect(resolveTrialPlan({ trialEndsAt: future(3), trialTier: "garbage", now: NOW })).toBe("GROWTH");
  });
});
