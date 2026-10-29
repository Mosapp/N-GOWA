import { describe, expect, it } from "vitest";

import { ESSAIS_AVANT_BLOCAGE, estBloque, hacherPin, verifierPin } from "./parentPin";
import { sauvegardeVide, type EspaceParent } from "./save";

describe("code parent", () => {
  it("vérifie le bon code et bloque après plusieurs erreurs", async () => {
    const sel = "abc";
    let parent: EspaceParent = { ...sauvegardeVide(0).parent, sel, pinHash: await hacherPin("2580", sel) };
    expect((await verifierPin(parent, "2580", 0)).ok).toBe(true);

    for (let i = 0; i < ESSAIS_AVANT_BLOCAGE; i += 1) {
      const r = await verifierPin(parent, "0000", 1000);
      expect(r.ok).toBe(false);
      parent = r.parent;
    }
    expect(estBloque(parent, 2000)).toBe(true);
    expect((await verifierPin(parent, "2580", 2000)).ok).toBe(false);
    expect(estBloque(parent, 1000 + 61 * 1000)).toBe(false);
    expect((await verifierPin(parent, "2580", 1000 + 61 * 1000)).ok).toBe(true);
  });

  it("ne stocke jamais le code en clair", async () => {
    const hash = await hacherPin("1234", "sel");
    expect(hash).not.toContain("1234");
  });
});
