"use client";

import { useMemo, useState } from "react";

import { MiniGame } from "@/components/games";
import { Logo } from "@/components/Onboarding";
import {
  Btn,
  Chip,
  Mascot,
  ProgressBar,
  SectionTitle,
  SpeechBubble,
} from "@/components/ui";
import { AVATARS } from "@/content/badges";
import { LESSONS, PALIERS, THEME_BY_ID, THEMES, VOCAB } from "@/content/curriculum";
import { buildBlueprint } from "@/lib/ngowa";
import { playTone, speak } from "@/lib/audio";
import type { AppState } from "@/lib/types";
import type { ThemeId } from "@/content/types";

export type Tab = "accueil" | "aventure" | "apprendre" | "jouer" | "recompenses" | "profil";

function avatarEmoji(id: string) {
  return AVATARS.find((a) => a.id === id)?.emoji ?? "👦🏿";
}

function Header({ state, onNavigate }: { state: AppState; onNavigate: (tab: Tab) => void }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 border-b-3 border-ng-ink/5 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate("profil")}
          className="tap-target flex h-12 w-12 items-center justify-center rounded-2xl border-3 border-ng-ink/10 bg-ng-yellow text-2xl"
          aria-label="Mon profil"
        >
          {avatarEmoji(state.profile.avatar)}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight">
            Bonjour {state.profile.pseudo} !
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ng-ink/45">
            {state.grade.emoji} {state.grade.nom}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#FFF8DC] px-3 py-1 font-display text-sm">
            ⭐ {state.profile.points}
          </span>
          <button
            type="button"
            onClick={() => onNavigate("recompenses")}
            className="tap-target rounded-full bg-[#FAEEFF] px-3 py-1 font-display text-sm"
            aria-label="Mes récompenses"
          >
            🏅 {state.badges.filter((b) => b.obtenu).length}/{state.badges.length}
          </button>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------- ACCUEIL -------------------------------- */

export function HomeView({
  state,
  onNavigate,
  onStartMission,
}: {
  state: AppState;
  onNavigate: (tab: Tab) => void;
  onStartMission: () => void;
}) {
  const currentLevel = state.levels.find((l) => l.numero === state.profile.niveau);
  const theme = currentLevel ? THEME_BY_ID[currentLevel.themeId] : THEMES[0];
  const palier = PALIERS.find((p) => p.id === (currentLevel?.palier ?? "decouverte"));
  const gradeProgress = state.nextGrade
    ? Math.min(
        100,
        Math.round(
          ((state.profile.niveau - state.grade.min) /
            Math.max(1, state.nextGrade.min - state.grade.min)) *
            100,
        ),
      )
    : 100;
  const motDuJour = VOCAB[state.profile.niveau % VOCAB.length];
  const minutesJour = Math.round(state.screenTime.tempsUtilise / 60);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-3">
      <Header state={state} onNavigate={onNavigate} />

      <section className="relative overflow-hidden rounded-[2.5rem] border-3 border-ng-ink/10 bg-white p-5 shadow-[0_12px_0_rgba(43,43,58,0.07)]">
        <div
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
          style={{ background: theme.couleur }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <Chip color="bg-ng-ink text-white">Niveau {state.profile.niveau}</Chip>
            <h2 className="mt-2 font-display text-2xl leading-tight">
              Mission « {currentLevel?.titre ?? "Nouvelle aventure"} »
            </h2>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-ng-ink/60">
              <span className="text-xl">{theme.icone}</span>
              {theme.nom} · {palier?.verbe}
            </p>
          </div>
          <Mascot id="kofi" size={110} />
        </div>

        <div className="relative mt-4">
          <div className="mb-1 flex justify-between font-display text-xs uppercase text-ng-ink/50">
            <span>Progression de l&apos;aventure</span>
            <span>{Math.min(100, Math.round((state.profile.niveau / 31) * 100))}%</span>
          </div>
          <ProgressBar
            value={state.profile.niveau}
            max={31}
            color="bg-ng-green"
            label="progression globale"
          />
        </div>

        <div className="relative mt-5">
          <Btn size="lg" onClick={onStartMission} sound="pop">
            Commencer la mission
          </Btn>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card-soft p-4">
          <p className="font-display text-xs uppercase text-ng-ink/50">Mes points</p>
          <p className="font-display text-2xl text-ng-orange">⭐ {state.profile.points}</p>
          <p className="mt-1 text-xs font-bold text-ng-ink/50">
            {state.profile.missionsRealisees} missions terminées
          </p>
        </div>
        <div className="card-soft p-4">
          <p className="font-display text-xs uppercase text-ng-ink/50">Mon grade</p>
          <p className="font-display text-lg leading-tight">
            {state.grade.emoji} {state.grade.nom}
          </p>
          <div className="mt-2">
            <ProgressBar value={gradeProgress} color="bg-ng-purple" height="h-2.5" />
          </div>
          {state.nextGrade ? (
            <p className="mt-1 text-[11px] font-bold text-ng-ink/50">
              Prochain : {state.nextGrade.nom} au niveau {state.nextGrade.min}
            </p>
          ) : (
            <p className="mt-1 text-[11px] font-bold text-ng-purple">
              Grade maximum atteint !
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <button
          type="button"
          onClick={() => onNavigate("jouer")}
          className="card-soft flex items-center gap-4 p-4 text-left"
        >
          <span className="text-4xl">🎮</span>
          <span className="flex-1">
            <span className="block font-display text-lg">Jouer librement</span>
            <span className="block text-xs font-bold text-ng-ink/50">
              Entraîne-toi aux 4 mini-jeux sans perdre de points
            </span>
          </span>
          <span className="font-display text-2xl text-ng-ink/25">›</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("apprendre")}
          className="card-soft flex items-center gap-4 p-4 text-left"
        >
          <span className="text-4xl">🗣️</span>
          <span className="flex-1">
            <span className="block font-display text-lg">EcoLangues du jour</span>
            <span className="block text-xs font-bold text-ng-ink/50">
              {motDuJour.emoji} {motDuJour.motFr} — {motDuJour.phraseFr}
            </span>
          </span>
          <span className="font-display text-2xl text-ng-ink/25">›</span>
        </button>

        <div className="card-soft p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm uppercase text-ng-ink/50">
              Temps N&apos;GOWA aujourd&apos;hui
            </p>
            <span className="font-display text-sm">
              {minutesJour} / {Math.round(state.screenTime.limiteJour / 60)} min
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar
              value={state.screenTime.tempsUtilise}
              max={state.screenTime.limiteJour}
              color="bg-ng-blue"
              height="h-3"
            />
          </div>
          <p className="mt-2 text-[11px] font-bold text-ng-ink/40">
            Session de {Math.round(state.screenTime.limiteSession / 60)} min puis pause
            de 10 min — pour jouer dehors aussi !
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- AVENTURE -------------------------------- */

export function PathView({
  state,
  onNavigate,
  onStartMission,
}: {
  state: AppState;
  onNavigate: (tab: Tab) => void;
  onStartMission: (levelId: number) => void;
}) {
  const maxVisible = Math.min(31, Math.max(state.profile.niveau + 5, 10));
  const nodes = Array.from({ length: maxVisible }, (_, i) => i + 1);
  const levelsByNumero = new Map(state.levels.map((l) => [l.numero, l]));

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-3">
      <Header state={state} onNavigate={onNavigate} />
      <SectionTitle
        title="Mon aventure"
        emoji="🗺️"
        subtitle="Une seule progression à travers les 4 mondes"
      />

      <div className="relative">
        <div className="dashed-path absolute top-0 bottom-0 left-1/2 w-1 -translate-x-1/2" />
        <ol className="relative space-y-4">
          {nodes.map((numero, index) => {
            const level = levelsByNumero.get(numero);
            const theme = level ? THEME_BY_ID[level.themeId] : null;
            const statut = level?.statut ?? "LOCKED";
            const isCurrent = numero === state.profile.niveau;
            const palier = PALIERS.find(
              (p) =>
                p.id ===
                (numero <= 5
                  ? "decouverte"
                  : numero <= 10
                    ? "comprehension"
                    : numero <= 20
                      ? "application"
                      : "maitrise"),
            );
            const showBanner = numero === 1 || [6, 11, 21].includes(numero);
            const offset = index % 2 === 0 ? "mr-auto ml-4" : "ml-auto mr-4";

            return (
              <li key={numero}>
                {showBanner ? (
                  <div className="mb-4 flex justify-center">
                    <span className="kente-soft rounded-full px-4 py-1 font-display text-[11px] uppercase tracking-widest text-ng-ink/70">
                      {palier?.nom} · niveaux {palier?.id === "decouverte" ? "1-5" : palier?.id === "comprehension" ? "6-10" : palier?.id === "application" ? "11-20" : "21+"}
                    </span>
                  </div>
                ) : null}
                <div className={`flex w-[86%] ${offset}`}>
                  <button
                    type="button"
                    disabled={statut !== "IN_PROGRESS"}
                    onClick={() => {
                      if (statut === "IN_PROGRESS" && level) {
                        playTone("pop");
                        onStartMission(level.id);
                      }
                    }}
                    className={`btn3d flex w-full items-center gap-3 px-4 py-3 text-left normal-case ${
                      statut === "COMPLETED"
                        ? "border-ng-green-dark bg-[#E8F8DC]"
                        : statut === "IN_PROGRESS"
                          ? "anim-float border-ng-orange-dark bg-ng-yellow"
                          : "border-ng-ink/10 bg-white/70"
                    }`}
                  >
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                      style={{
                        background: theme ? `${theme.couleur}33` : "#EDEDF2",
                      }}
                    >
                      {theme ? theme.icone : "❓"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-xs uppercase tracking-wide text-ng-ink/45">
                        Niveau {numero}
                        {theme ? ` · ${theme.categorie}` : " · mystère"}
                      </span>
                      <span className="block truncate font-display text-base leading-tight">
                        {level ? level.titre : "À découvrir…"}
                      </span>
                    </span>
                    <span className="text-xl">
                      {statut === "COMPLETED" ? "✅" : statut === "IN_PROGRESS" ? "▶️" : "🔒"}
                    </span>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-6 text-center text-xs font-bold text-ng-ink/40">
        Les mondes changent à chaque partie : tu ne rencontres presque jamais deux
        fois la même mission !
      </p>
    </div>
  );
}

/* ------------------------------- APPRENDRE -------------------------------- */

export function LearnView({
  state,
  onNavigate,
}: {
  state: AppState;
  onNavigate: (tab: Tab) => void;
}) {
  const [tab, setTab] = useState<"lecons" | "ecolangues">("lecons");
  const [revealed, setRevealed] = useState<string[]>([]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-3">
      <Header state={state} onNavigate={onNavigate} />
      <SectionTitle
        title="Apprendre"
        emoji="📚"
        subtitle="Relis les leçons et écoute les mots"
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Btn
          variant={tab === "lecons" ? "green" : "white"}
          onClick={() => setTab("lecons")}
        >
          Leçons
        </Btn>
        <Btn
          variant={tab === "ecolangues" ? "purple" : "white"}
          onClick={() => setTab("ecolangues")}
        >
          EcoLangues
        </Btn>
      </div>

      {tab === "lecons" ? (
        <div className="space-y-5">
          {THEMES.map((theme) => (
            <div key={theme.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl">{theme.icone}</span>
                <h3 className="font-display text-lg" style={{ color: theme.couleur }}>
                  {theme.nom}
                </h3>
              </div>
              <div className="space-y-2">
                {LESSONS.filter((l) => l.themeId === theme.id).map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} couleur={theme.couleur} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-4 rounded-3xl border-3 border-ng-purple/25 bg-[#FAEEFF] p-4">
            <p className="font-display text-sm">
              🗣️ EcoLangues — le français et une langue de chez nous, ensemble.
            </p>
            <p className="mt-1 text-xs font-bold text-ng-ink/50">
              Les traductions sont en cours de validation par des locuteurs natifs.
              Le baoulé, le bété et d&apos;autres langues arriveront ensuite.
            </p>
          </div>
          <div className="grid gap-3">
            {VOCAB.map((word) => {
              const open = revealed.includes(word.id);
              return (
                <div key={word.id} className="card-soft p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{word.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg leading-tight">{word.motFr}</p>
                      <p className="text-xs font-bold text-ng-ink/50">
                        {word.phraseFr}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speak(`${word.motFr}. ${word.phraseFr}`)}
                      className="tap-target rounded-2xl bg-[#E3F5FF] px-3 py-2 font-display text-xs"
                      aria-label={`Écouter ${word.motFr}`}
                    >
                      🔊 FR
                    </button>
                  </div>
                  <div className="mt-3">
                    {open ? (
                      <p className="anim-pop font-display text-xl text-ng-purple-dark">
                        {word.dioula ?? "—"}
                      </p>
                    ) : (
                      <Btn
                        variant="purple"
                        size="sm"
                        onClick={() => {
                          setRevealed((prev) => [...prev, word.id]);
                          if (word.dioula) speak(word.dioula, 0.8);
                        }}
                      >
                        Voir en dioula
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LessonCard({
  lesson,
  couleur,
}: {
  lesson: (typeof LESSONS)[number];
  couleur: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-soft overflow-hidden">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) speak(lesson.titre);
        }}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{ background: `${couleur}22` }}
        >
          {lesson.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base leading-tight">
            {lesson.titre}
          </span>
          <span className="block text-[11px] font-bold uppercase text-ng-ink/40">
            {lesson.palier === "decouverte"
              ? "Découvrir"
              : lesson.palier === "comprehension"
                ? "Comprendre"
                : lesson.palier === "application"
                  ? "Agir"
                  : "Maîtrise"}
          </span>
        </span>
        <span className="font-display text-xl text-ng-ink/25">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <div className="anim-rise border-t-2 border-ng-ink/5 p-4">
          <p className="text-sm font-semibold leading-relaxed text-ng-ink/80">
            {lesson.contenu}
          </p>
          <div className="mt-3">
            <Btn
              variant="blue"
              size="sm"
              onClick={() => speak(`${lesson.titre}. ${lesson.contenu}`)}
            >
              🔊 Écouter la leçon
            </Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------- JOUER --------------------------------- */

export function PlayView({
  state,
  onNavigate,
}: {
  state: AppState;
  onNavigate: (tab: Tab) => void;
}) {
  const [themeId, setThemeId] = useState<ThemeId | null>(null);
  const [finished, setFinished] = useState(false);

  const blueprint = useMemo(() => {
    if (!themeId) return null;
    return buildBlueprint({
      profileId: state.profile.id,
      numero: state.profile.niveau,
      themeId,
    });
  }, [themeId, state.profile.id, state.profile.niveau]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-3">
      <Header state={state} onNavigate={onNavigate} />
      <SectionTitle
        title="Jouer"
        emoji="🎮"
        subtitle="Entraînement libre aux mini-jeux des 4 mondes"
      />

      {!themeId ? (
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                playTone("pop");
                setFinished(false);
                setThemeId(theme.id);
              }}
              className="btn3d flex flex-col items-center gap-2 py-5 text-ng-ink"
              style={{
                background: theme.couleurClair,
                borderColor: `${theme.couleur}66`,
              }}
            >
              <span className="text-5xl">{theme.icone}</span>
              <span className="font-display text-base leading-tight">
                {theme.miniJeu}
              </span>
              <span className="text-[11px] font-bold uppercase text-ng-ink/40">
                {theme.categorie}
              </span>
            </button>
          ))}
        </div>
      ) : blueprint ? (
        <div className="card-soft p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl">{THEME_BY_ID[themeId].icone}</span>
            <p className="flex-1 font-display text-lg">
              {THEME_BY_ID[themeId].miniJeu}
            </p>
            <Btn variant="white" size="sm" onClick={() => setThemeId(null)}>
              Quitter
            </Btn>
          </div>
          {finished ? (
            <div className="anim-pop flex flex-col items-center py-6 text-center">
              <Mascot id="coco" size={110} />
              <p className="mt-2 font-display text-2xl">Entraînement terminé !</p>
              <p className="mt-1 text-sm font-semibold text-ng-ink/60">
                Tu peux rejouer autant de fois que tu veux, ou partir en mission
                pour gagner des points.
              </p>
              <div className="mt-4 grid w-full gap-3">
                <Btn onClick={() => setFinished(false)}>Rejouer</Btn>
                <Btn variant="white" onClick={() => setThemeId(null)}>
                  Changer de monde
                </Btn>
              </div>
            </div>
          ) : (
            <MiniGame game={blueprint.game} onFinish={() => {
              playTone("win");
              setFinished(true);
            }} />
          )}
          <p className="mt-4 text-center text-xs font-bold text-ng-ink/40">
            Entraînement : pas de points, juste du plaisir d&apos;apprendre !
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------- RÉCOMPENSES ------------------------------ */

export function RewardsView({
  state,
  onNavigate,
}: {
  state: AppState;
  onNavigate: (tab: Tab) => void;
}) {
  const obtained = state.badges.filter((b) => b.obtenu);
  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-3">
      <Header state={state} onNavigate={onNavigate} />
      <SectionTitle title="Mes récompenses" emoji="🏅" />

      <div className="card-soft mb-5 flex items-center gap-4 p-5">
        <Mascot id="coco" size={90} />
        <div className="flex-1">
          <p className="font-display text-xs uppercase text-ng-ink/50">Grade actuel</p>
          <p className="font-display text-xl leading-tight">
            {state.grade.emoji} {state.grade.nom}
          </p>
          <p className="mt-1 text-xs font-bold text-ng-ink/50">
            {state.profile.points} points · {state.profile.missionsRealisees} missions
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-[#FFF8DC] p-4 text-center">
          <p className="font-display text-3xl">⭐</p>
          <p className="font-display text-2xl">{state.profile.points}</p>
          <p className="text-[11px] font-bold uppercase text-ng-ink/50">points</p>
        </div>
        <div className="rounded-3xl bg-[#FAEEFF] p-4 text-center">
          <p className="font-display text-3xl">🏅</p>
          <p className="font-display text-2xl">
            {obtained.length}/{state.badges.length}
          </p>
          <p className="text-[11px] font-bold uppercase text-ng-ink/50">badges</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {state.badges.map((badge) => (
          <div
            key={badge.id}
            className={`card-soft flex items-center gap-3 p-4 ${
              badge.obtenu ? "" : "opacity-60"
            }`}
          >
            <span className={`text-4xl ${badge.obtenu ? "anim-float" : "grayscale"}`}>
              {badge.obtenu ? badge.emoji : "🔒"}
            </span>
            <div className="min-w-0">
              <p className="font-display text-base leading-tight">{badge.nom}</p>
              <p className="text-[11px] font-bold text-ng-ink/50">
                {badge.obtenu ? badge.description : badge.condition}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- PROFIL -------------------------------- */

export function ProfileView({
  state,
  onNavigate,
  onReset,
  resetError,
}: {
  state: AppState;
  onNavigate: (tab: Tab) => void;
  onReset: (parentPin: string) => void;
  resetError?: string | null;
}) {
  const [gate, setGate] = useState("");
  const minutesJour = Math.round(state.screenTime.tempsUtilise / 60);
  const limiteJour = Math.round(state.screenTime.limiteJour / 60);
  const limiteSession = Math.round(state.screenTime.limiteSession / 60);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-3">
      <Header state={state} onNavigate={onNavigate} />
      <div className="flex flex-col items-center">
        <Logo size="sm" />
      </div>

      <div className="card-soft mt-4 flex flex-col items-center p-5 text-center">
        <span className="text-6xl">{avatarEmoji(state.profile.avatar)}</span>
        <p className="mt-2 font-display text-2xl">{state.profile.pseudo}</p>
        <p className="text-sm font-bold text-ng-ink/50">
          {state.profile.age} ans · Français +{" "}
          {state.profile.langueLocale === "dioula" ? "Dioula" : "Baoulé"}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Chip color="bg-ng-green text-white">Niveau {state.profile.niveau}</Chip>
          <Chip color="bg-ng-purple text-white">{state.grade.nom}</Chip>
          <Chip>⭐ {state.profile.points} points</Chip>
        </div>
        <div className="mt-4 w-full">
          <ProgressBar
            value={state.profile.niveau}
            max={31}
            color="bg-ng-green"
            label="progression globale"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Missions" value={`${state.profile.missionsRealisees}`} emoji="🎯" />
        <Stat label="Badges" value={`${state.badges.filter((b) => b.obtenu).length}`} emoji="🏅" />
        <Stat label="Mots appris" value={`${state.profile.motsAppris}`} emoji="🗣️" />
        <Stat
          label="Actions réelles"
          value={`${state.profile.actionsReelles}`}
          emoji="🦸"
        />
      </div>

      <div className="card-soft mt-4 p-5">
        <h3 className="font-display text-lg">⏱️ Temps d&apos;écran</h3>
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex justify-between text-xs font-bold text-ng-ink/60">
              <span>Aujourd&apos;hui</span>
              <span>
                {minutesJour} / {limiteJour} min
              </span>
            </div>
            <ProgressBar
              value={state.screenTime.tempsUtilise}
              max={state.screenTime.limiteJour}
              color="bg-ng-blue"
              height="h-3"
            />
          </div>
          <p className="text-xs font-bold text-ng-ink/50">
            Session de {limiteSession} min, puis pause de 10 min avec Kofi. Ces
            limites concernent le temps passé dans N&apos;GOWA, pas le temps
            d&apos;écran total de l&apos;enfant.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border-3 border-ng-ink/10 bg-white/70 p-5">
        <h3 className="font-display text-lg">🔒 Espace parent</h3>
        <p className="mt-1 text-xs font-bold text-ng-ink/50">
          Entre le code à 4 chiffres choisi à la création du profil pour
          supprimer la progression.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={gate}
            onChange={(event) =>
              setGate(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            placeholder="••••"
            className="min-w-0 flex-1 rounded-2xl border-3 border-ng-ink/10 bg-white px-4 py-3 text-center font-display text-lg tracking-[0.4em] outline-none focus:border-ng-blue"
          />
          <Btn
            variant="red"
            size="sm"
            full={false}
            disabled={!/^\d{4}$/.test(gate)}
            onClick={() => onReset(gate)}
          >
            Réinitialiser
          </Btn>
        </div>
        {resetError ? (
          <p className="mt-2 text-xs font-bold text-ng-red">{resetError}</p>
        ) : null}
        <p className="mt-2 text-[11px] font-bold text-ng-ink/40">
          Aucune publicité et aucune vente de données. Le pseudo, l&apos;âge et
          la progression sont enregistrés de façon sécurisée pour permettre à
          l&apos;enfant de continuer plus tard.
        </p>
      </div>

      <div className="mt-4">
        <SpeechBubble color="#58CC02" size="sm">
          <p className="text-sm">
            « Awa et moi, on est fiers de toi ! Continue à agir dans le vrai
            monde. » — Kofi
          </p>
        </SpeechBubble>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <div className="card-soft p-4 text-center">
      <p className="text-2xl">{emoji}</p>
      <p className="font-display text-xl">{value}</p>
      <p className="text-[11px] font-bold uppercase text-ng-ink/50">{label}</p>
    </div>
  );
}
