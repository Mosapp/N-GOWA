"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { playTone, speak } from "@/lib/audio";
import type { BlueprintGame } from "@/lib/ngowa";
import { Btn, ProgressBar } from "@/components/ui";

type TriData = Extract<BlueprintGame, { id: "tri" }>;
type EauData = Extract<BlueprintGame, { id: "eau" }>;
type HabitatData = Extract<BlueprintGame, { id: "habitat" }>;
type ChasseurData = Extract<BlueprintGame, { id: "chasseur" }>;

type Finisher = (correct: number, total: number) => void;

/* --------------------------------- Hôte ---------------------------------- */

function GameHeader({
  consigne,
  done,
  total,
  couleur,
}: {
  consigne: string;
  done: number;
  total: number;
  couleur: string;
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-display text-lg leading-tight">{consigne}</p>
        <button
          type="button"
          onClick={() => speak(consigne)}
          className="tap-target flex shrink-0 items-center gap-1 rounded-2xl bg-white px-3 py-2 font-display text-xs uppercase shadow-[0_3px_0_rgba(0,0,0,0.08)]"
          aria-label="Écouter la consigne"
        >
          🔊 Écouter
        </button>
      </div>
      <ProgressBar value={done} max={total} color={couleur} height="h-3" />
    </div>
  );
}

function Feedback({
  kind,
  title,
  text,
  onContinue,
}: {
  kind: "good" | "bad";
  title: string;
  text: string;
  onContinue: () => void;
}) {
  return (
    <div
      className={`anim-pop rounded-3xl border-3 p-4 ${
        kind === "good"
          ? "border-ng-green bg-[#E8F8DC]"
          : "border-ng-red bg-[#FFE9E9]"
      }`}
    >
      <p className="font-display text-lg">
        {kind === "good" ? "✅ " : "💡 "}
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-ng-ink/70">{text}</p>
      <div className="mt-3">
        <Btn
          variant={kind === "good" ? "green" : "red"}
          onClick={onContinue}
          sound="none"
        >
          Continuer
        </Btn>
      </div>
    </div>
  );
}

/* ---------------------------- 1. À quelle poubelle ? --------------------- */

export function TriGame({ game, onFinish }: { game: TriData; onFinish: Finisher }) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<null | {
    kind: "good" | "bad";
    title: string;
    text: string;
  }>(null);
  const [firstTry, setFirstTry] = useState(true);
  const score = useRef(0);

  const item = game.items[index];
  const total = game.items.length;

  useEffect(() => {
    if (item) speak(item.nom);
  }, [item]);

  const choose = (binId: string) => {
    if (feedback || !item) return;
    if (binId === item.bin) {
      if (firstTry) score.current += 1;
      playTone("good");
      setFeedback({
        kind: "good",
        title: `Bravo ! ${item.nom} → ${binName(binId)}`,
        text: "Tu as trouvé la bonne poubelle !",
      });
    } else {
      playTone("bad");
      setFirstTry(false);
      setFeedback({
        kind: "bad",
        title: `Presque ! ${item.nom} va dans ${binName(item.bin)}`,
        text: "Regarde bien la matière de l'objet.",
      });
    }
  };

  const next = () => {
    setFeedback(null);
    setFirstTry(true);
    if (index + 1 >= total) {
      onFinish(score.current, total);
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <div>
      <GameHeader
        consigne={game.consigne}
        done={index}
        total={total}
        couleur="bg-ng-orange"
      />
      {item ? (
        <div className="mb-4 flex flex-col items-center">
          <div className="anim-pop flex h-32 w-32 items-center justify-center rounded-[2rem] border-4 border-ng-orange/40 bg-white text-6xl shadow-[0_8px_0_rgba(255,150,0,0.25)]">
            {item.emoji}
          </div>
          <p className="mt-2 font-display text-xl">{item.nom}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-ng-ink/50">
            Déchet {index + 1} / {total}
          </p>
        </div>
      ) : null}

      {feedback ? (
        <Feedback {...feedback} onContinue={next} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {game.binsData.map((bin) => (
            <button
              key={bin.id}
              type="button"
              onClick={() => choose(bin.id)}
              className="btn3d tap-target flex flex-col items-center justify-center gap-1 border-ng-ink/15 bg-white px-2 py-4 text-ng-ink"
            >
              <span className="text-3xl">{bin.emoji}</span>
              <span className="font-display text-sm leading-none">{bin.nom}</span>
              <span className="text-center text-[10px] font-bold leading-tight text-ng-ink/40">
                {bin.aide}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function binName(id: string) {
  const map: Record<string, string> = {
    plastique: "la poubelle Plastique 🟡",
    papier: "la poubelle Papier 🔵",
    verre: "la poubelle Verre 🟢",
    organique: "la poubelle Organique 🟤",
    special: "le bac des déchets dangereux 🔴",
  };
  return map[id] ?? id;
}

/* ------------------------------ 2. Sauve l'eau ! ------------------------- */

export function WaterGame({ game, onFinish }: { game: EauData; onFinish: Finisher }) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<null | {
    kind: "good" | "bad";
    title: string;
    text: string;
  }>(null);
  const [fill, setFill] = useState(0);
  const [missed, setMissed] = useState(false);
  const score = useRef(0);

  const scenario = game.scenarios[index];
  const total = game.scenarios.length;

  useEffect(() => {
    if (!scenario) return;
    speak(`${scenario.lieu}. ${scenario.situation}`);
    const started = Date.now();
    const duration = 16000;
    const interval = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / duration) * 100);
      setFill(pct);
      if (pct >= 100) {
        window.clearInterval(interval);
        setMissed(true);
        playTone("bad");
        const bonne = scenario.options.find((o) => o.correct);
        setFeedback({
          kind: "bad",
          title: "La bassine a débordé !",
          text: `Le bon geste : ${bonne?.texte ?? ""}`,
        });
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [scenario]);

  const choose = (texte: string) => {
    if (feedback || !scenario) return;
    const option = scenario.options.find((o) => o.texte === texte);
    if (!option) return;
    if (option.correct) {
      score.current += 1;
      playTone("good");
      setFeedback({ kind: "good", title: "Goutte sauvée ! 💧", text: option.retour });
    } else {
      playTone("bad");
      setFeedback({
        kind: "bad",
        title: "Oh oh, l'eau continue de couler…",
        text: option.retour,
      });
    }
  };

  const next = () => {
    setFeedback(null);
    setFill(0);
    setMissed(false);
    if (index + 1 >= total) onFinish(score.current, total);
    else setIndex(index + 1);
  };

  return (
    <div>
      <GameHeader
        consigne={game.consigne}
        done={index}
        total={total}
        couleur="bg-ng-blue"
      />
      {scenario ? (
        <>
          <div className="card-soft mb-4 flex items-center gap-4 p-4">
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-ng-blue/40 bg-white">
              <div
                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-ng-blue to-[#7fd6ff] transition-[height] duration-200"
                style={{ height: `${fill}%` }}
              />
              <span className="absolute inset-0 flex items-end justify-center pb-1 text-2xl">
                🪣
              </span>
            </div>
            <div>
              <p className="font-display text-xs uppercase tracking-wide text-ng-blue">
                {scenario.lieu}
              </p>
              <p className="font-display text-lg leading-tight">
                {scenario.situation}
              </p>
              {missed ? (
                <p className="text-xs font-bold text-ng-red">
                  Trop tard ! Réfléchis plus vite la prochaine fois.
                </p>
              ) : null}
            </div>
          </div>
          {feedback ? (
            <Feedback {...feedback} onContinue={next} />
          ) : (
            <div className="grid gap-3">
              {scenario.options.map((option) => (
                <button
                  key={option.texte}
                  type="button"
                  onClick={() => choose(option.texte)}
                  className="btn3d tap-target flex items-center gap-3 border-ng-ink/15 bg-white px-4 py-4 text-left text-ng-ink normal-case"
                >
                  <span className="text-2xl">💧</span>
                  <span className="font-display text-base leading-tight">
                    {option.texte}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------ 3. Qui vit où ? -------------------------- */

export function HabitatGame({ game, onFinish }: { game: HabitatData; onFinish: Finisher }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "good" | "bad"; text: string } | null>(
    null,
  );
  const score = useRef(0);
  const attempts = useRef(0);
  const total = game.species.length;

  useEffect(() => {
    speak(game.consigne);
  }, [game.consigne]);

  const remaining = game.species.filter((s) => !matched.includes(s.id));
  const current = remaining.find((s) => s.id === selected) ?? remaining[0];

  const pickHabitat = useCallback(
    (habitatId: string) => {
      if (!current) return;
      attempts.current += 1;
      if (current.habitat === habitatId) {
        score.current += 1;
        playTone("good");
        setMatched((prev) => [...prev, current.id]);
        setSelected(null);
        setMessage({ kind: "good", text: `${current.nom} : ${current.astuce}` });
        if (matched.length + 1 >= total) {
          window.setTimeout(() => onFinish(score.current, total), 700);
        }
      } else {
        playTone("bad");
        setWrongId(habitatId);
        window.setTimeout(() => setWrongId(null), 500);
        setMessage({
          kind: "bad",
          text: `Indice : ${current.astuce}`,
        });
      }
    },
    [current, matched.length, onFinish, total],
  );

  return (
    <div>
      <GameHeader
        consigne={game.consigne}
        done={matched.length}
        total={total}
        couleur="bg-ng-green"
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {game.species.map((s) => {
          const done = matched.includes(s.id);
          const active = current?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={done}
              onClick={() => {
                setSelected(s.id);
                playTone("tap");
                speak(s.nom);
              }}
              className={`btn3d tap-target flex items-center gap-3 px-3 py-3 text-left normal-case ${
                done
                  ? "border-ng-green/40 bg-[#E8F8DC] text-ng-ink/50"
                  : active
                    ? "border-ng-yellow-dark bg-ng-yellow text-ng-ink"
                    : "border-ng-ink/15 bg-white text-ng-ink"
              }`}
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="font-display text-base">{s.nom}</span>
              {done ? <span className="ml-auto">✅</span> : null}
            </button>
          );
        })}
      </div>

      {message ? (
        <div
          className={`mb-3 anim-pop rounded-2xl border-2 p-3 text-sm font-semibold ${
            message.kind === "good"
              ? "border-ng-green bg-[#E8F8DC] text-ng-green-dark"
              : "border-ng-yellow bg-[#FFF8DC] text-ng-orange-dark"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <p className="mb-2 text-center font-display text-sm uppercase tracking-wide text-ng-ink/50">
        {current ? `Où vit ${current.nom} ?` : "Bravo, tu as tout trouvé !"}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {game.habitats.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => pickHabitat(h.id)}
            className={`btn3d tap-target flex flex-col items-center gap-1 px-2 py-4 ${
              wrongId === h.id
                ? "anim-shake border-ng-red-dark bg-ng-red text-white"
                : "border-ng-ink/15 bg-white text-ng-ink"
            }`}
          >
            <span className="text-3xl">{h.emoji}</span>
            <span className="font-display text-sm leading-none">{h.nom}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------- 4. Chasseur de gaspillage -------------------- */

export function HunterGame({ game, onFinish }: { game: ChasseurData; onFinish: Finisher }) {
  const [found, setFound] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<{ kind: "good" | "bad"; text: string } | null>(
    null,
  );
  const total = useMemo(
    () => game.spots.filter((s) => s.gaspillage).length,
    [game.spots],
  );

  useEffect(() => {
    speak(game.consigne);
  }, [game.consigne]);

  const tap = (id: string) => {
    const spot = game.spots.find((s) => s.id === id);
    if (!spot || found.includes(id) || errors.includes(id)) return;
    if (spot.gaspillage) {
      playTone("good");
      const nextFound = [...found, id];
      setFound(nextFound);
      setMessage({ kind: "good", text: spot.retour });
      if (nextFound.length >= total) {
        window.setTimeout(
          () => onFinish(total - errors.length * 0, total),
          700,
        );
      }
    } else {
      playTone("bad");
      setErrors((prev) => [...prev, id]);
      setMessage({ kind: "bad", text: spot.retour });
    }
  };

  return (
    <div>
      <GameHeader
        consigne={game.consigne}
        done={found.length}
        total={total}
        couleur="bg-ng-yellow"
      />
      <div className="mb-3 flex items-center justify-center gap-2 font-display text-sm">
        <span className="rounded-full bg-[#FFF8DC] px-3 py-1">
          🔎 Gaspillages trouvés : {found.length}/{total}
        </span>
        <span className="rounded-full bg-[#FFE9E9] px-3 py-1">
          ❌ Erreurs : {errors.length}
        </span>
      </div>
      {message ? (
        <div
          className={`mb-3 anim-pop rounded-2xl border-2 p-3 text-sm font-semibold ${
            message.kind === "good"
              ? "border-ng-green bg-[#E8F8DC] text-ng-green-dark"
              : "border-ng-red bg-[#FFE9E9] text-ng-red-dark"
          }`}
        >
          {message.text}
        </div>
      ) : null}
      <div className="rounded-[2rem] border-4 border-ng-yellow/40 bg-gradient-to-b from-[#FFFDF3] to-[#FFF3D0] p-3">
        <p className="mb-2 text-center font-display text-xs uppercase tracking-widest text-ng-ink/40">
          🏠 La maison de Kofi
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {game.spots.map((spot) => {
            const done = found.includes(spot.id);
            const wrong = errors.includes(spot.id);
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => tap(spot.id)}
                className={`btn3d tap-target flex flex-col items-center gap-1 px-2 py-4 ${
                  done
                    ? "border-ng-green-dark bg-ng-green text-white"
                    : wrong
                      ? "anim-shake border-ng-red-dark bg-[#FFE9E9] text-ng-red-dark"
                      : "border-ng-ink/15 bg-white text-ng-ink"
                }`}
              >
                <span className="text-4xl">{spot.emoji}</span>
                <span className="font-display text-center text-xs leading-tight">
                  {spot.nom}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Sélecteur -------------------------------- */

export function MiniGame({
  game,
  onFinish,
}: {
  game: BlueprintGame;
  onFinish: Finisher;
}) {
  if (game.id === "tri") return <TriGame game={game} onFinish={onFinish} />;
  if (game.id === "eau") return <WaterGame game={game} onFinish={onFinish} />;
  if (game.id === "habitat") return <HabitatGame game={game} onFinish={onFinish} />;
  return <HunterGame game={game} onFinish={onFinish} />;
}
