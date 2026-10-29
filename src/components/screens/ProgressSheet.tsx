"use client";

import { PinBadge } from "@/components/art/PinBadge";
import { Logo } from "@/components/screens/Welcome";
import { IconPrint } from "@/components/icons";
import type { Naviguer } from "@/components/navigation";
import { Avatar, Btn, ScreenHeader } from "@/components/ui";
import { PINS } from "@/content/pins";
import type { CompetenceId } from "@/content/types";
import { COMPETENCES, DEFIS_REELS, MISSIONS, SEUIL_COMPETENCE } from "@/content/village";
import { competenceDemontree, pointsTotal } from "@/lib/game/rules";
import type { Sauvegarde } from "@/lib/game/save";

function dateCourte(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Fiche de progression à montrer à la famille ou à l'éducateur.
 * Informations minimales (surnom, tranche d'âge), aucune donnée publiée.
 * Elle sépare clairement : points de jeu / compétences montrées / gestes réels.
 */
export function ProgressSheet({ save, naviguer }: { save: Sauvegarde; naviguer: Naviguer }) {
  const profil = save.profil!;
  const competences = Object.keys(COMPETENCES) as CompetenceId[];
  const defis = DEFIS_REELS.filter((d) => save.defis[d.id]);
  const declares = defis.filter((d) => save.defis[d.id].statut !== "accepte");
  const valides = defis.filter((d) => save.defis[d.id].statut === "valide");
  const pins = PINS.filter((p) => save.pins[p.id]);

  return (
    <div className="min-h-[100dvh]">
      <div className="no-print">
        <ScreenHeader
          title="Ma fiche"
          onBack={() => naviguer({ nom: "carte" })}
          right={
            <button
              type="button"
              onClick={() => window.print()}
              className="tap-target flex flex-col items-center justify-center rounded-2xl text-ng-muted"
              aria-label="Imprimer la fiche"
            >
              <IconPrint size={26} />
              <span className="text-[11px] font-extrabold">Imprimer</span>
            </button>
          }
        />
      </div>
      <main className="print-sheet card-ng mx-auto mb-10 w-[calc(100%-2rem)] max-w-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <Logo size="sm" />
          <span className="text-sm font-bold text-ng-muted">{dateCourte(new Date().toISOString())}</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Avatar id={profil.avatar} size={64} />
          <div>
            <p className="font-display text-2xl leading-tight">{profil.pseudo}</p>
            <p className="font-bold text-ng-muted">Tranche {profil.tranche} ans</p>
          </div>
        </div>

        {/* 1. Points de jeu */}
        <section className="mt-5">
          <h2 className="font-display text-xl">1. Dans les jeux</h2>
          <p className="font-bold">
            ⭐ {pointsTotal(save)} points · {MISSIONS.filter((m) => save.missions[m.id]?.terminee).length} mission(s)
            terminée(s) sur {MISSIONS.length}
          </p>
          {pins.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {pins.map((p) => (
                <div key={p.id} className="flex items-center gap-1 rounded-2xl bg-ng-cream py-1 pl-1 pr-3">
                  <PinBadge pin={p} obtenu size={36} />
                  <span className="font-display">{p.nom}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* 2. Compétences */}
        <section className="mt-5">
          <h2 className="font-display text-xl">2. Ce que j&apos;ai montré en jouant</h2>
          <ul className="mt-1 grid gap-1">
            {competences.map((id) => {
              const ok = competenceDemontree(save, id);
              const n = Math.min(SEUIL_COMPETENCE, save.competences[id]?.premierCoup ?? 0);
              return (
                <li key={id} className="flex items-center gap-2 font-bold">
                  <span aria-hidden>{ok ? "✅" : "⬜"}</span>
                  <span className={ok ? "" : "text-ng-muted"}>
                    {COMPETENCES[id].nom}
                    {!ok ? ` (${n}/${SEUIL_COMPETENCE})` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-sm font-semibold text-ng-muted">
            Une compétence est « montrée » après {SEUIL_COMPETENCE} bonnes réponses du premier coup.
          </p>
        </section>

        {/* 3. Gestes réels */}
        <section className="mt-5">
          <h2 className="font-display text-xl">3. Mes gestes dans la vraie vie</h2>
          {defis.length ? (
            <ul className="mt-1 grid gap-1">
              {defis.map((d) => {
                const r = save.defis[d.id];
                return (
                  <li key={d.id} className="font-bold">
                    {d.emoji} {d.titre} —{" "}
                    {r.statut === "valide" ? (
                      <span className="text-ng-green-dark">validé par un adulte le {dateCourte(r.valideLe)}</span>
                    ) : r.statut === "declare" ? (
                      <span className="text-ng-earth-dark">fait d&apos;après l&apos;enfant, pas encore validé</span>
                    ) : (
                      <span className="text-ng-muted">accepté, à faire</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="font-semibold text-ng-muted">Pas encore de défi accepté.</p>
          )}
          <p className="mt-1 font-bold">
            {declares.length} défi(s) déclaré(s) par l&apos;enfant · {valides.length} validé(s) par un adulte
          </p>
        </section>

        <p className="mt-5 rounded-2xl bg-ng-cream p-3 text-sm font-semibold text-ng-muted">
          Les points mesurent la réussite dans les jeux. Ils ne prouvent pas, à eux seuls, un changement de
          comportement. Seuls les défis validés par un adulte indiquent un geste réalisé ; une habitude se construit
          dans la durée.
        </p>
      </main>
      <div className="no-print mx-auto max-w-xl px-4 pb-10">
        <Btn variant="white" onClick={() => naviguer({ nom: "carte" })}>
          Retour à la carte
        </Btn>
      </div>
    </div>
  );
}
