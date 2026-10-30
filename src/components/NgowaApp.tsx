"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Naviguer, Route } from "@/components/navigation";
import { AdventureMap } from "@/components/screens/AdventureMap";
import { ChallengesScreen } from "@/components/screens/ChallengesScreen";
import { MissionScreen } from "@/components/screens/MissionScreen";
import { Onboarding } from "@/components/screens/Onboarding";
import { ParentSpace } from "@/components/screens/ParentSpace";
import { PinCelebration, PinsScreen } from "@/components/screens/PinsScreen";
import { ProgressSheet } from "@/components/screens/ProgressSheet";
import { Shell } from "@/components/screens/Shell";
import { DayEndScreen, PauseScreen } from "@/components/screens/TimeScreens";
import { Logo, Welcome } from "@/components/screens/Welcome";
import { ZoneScreen } from "@/components/screens/ZoneScreen";
import { arreterAmbiance } from "@/lib/ambiance";
// Écoute tôt l'invitation à installer l'app (envoyée juste après le chargement).
import "@/lib/installation";
import { reglerAudio, stopSpeaking } from "@/lib/audio";
import {
  ajouterTempsActif,
  limitesPour,
  normaliserTemps,
  statutTemps,
} from "@/lib/game/screenTime";
import { synchroniserPins } from "@/lib/game/rules";
import { modifierSauvegarde, useMaintenant, useSauvegarde } from "@/lib/game/store";

const PAS_TEMPS_SEC = 5;

/**
 * Application N'GOWA : navigation entre écrans (avec le bouton retour
 * d'Android), temps d'écran, réglages et mode hors ligne.
 */
export function NgowaApp() {
  const save = useSauvegarde();
  const now = useMaintenant();
  const [route, setRoute] = useState<Route>({ nom: "accueil" });
  const routeRef = useRef(route);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  /* ------------------------------ navigation ------------------------------ */

  const naviguer: Naviguer = useCallback((suivante, options) => {
    stopSpeaking();
    if (options?.remplacer) window.history.replaceState({ route: suivante }, "");
    else window.history.pushState({ route: suivante }, "");
    setRoute(suivante);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    window.history.replaceState({ route: routeRef.current }, "");
    const onPop = (e: PopStateEvent) => {
      stopSpeaking();
      const r = (e.state as { route?: Route } | null)?.route;
      setRoute(r ?? { nom: "carte" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* ------------------------- réglages et hors ligne ----------------------- */

  const sons = save?.reglages.sons ?? true;
  const voix = save?.reglages.voix ?? true;
  const ambiance = save?.reglages.ambiance ?? true;
  const animationsReduites = save?.reglages.animationsReduites ?? false;

  useEffect(() => {
    reglerAudio({ sons, voix, ambiance });
    if (!sons || !ambiance) arreterAmbiance();
  }, [sons, voix, ambiance]);

  // Application en arrière-plan : on coupe l'ambiance.
  useEffect(() => {
    const cacher = () => {
      if (document.hidden) arreterAmbiance();
    };
    document.addEventListener("visibilitychange", cacher);
    return () => document.removeEventListener("visibilitychange", cacher);
  }, []);

  useEffect(() => {
    if (animationsReduites) document.documentElement.dataset.motion = "reduced";
    else delete document.documentElement.dataset.motion;
  }, [animationsReduites]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // Met en cache tout ce que la page a déjà chargé (scripts, polices, images).
        const urls = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((u) => u.startsWith(window.location.origin));
        reg.active?.postMessage({ type: "mettre-en-cache", urls: [...urls, window.location.pathname] });
      })
      .catch(() => {
        /* le jeu reste utilisable en ligne */
      });
  }, []);

  /* ------------------------------ pins à jour ----------------------------- */

  // Si les règles des pins ont changé (seuils ajustés), on les réévalue à
  // l'ouverture : un pin déjà mérité est attribué sans attendre une mission.
  useEffect(() => {
    modifierSauvegarde((s) => (s.profil ? synchroniserPins(s, new Date().toISOString()).save : s));
  }, []);

  /* ----------------------------- temps d'écran ---------------------------- */

  const tranche = save?.profil?.tranche ?? null;

  useEffect(() => {
    if (!tranche) return;
    const limites = limitesPour(tranche);
    const minuterie = window.setInterval(() => {
      const instant = Date.now();
      const visible = document.visibilityState === "visible";
      const ecran = routeRef.current.nom;
      modifierSauvegarde((s) => {
        const t = normaliserTemps(s.temps, instant, limites);
        const etat = statutTemps(t, limites, instant).etat;
        const compte =
          visible &&
          ecran !== "parent" &&
          ecran !== "accueil" &&
          (ecran === "mission" || etat === "libre" || etat === "bientot");
        const suivant = compte ? ajouterTempsActif(t, PAS_TEMPS_SEC, instant) : t;
        return suivant === s.temps ? s : { ...s, temps: suivant };
      });
    }, PAS_TEMPS_SEC * 1000);
    return () => window.clearInterval(minuterie);
  }, [tranche]);

  /* -------------------------------- rendu --------------------------------- */

  if (!save) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4">
        <Logo size="lg" />
        <p className="font-display text-lg text-ng-muted">N&apos;GOWA prépare l&apos;aventure…</p>
      </main>
    );
  }

  const profil = save.profil;

  if (!profil) {
    if (route.nom === "creation") {
      return (
        <Onboarding
          onCancel={() => naviguer({ nom: "accueil" }, { remplacer: true })}
          onDone={(p) => {
            modifierSauvegarde((s) => ({
              ...s,
              profil: { ...p, creeLe: new Date().toISOString() },
              decouverteVue: true,
            }));
            naviguer({ nom: "carte" }, { remplacer: true });
          }}
        />
      );
    }
    return <Welcome pseudo={null} onStart={() => naviguer({ nom: "creation" })} />;
  }

  if (route.nom === "accueil" || route.nom === "creation") {
    return <Welcome pseudo={profil.pseudo} onStart={() => naviguer({ nom: "carte" }, { remplacer: true })} />;
  }

  if (route.nom === "parent") {
    return <ParentSpace save={save} defiId={route.defiId} naviguer={naviguer} now={now} />;
  }

  const limites = limitesPour(profil.tranche);
  const temps = now ? normaliserTemps(save.temps, now, limites) : save.temps;
  const statut = now ? statutTemps(temps, limites, now) : null;
  const versParent = () => naviguer({ nom: "parent" });

  // Une mission commencée se termine toujours (conclusion naturelle).
  if (route.nom === "mission") {
    return (
      <MissionScreen
        key={`${route.missionId}-${route.graine}`}
        save={save}
        missionId={route.missionId}
        graine={route.graine}
        naviguer={naviguer}
        statut={statut}
      />
    );
  }

  // La fiche reste consultable pendant une pause : c'est un moment à partager en famille.
  if (route.nom === "fiche") return <ProgressSheet save={save} naviguer={naviguer} />;

  if (statut?.etat === "fin-journee") return <DayEndScreen pseudo={profil.pseudo} onParent={versParent} />;
  if (save.temps.pauseDebut !== null || statut?.etat === "pause-due") {
    return <PauseScreen temps={temps} limites={limites} now={now} onParent={versParent} />;
  }

  const pinsNonVus = Object.entries(save.pins)
    .filter(([, p]) => !p.vu)
    .map(([id]) => id);

  return (
    <Shell save={save} route={route} naviguer={naviguer} statut={statut}>
      {route.nom === "carte" ? <AdventureMap save={save} naviguer={naviguer} now={now} /> : null}
      {route.nom === "zone" ? (
        <ZoneScreen save={save} zoneId={route.zoneId} naviguer={naviguer} statut={statut} />
      ) : null}
      {route.nom === "pins" ? <PinsScreen save={save} /> : null}
      {route.nom === "defis" ? <ChallengesScreen save={save} naviguer={naviguer} /> : null}
      {pinsNonVus.length ? <PinCelebration pinIds={pinsNonVus} /> : null}
    </Shell>
  );
}
