import type { ZoneId } from "@/content/types";

export type Route =
  | { nom: "accueil" }
  | { nom: "creation" }
  | { nom: "carte" }
  | { nom: "zone"; zoneId: ZoneId }
  | { nom: "mission"; missionId: string; graine: number }
  | { nom: "pins" }
  | { nom: "defis" }
  | { nom: "parent"; defiId?: string }
  | { nom: "fiche" };

export type Naviguer = (route: Route, options?: { remplacer?: boolean }) => void;
