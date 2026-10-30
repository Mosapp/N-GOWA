"use client";

import { useEffect, useMemo, useState } from "react";

import { PinBadge } from "@/components/art/PinBadge";
import { JeuDeMission } from "@/components/game/JeuDeMission";
import { FinDeMonde } from "@/components/screens/FinDeMonde";
import { IconClose } from "@/components/icons";
import type { Naviguer } from "@/components/navigation";
import {
  Btn,
  CharacterMedallion,
  Confetti,
  Illustration,
  Mascot,
  ProgressBar,
  Sheet,
  SpeechBubble,
  Stars,
  useDireAuMontage,
} from "@/components/ui";
import { SECONDARY_CHARACTERS } from "@/content/characters";
import { PIN_BY_ID } from "@/content/pins";
import type { QuestionMission, ZoneId } from "@/content/types";
import { BACS, COMPETENCES, DEFI_BY_ID, MISSION_BY_ID, vignetteDe } from "@/content/village";
import {
  accepterDefi,
  aleatoire,
  appliquerResultat,
  complexitePour,
  marquerPinsVus,
  melanger,
  progressionZone,
  selectionnerObjets,
  type BilanMission,
  type ResultatObjet,
} from "@/lib/game/rules";
import type { Sauvegarde } from "@/lib/game/save";
import type { StatutTemps } from "@/lib/game/screenTime";
import { modifierSauvegarde } from "@/lib/game/store";
import { arreterAmbiance, lancerAmbiance } from "@/lib/ambiance";
import { playTone, speak, stopSpeaking } from "@/lib/audio";

type Phase = "intro" | "jeu" | "question" | "resultat" | "monde" | "defi";

/**
 * Déroulé d'une mission : histoire → mini-jeu → question (6-10 ans) →
 * résultat expliqué, points et pins → défi du vrai monde.
 */
export function MissionScreen({
  save,
  missionId,
  graine,
  naviguer,
  statut,
}: {
  save: Sauvegarde;
  missionId: string;
  graine: number;
  naviguer: Naviguer;
  statut: StatutTemps | null;
}) {
  const mission = MISSION_BY_ID[missionId];
  const profil = save.profil!;
  const complexite = complexitePour(profil.tranche);
  const objets = useMemo(
    () => (mission ? selectionnerObjets(mission, complexite, graine) : []),
    [mission, complexite, graine],
  );
  const [phase, setPhase] = useState<Phase>("intro");
  const [resultats, setResultats] = useState<ResultatObjet[]>([]);
  const [bilan, setBilan] = useState<BilanMission | null>(null);
  const [quitter, setQuitter] = useState(false);
  // Bruits du monde pendant le jeu seulement (pas pendant l'histoire ni la voix du résultat).
  const zoneJeu = phase === "jeu" && mission ? mission.zoneId : null;
  useEffect(() => {
    if (zoneJeu) lancerAmbiance(zoneJeu);
    else arreterAmbiance();
    return () => arreterAmbiance();
  }, [zoneJeu]);
  /** Monde terminé pour la première fois avec cette mission : on fait la fête. */
  const [mondeFini, setMondeFini] = useState<ZoneId | null>(null);

  if (!mission) return null;
  const perso = SECONDARY_CHARACTERS[mission.personnageId];
  const retourZone = () => {
    stopSpeaking();
    naviguer({ nom: "zone", zoneId: mission.zoneId }, { remplacer: true });
  };

  const terminer = (objetsJoues: ResultatObjet[], questionReussie: boolean | null) => {
    let calcul: BilanMission | null = null;
    let fini = false;
    modifierSauvegarde((s) => {
      calcul = appliquerResultat(s, { missionId, objets: objetsJoues, questionReussie }, new Date().toISOString());
      const avant = progressionZone(s, mission.zoneId);
      const apres = progressionZone(calcul.save, mission.zoneId);
      fini = avant.terminees < avant.total && apres.terminees === apres.total;
      return calcul.save;
    });
    setBilan(calcul);
    setMondeFini(fini ? mission.zoneId : null);
    setPhase("resultat");
  };

  const avancement =
    phase === "intro" ? 0.05 : phase === "jeu" ? 0.35 : phase === "question" ? 0.75 : 1;

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-3">
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (phase === "resultat" || phase === "monde" || phase === "defi" ? retourZone() : setQuitter(true))}
          className="tap-target flex items-center justify-center rounded-2xl bg-white text-ng-muted shadow-[0_3px_0_rgba(45,42,38,0.1)]"
          aria-label="Quitter la mission"
        >
          <IconClose size={28} />
        </button>
        <div className="flex-1">
          <ProgressBar value={avancement} max={1} color="bg-ng-green" label="avancement de la mission" />
        </div>
      </div>

      {phase === "intro" ? (
        <Intro
          titre={mission.titre}
          histoire={mission.histoire.petit}
          histoireVoix={mission.histoire[complexite]}
          personnage={mission.personnageId}
          nomPerso={perso?.nom ?? ""}
          bacs={mission.bacs[complexite].map((b) => BACS[b].nom)}
          vignette={vignetteDe(mission)}
          onPlay={() => setPhase("jeu")}
        />
      ) : null}

      {phase === "jeu" ? (
        <JeuDeMission
          jeu={mission.jeu}
          objets={objets}
          bacs={mission.bacs[complexite]}
          complexite={complexite}
          consigne={mission.consigne[complexite]}
          scene={mission.scene ?? vignetteDe(mission)}
          onFinish={(r) => {
            setResultats(r);
            if (complexite === "grand") setPhase("question");
            else terminer(r, null);
          }}
        />
      ) : null}

      {phase === "question" ? (
        <Question
          question={mission.question}
          graine={graine}
          onDone={(reussie) => terminer(resultats, reussie)}
        />
      ) : null}

      {phase === "resultat" && bilan ? (
        <Resultat
          bilan={bilan}
          resultats={resultats}
          pourquoi={mission.objectif.pourquoi}
          tempsFini={statut?.etat === "pause-due" || statut?.etat === "fin-journee"}
          onContinue={() => {
            modifierSauvegarde(marquerPinsVus);
            if (mondeFini) setPhase("monde");
            else if (save.defis[mission.defiId]) retourZone();
            else setPhase("defi");
          }}
        />
      ) : null}

      {phase === "monde" && mondeFini ? (
        <FinDeMonde
          zoneId={mondeFini}
          onContinue={() => (save.defis[mission.defiId] ? retourZone() : setPhase("defi"))}
        />
      ) : null}

      {phase === "defi" ? (
        <DefiPropose
          defiId={mission.defiId}
          petit={complexite === "petit"}
          onAccept={() => {
            modifierSauvegarde((s) => accepterDefi(s, mission.defiId, new Date().toISOString()));
            playTone("win");
            retourZone();
          }}
          onLater={retourZone}
        />
      ) : null}

      {quitter ? (
        <Sheet label="Quitter la mission ?" onClose={() => setQuitter(false)}>
          <div className="flex items-center gap-3">
            <Mascot id="kofi" pose="reflechit" size={110} />
            <h2 className="font-display text-2xl leading-tight">Tu veux t&apos;arrêter là ?</h2>
          </div>
          <p className="mt-3 font-bold text-ng-muted">
            Pas de souci ! Cette partie ne sera pas gardée, mais tu pourras la refaire quand tu veux.
          </p>
          <div className="mt-5 grid gap-2">
            <Btn onClick={() => setQuitter(false)}>Continuer à jouer</Btn>
            <Btn variant="white" onClick={retourZone}>
              Quitter la mission
            </Btn>
          </div>
        </Sheet>
      ) : null}
    </main>
  );
}

/* --------------------------------- Intro ---------------------------------- */

function Intro({
  titre,
  histoire,
  histoireVoix,
  personnage,
  nomPerso,
  bacs,
  vignette,
  onPlay,
}: {
  vignette: string;
  titre: string;
  /** Texte court affiché. */
  histoire: string;
  /** Version lue à voix haute (plus détaillée pour les 6-10 ans). */
  histoireVoix: string;
  personnage: string;
  nomPerso: string;
  bacs: string[];
  onPlay: () => void;
}) {
  useDireAuMontage(histoireVoix);
  return (
    <section className="anim-rise flex min-h-[calc(100dvh-100px)] flex-col">
      <div className="relative overflow-hidden rounded-[2rem] shadow-lg">
        <Illustration src={vignette} ratio="16 / 9" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ng-ink/70 to-transparent px-4 pb-3 pt-10">
          <h1 className="font-display text-2xl leading-tight text-white sm:text-3xl">{titre}</h1>
        </div>
      </div>
      <div className="-mt-6 flex items-end justify-between gap-3 px-2">
        <CharacterMedallion id={personnage} size={84} />
        <Mascot id="kofi" pose="montre" size={130} />
      </div>
      <div className="mt-4">
        <SpeechBubble qui={nomPerso} texteVoix={histoireVoix}>
          <p>{histoire}</p>
        </SpeechBubble>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Les choix de cette mission">
        {bacs.map((b) => (
          <span key={b} className="rounded-full bg-white px-3 py-1 font-display text-base shadow-[0_2px_0_rgba(45,42,38,0.08)]">
            {b}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-6">
        <Btn size="lg" sound="pop" onClick={onPlay}>
          Je suis prêt·e !
        </Btn>
      </div>
    </section>
  );
}

/* -------------------------------- Question -------------------------------- */

function Question({
  question,
  graine,
  onDone,
}: {
  question: QuestionMission;
  graine: number;
  onDone: (reussieDuPremierCoup: boolean) => void;
}) {
  const reponses = useMemo(() => melanger(question.reponses, aleatoire(graine + 7)), [question, graine]);
  const [ecartees, setEcartees] = useState<string[]>([]);
  const [trouvee, setTrouvee] = useState(false);
  useDireAuMontage(question.question);

  const choisir = (r: string) => {
    if (trouvee || ecartees.includes(r)) return;
    if (r === question.bonneReponse) {
      setTrouvee(true);
      playTone("good");
      speak(`Exact ! ${question.explication}`);
    } else {
      setEcartees((e) => [...e, r]);
      playTone("bad");
      speak("Pas tout à fait. Réfléchis encore, tu vas trouver !");
    }
  };

  return (
    <section className="anim-rise">
      <div className="flex items-center gap-3">
        <Mascot id="awa" pose="explique" size={110} />
        <div className="flex-1">
          <SpeechBubble qui="La question d'Awa" color="#7A4BC0" texteVoix={question.question}>
            <p>{question.question}</p>
          </SpeechBubble>
        </div>
      </div>
      <div className="mt-5 grid gap-3" aria-live="polite">
        {reponses.map((r) => {
          const ecartee = ecartees.includes(r);
          const bonne = trouvee && r === question.bonneReponse;
          return (
            <button
              key={r}
              type="button"
              disabled={ecartee || trouvee}
              onClick={() => choisir(r)}
              className={`btn-ng min-h-[64px] justify-start px-4 text-left text-lg ${
                bonne
                  ? "bg-ng-green text-white"
                  : ecartee
                    ? "anim-shake bg-white text-ng-muted line-through"
                    : "border-2 border-b-[6px] border-ng-ink/15 bg-white text-ng-ink"
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>
      {ecartees.length && !trouvee ? (
        <p className="anim-pop mt-4 rounded-2xl bg-ng-sun-soft p-3 font-display text-lg">
          Pas tout à fait. Réfléchis encore, tu vas trouver !
        </p>
      ) : null}
      {trouvee ? (
        <div className="anim-rise mt-4 rounded-3xl bg-ng-leaf-soft p-4">
          <p className="font-display text-2xl text-ng-green-dark">Exact !</p>
          <p className="mt-1 font-bold">{question.explication}</p>
          <div className="mt-4">
            <Btn size="lg" sound="none" onClick={() => onDone(ecartees.length === 0)}>
              Voir mon résultat
            </Btn>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* -------------------------------- Résultat -------------------------------- */

function Resultat({
  bilan,
  resultats,
  pourquoi,
  tempsFini,
  onContinue,
}: {
  bilan: BilanMission;
  resultats: ResultatObjet[];
  pourquoi: string;
  tempsFini: boolean;
  onContinue: () => void;
}) {
  const premierCoup = resultats.filter((r) => r.essais === 1).length;
  const perseverance = resultats.length - premierCoup;
  // Le message est dit à voix haute ; à l'écran, on garde l'essentiel.
  const message =
    bilan.etoiles === 3
      ? `Mission réussie ! Tu es un vrai champion de la nature. ${pourquoi}`
      : perseverance > 0
        ? `Mission réussie ! Tu n'as pas abandonné, bravo. ${pourquoi}`
        : `Mission réussie, bravo ! ${pourquoi}`;
  useDireAuMontage(message);

  return (
    <section className="anim-rise flex flex-col items-center text-center">
      {bilan.nouveauxPins.length ? <Confetti /> : null}
      <Mascot id="kofi" size={150} humeur="joie" />
      <Stars count={bilan.etoiles} size={46} />
      <h1 className="mt-2 font-display text-3xl">Mission réussie !</h1>

      <div className="mt-4 flex w-full items-stretch justify-center gap-3">
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-ng-sun-soft p-3">
          <p className="font-display text-3xl">+{bilan.points}</p>
          <p className="font-display text-sm text-ng-muted">points</p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-ng-leaf-soft p-3" aria-label={`${premierCoup} du premier coup`}>
          <p className="font-display text-3xl text-ng-green">✓ {premierCoup}</p>
          <p className="font-display text-sm text-ng-muted">du 1er coup</p>
        </div>
        {perseverance ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-white p-3" aria-label={`${perseverance} en réessayant`}>
            <p className="font-display text-3xl text-ng-earth">↻ {perseverance}</p>
            <p className="font-display text-sm text-ng-muted">en réessayant</p>
          </div>
        ) : null}
      </div>

      {bilan.competencesDemontrees.length ? (
        <div className="mt-3 w-full rounded-3xl bg-ng-leaf-soft p-4 text-left">
          <p className="font-display text-lg text-ng-green-dark">Nouvelle compétence montrée !</p>
          {bilan.competencesDemontrees.map((c) => (
            <p key={c} className="mt-1 font-bold">
              {COMPETENCES[c].emoji} {COMPETENCES[c].nom}
            </p>
          ))}
        </div>
      ) : null}

      {bilan.nouveauxPins.map((id) => {
        const pin = PIN_BY_ID[id];
        return (
          <div key={id} className="anim-pop mt-4 flex w-full items-center gap-3 rounded-3xl border-4 border-ng-yellow bg-white p-3 text-left">
            <PinBadge pin={pin} obtenu size={84} />
            <div>
              <p className="font-display text-base text-ng-yellow-dark">Nouveau pin !</p>
              <p className="font-display text-2xl leading-tight">{pin.nom}</p>
              <p className="font-bold text-ng-muted">{pin.description}</p>
            </div>
          </div>
        );
      })}

      {tempsFini ? (
        <p className="mt-4 w-full rounded-2xl bg-ng-water-soft p-3 font-display text-lg">
          🌅 C&apos;est l&apos;heure de la pause !
        </p>
      ) : null}

      <div className="mt-5 w-full">
        <Btn size="lg" onClick={onContinue}>
          Continuer
        </Btn>
      </div>
    </section>
  );
}

/* ---------------------------- Défi du vrai monde -------------------------- */

function DefiPropose({
  defiId,
  petit,
  onAccept,
  onLater,
}: {
  defiId: string;
  petit: boolean;
  onAccept: () => void;
  onLater: () => void;
}) {
  const defi = DEFI_BY_ID[defiId];
  const consigne = defi.consigne[petit ? "petit" : "grand"];
  useDireAuMontage(`Défi du vrai monde. ${consigne} ${defi.pourquoi}`);
  return (
    <section className="anim-rise flex flex-col items-center text-center">
      <Mascot id="awa" pose="explique" size={170} />
      <p className="mt-2 rounded-full bg-ng-green px-4 py-1 font-display text-base text-white">Défi du vrai monde</p>
      <h1 className="mt-2 font-display text-3xl leading-tight">
        <span aria-hidden>{defi.emoji} </span>
        {defi.titre}
      </h1>
      <div className="mt-4 w-full text-left">
        <SpeechBubble qui="Awa" color="#7A4BC0" texteVoix={consigne} size="lg">
          <p>{consigne}</p>
        </SpeechBubble>
      </div>
      <p className="mt-3 w-full rounded-2xl bg-ng-coral-soft px-4 py-2 text-left font-bold text-ng-coral-dark">
        ⚠️ {defi.securite}
      </p>
      <div className="mt-5 grid w-full gap-2">
        <Btn size="lg" sound="none" onClick={onAccept}>
          Je relève le défi !
        </Btn>
        <Btn variant="white" onClick={onLater}>
          Plus tard
        </Btn>
      </div>
    </section>
  );
}
