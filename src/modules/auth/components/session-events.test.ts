import { expect, it } from "vitest";
import { sessionPhase } from "./session-events";
it.each([null, {}, "logout", { phase: "committed" }, { type: "session-change", version: 2, phase: "committed" }, { type: "session-change", version: 1, phase: "grant-admin" }])("ignores invalid session hints %j", value => { expect(sessionPhase(value)).toBeNull(); });
it.each(["pending", "committed"])("recognizes invalidation phase %s", phase => { expect(sessionPhase({ type: "session-change", version: 1, phase })).toBe(phase); });
