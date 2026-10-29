"use client";

import type { BacId, Complexite, JeuMission, ObjetATrier } from "@/content/types";
import type { ResultatObjet } from "@/lib/game/rules";

import { NatureGame } from "./NatureGame";
import { RiverGame } from "./RiverGame";
import { SortGame } from "./SortGame";
import { SwitchGame } from "./SwitchGame";

type Props = {
  objets: ObjetATrier[];
  bacs: BacId[];
  complexite: Complexite;
  consigne: string;
  scene: string;
  onFinish: (resultats: ResultatObjet[]) => void;
};

/** Choisit le mini-jeu du monde : mêmes règles, façon de jouer différente. */
export function JeuDeMission({ jeu, ...props }: Props & { jeu?: JeuMission }) {
  if (jeu === "riviere") return <RiverGame {...props} />;
  if (jeu === "nature") return <NatureGame {...props} />;
  if (jeu === "interrupteur") return <SwitchGame {...props} />;
  return <SortGame {...props} />;
}
