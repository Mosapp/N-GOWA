"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LevelFlow } from "@/components/LevelFlow";
import { Onboarding } from "@/components/Onboarding";
import { Btn, Mascot, ProgressBar, SpeechBubble } from "@/components/ui";
import {
  HomeView,
  LearnView,
  PathView,
  PlayView,
  ProfileView,
  RewardsView,
  type Tab,
} from "@/components/views";
import { PAUSE_ACTIVITIES } from "@/content/curriculum";
import { buildBlueprint } from "@/lib/ngowa";
import { playTone, speak, stopSpeaking, warmUpAudio } from "@/lib/audio";
import type { AppState, CompleteLevelResult, LevelView } from "@/lib/types";

const STORAGE_KEY = "ngowa.profileId";

const TABS: { id: Tab; label: string; emoji: string; couleur: string }[] = [
  { id: "accueil", label: "Accueil", emoji: "🏠", couleur: "text-ng-orange" },
  { id: "aventure", label: "Aventure", emoji: "🗺️", couleur: "text-ng-green" },
  { id: "apprendre", label: "Apprendre", emoji: "📚", couleur: "text-ng-blue" },
  { id: "jouer", label: "Jouer", emoji: "🎮", couleur: "text-ng-purple" },
  { id: "recompenses", label: "Récompenses", emoji: "🏅", couleur: "text-ng-yellow-dark" },
  { id: "profil", label: "Profil", emoji: "🧒", couleur: "text-ng-teal" },
];

export function AppShell() {
  const [profileId, setProfileId] = useState<number | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("accueil");
  const [activeLevel, setActiveLevel] = useState<LevelView | null>(null);
  const [pause, setPause] = useState<{ activity: string; startedAt: number } | null>(
    null,
  );
  const [tick, setTick] = useState(0);
  const [online, setOnline] = useState(true);

  const sessionSeconds = useRef(0);
  const pendingSeconds = useRef(0);
  const flushing = useRef(false);

  /* ------------------------------ chargement ------------------------------ */

  const loadState = useCallback(async (id: number) => {
    const response = await fetch(`/api/state?profileId=${id}`, { cache: "no-store" });
    if (!response.ok) {
      localStorage.removeItem(STORAGE_KEY);
      setProfileId(null);
      setState(null);
      return;
    }
    const data = (await response.json()) as AppState;
    setState(data);
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(stored) && stored > 0) {
      setProfileId(stored);
      loadState(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadState]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  /* --------------------------- temps d'écran ------------------------------ */

  const flushTime = useCallback(
    async (secondes: number, isPause = false) => {
      if (!profileId || secondes <= 0) return;
      try {
        const response = await fetch("/api/screen-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId, secondes, pause: isPause }),
        });
        if (response.ok) {
          const data = (await response.json()) as {
            tempsUtilise: number;
            limiteSession: number;
            limiteJour: number;
            pauses: number;
          };
          setState((prev) =>
            prev ? { ...prev, screenTime: { ...prev.screenTime, ...data } } : prev,
          );
        }
      } catch {
        /* hors ligne : le temps sera renvoyé plus tard */
      }
    },
    [profileId],
  );

  const triggerPause = useCallback(() => {
    if (!state) return;
    stopSpeaking();
    playTone("pop");
    const activity =
      PAUSE_ACTIVITIES[Math.floor(Math.random() * PAUSE_ACTIVITIES.length)];
    setPause({ activity, startedAt: Date.now() });
    flushTime(Math.round(pendingSeconds.current), true);
    pendingSeconds.current = 0;
    sessionSeconds.current = 0;
    speak(
      "Je suis un peu fatigué. Je vais me reposer sous le baobab ! Toi aussi, fais une pause.",
    );
  }, [flushTime, state]);

  useEffect(() => {
    if (!state || pause || !profileId) return;
    const limiteSession = state.screenTime.limiteSession;
    const interval = window.setInterval(() => {
      sessionSeconds.current += 5;
      pendingSeconds.current += 5;
      setTick((t) => t + 1);
      if (pendingSeconds.current >= 30) {
        const amount = pendingSeconds.current;
        pendingSeconds.current = 0;
        if (!flushing.current) {
          flushing.current = true;
          void flushTime(amount).finally(() => {
            flushing.current = false;
          });
        }
      }
      if (sessionSeconds.current >= limiteSession) triggerPause();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [state, pause, profileId, flushTime, triggerPause]);

  const dayLimitReached = useMemo(() => {
    if (!state) return false;
    return (
      state.screenTime.tempsUtilise + pendingSeconds.current >=
      state.screenTime.limiteJour
    );
  }, [state, tick]);

  /* ------------------------------- actions -------------------------------- */

  const startMission = useCallback(
    (levelId?: number) => {
      if (!state) return;
      const level =
        state.levels.find((l) => l.id === levelId) ??
        state.levels.find((l) => l.numero === state.profile.niveau);
      if (!level) return;
      warmUpAudio();
      setActiveLevel(level);
      setTab("accueil");
    },
    [state],
  );

  const activeBlueprint = useMemo(() => {
    if (!activeLevel || !state) return null;
    return buildBlueprint({
      profileId: state.profile.id,
      numero: activeLevel.numero,
      themeId: activeLevel.themeId,
    });
  }, [activeLevel, state]);

  const handleCompleted = async (result: CompleteLevelResult & { state?: AppState }) => {
    if (result.state) {
      const nextState = result.state as AppState;
      setState(nextState);
    } else if (profileId) {
      await loadState(profileId);
    }
  };

  const [resetError, setResetError] = useState<string | null>(null);

  const handleReset = async (parentPin: string) => {
    if (!profileId) return;
    setResetError(null);
    try {
      const response = await fetch(
        `/api/profile?profileId=${profileId}&parentPin=${parentPin}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        setResetError(data?.error ?? "Code incorrect.");
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      setProfileId(null);
      setState(null);
      setTab("accueil");
    } catch {
      setResetError("Pas de connexion. Réessaie.");
    }
  };

  /* -------------------------------- rendu --------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="kente h-2 w-40 animate-pulse rounded-full" />
        <p className="font-display text-lg text-ng-ink/60">
          N&apos;GOWA prépare l&apos;aventure…
        </p>
      </div>
    );
  }

  if (!state || !profileId) {
    return (
      <Onboarding
        onCreated={(id, newState) => {
          localStorage.setItem(STORAGE_KEY, String(id));
          setProfileId(id);
          setState(newState);
          setTab("accueil");
        }}
      />
    );
  }

  if (dayLimitReached && !activeLevel) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <Mascot id="kofi" size={150} />
        <div className="mt-4 w-full">
          <SpeechBubble color="#58CC02">
            <p className="text-lg">
              Tu as terminé tes activités N&apos;GOWA pour aujourd&apos;hui. À
              demain pour une nouvelle aventure !
            </p>
          </SpeechBubble>
        </div>
        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          <div className="card-soft p-4">
            <p className="font-display text-xs uppercase text-ng-ink/50">Points du jour</p>
            <p className="font-display text-2xl text-ng-orange">⭐ {state.profile.points}</p>
          </div>
          <div className="card-soft p-4">
            <p className="font-display text-xs uppercase text-ng-ink/50">Missions</p>
            <p className="font-display text-2xl text-ng-green">
              🎯 {state.profile.missionsRealisees}
            </p>
          </div>
        </div>
        <p className="mt-6 max-w-sm text-sm font-semibold text-ng-ink/60">
          {PAUSE_ACTIVITIES[state.profile.niveau % PAUSE_ACTIVITIES.length]}
        </p>
      </div>
    );
  }

  if (activeLevel && activeBlueprint) {
    return (
      <>
        <LevelFlow
          level={activeLevel}
          blueprint={activeBlueprint}
          profile={state.profile}
          onExit={() => {
            stopSpeaking();
            setActiveLevel(null);
          }}
          onCompleted={handleCompleted}
        />
        {pause ? <PauseOverlay pause={pause} onResume={() => setPause(null)} /> : null}
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      {!online ? (
        <div className="kente-soft px-4 py-1 text-center font-display text-[11px] uppercase tracking-widest text-ng-ink/70">
          Mode hors ligne — ton aventure continue ⛺
        </div>
      ) : null}

      {tab === "accueil" ? (
        <HomeView
          state={state}
          onNavigate={setTab}
          onStartMission={() => startMission()}
        />
      ) : null}
      {tab === "aventure" ? (
        <PathView state={state} onNavigate={setTab} onStartMission={startMission} />
      ) : null}
      {tab === "apprendre" ? <LearnView state={state} onNavigate={setTab} /> : null}
      {tab === "jouer" ? <PlayView state={state} onNavigate={setTab} /> : null}
      {tab === "recompenses" ? (
        <RewardsView state={state} onNavigate={setTab} />
      ) : null}
      {tab === "profil" ? (
        <ProfileView
          state={state}
          onNavigate={setTab}
          onReset={handleReset}
          resetError={resetError}
        />
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t-3 border-ng-ink/5 bg-white/95 px-2 pb-2 pt-2 backdrop-blur">
        <ul className="mx-auto flex max-w-xl items-stretch justify-between gap-1">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <li key={item.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => {
                    playTone("tap");
                    setTab(item.id);
                  }}
                  className={`flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-2 transition-colors ${
                    active ? "bg-ng-cream" : ""
                  }`}
                >
                  <span
                    className={`text-2xl ${active ? "anim-float" : "opacity-60"}`}
                  >
                    {item.emoji}
                  </span>
                  <span
                    className={`font-display text-[10px] uppercase leading-none ${
                      active ? item.couleur : "text-ng-ink/40"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {pause ? <PauseOverlay pause={pause} onResume={() => setPause(null)} /> : null}
    </div>
  );
}

/* --------------------------- La Pause de Kofi ----------------------------- */

function PauseOverlay({
  pause,
  onResume,
}: {
  pause: { activity: string; startedAt: number };
  onResume: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const totalMs = 10 * 60 * 1000;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const elapsed = now - pause.startedAt;
  const remaining = Math.max(0, totalMs - elapsed);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const canResume = remaining <= 0;
  const canSkip = elapsed > 20000;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#FFF8E7]/97 px-6 text-center">
      <div className="absolute inset-x-0 top-0 h-2 kente" />
      <div className="relative h-32 w-full max-w-md overflow-hidden rounded-[2rem] border-3 border-ng-orange/30">
        <Image
          src="/mascots/baobab.png"
          alt="Kofi se repose sous le baobab"
          width={640}
          height={320}
          className="h-full w-full object-cover"
        />
      </div>
      <Mascot id="kofi" size={140} />
      <h2 className="font-display text-3xl leading-tight">La Pause de Kofi</h2>
      <div className="w-full max-w-md">
        <SpeechBubble color="#58CC02">
          <p className="text-lg">
            « Je suis un peu fatigué. Je vais me reposer sous le baobab ! Toi
            aussi, fais une pause. »
          </p>
        </SpeechBubble>
      </div>

      <div className="card-soft w-full max-w-md p-5">
        <p className="font-display text-xs uppercase tracking-widest text-ng-ink/50">
          Activité hors écran
        </p>
        <p className="mt-1 font-display text-xl leading-tight">{pause.activity}</p>
        <div className="mt-4">
          <ProgressBar
            value={Math.min(totalMs, elapsed)}
            max={totalMs}
            color="bg-ng-blue"
            label="temps de pause"
          />
          <p className="mt-2 font-display text-2xl text-ng-blue">
            {minutes}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
      </div>

      {canResume ? (
        <Btn size="lg" onClick={onResume}>
          J&apos;ai fait ma pause !
        </Btn>
      ) : (
        <div className="grid w-full max-w-md gap-2">
          <p className="font-display text-sm text-ng-ink/50">
            La pause dure encore {minutes} min {seconds} s.
          </p>
          {canSkip ? (
            <Btn variant="white" size="sm" onClick={onResume}>
              Reprendre maintenant
            </Btn>
          ) : null}
        </div>
      )}
    </div>
  );
}
