"use client";

import { useEffect, useMemo, useState } from "react";

import { MiniGame } from "@/components/games";
import { Btn, Chip, Mascot, ProgressBar, SpeechBubble, Stars } from "@/components/ui";
import { THEME_BY_ID } from "@/content/curriculum";
import type { LevelBlueprint } from "@/lib/ngowa";
import { playTone, speak, stopSpeaking } from "@/lib/audio";
import type {
  AppState,
  CompleteLevelResult,
  LevelView,
  ProfileView,
} from "@/lib/types";

type Step =
  | { kind: "intro" }
  | { kind: "lesson"; i: number }
  | { kind: "vocab"; i: number }
  | { kind: "game" }
  | { kind: "quiz"; i: number }
  | { kind: "result" }
  | { kind: "action" };

export function LevelFlow({
  level,
  blueprint,
  profile,
  onExit,
  onCompleted,
}: {
  level: LevelView;
  blueprint: LevelBlueprint;
  profile: ProfileView;
  onExit: () => void;
  onCompleted: (result: CompleteLevelResult & { state?: AppState }) => void;
}) {
  const theme = THEME_BY_ID[blueprint.themeId];
  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [jeuScore, setJeuScore] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CompleteLevelResult | null>(null);
  const [pointsLive, setPointsLive] = useState(0);

  const totalSteps = 2 + blueprint.lessons.length + blueprint.vocab.length + 1 + blueprint.quiz.length;
  const stepIndex = (() => {
    switch (step.kind) {
      case "intro":
        return 0;
      case "lesson":
        return 1 + step.i;
      case "vocab":
        return 1 + blueprint.lessons.length + step.i;
      case "game":
        return 1 + blueprint.lessons.length + blueprint.vocab.length;
      case "quiz":
        return (
          2 + blueprint.lessons.length + blueprint.vocab.length + step.i
        );
      default:
        return totalSteps;
    }
  })();

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const nextFromLesson = (i: number) => {
    if (i + 1 >= blueprint.lessons.length) {
      setStep({ kind: "vocab", i: 0 });
    } else {
      setStep({ kind: "lesson", i: i + 1 });
    }
    setPointsLive((p) => p + 10);
  };

  const nextFromVocab = (i: number) => {
    if (i + 1 >= blueprint.vocab.length) {
      setStep({ kind: "game" });
    } else {
      setStep({ kind: "vocab", i: i + 1 });
    }
    setPointsLive((p) => p + 10);
  };

  const answerQuiz = (reponse: string) => {
    if (quizAnswer) return;
    setQuizAnswer(reponse);
    const question = blueprint.quiz[step.kind === "quiz" ? step.i : 0];
    const correct = reponse === question.bonneReponse;
    if (correct) {
      setQuizScore((s) => s + 1);
      setPointsLive((p) => p + 10);
      playTone("good");
    } else {
      playTone("bad");
    }
  };

  const nextFromQuiz = (i: number) => {
    setQuizAnswer(null);
    if (i + 1 >= blueprint.quiz.length) {
      setStep({ kind: "result" });
      playTone("win");
    } else {
      setStep({ kind: "quiz", i: i + 1 });
    }
  };

  const finish = async (actionFaite: boolean) => {
    setSaving(true);
    try {
      const response = await fetch("/api/level/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
          levelId: level.id,
          jeuScore,
          jeuTotal:
            blueprint.game.id === "tri"
              ? blueprint.game.items.length
              : blueprint.game.id === "eau"
                ? blueprint.game.scenarios.length
                : blueprint.game.id === "habitat"
                  ? blueprint.game.species.length
                  : blueprint.game.spots.filter((s) => s.gaspillage).length,
          quizScore,
          quizTotal: blueprint.quiz.length,
          actionFaite,
          secondes: 0,
        }),
      });
      const data = (await response.json()) as CompleteLevelResult & {
        state?: AppState;
      };
      setResult(data);
      onCompleted(data);
    } finally {
      setSaving(false);
      setStep({ kind: "action" });
    }
  };

  /* ------------------------------ rendu commun ---------------------------- */

  const header = (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          stopSpeaking();
          onExit();
        }}
        className="tap-target flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-display text-xl text-ng-ink/40 shadow-[0_3px_0_rgba(0,0,0,0.08)]"
        aria-label="Quitter la mission"
      >
        ✕
      </button>
      <div className="flex-1">
        <ProgressBar
          value={stepIndex}
          max={totalSteps}
          color="bg-ng-green"
          height="h-3.5"
          label="avancement de la mission"
        />
      </div>
      <span className="font-display text-sm text-ng-ink/60">
        ⭐ {profile.points + pointsLive}
      </span>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-4">
      {header}

      {/* ---------------------------- INTRO ---------------------------- */}
      {step.kind === "intro" ? (
        <div className="anim-rise flex flex-col items-center text-center">
          <Chip color="bg-white" className="shadow-sm">
            Niveau {level.numero} · {theme.categorie}
          </Chip>
          <div className="mt-3 flex items-end gap-2">
            <Mascot id="kofi" size={130} />
            <Mascot id="coco" size={90} />
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight">
            Mission : « {level.titre} »
          </h1>
          <p className="mt-2 max-w-md text-sm font-semibold text-ng-ink/70">
            {level.description}
          </p>
          <div className="mt-4 w-full">
            <SpeechBubble color={theme.couleur}>
              <p>
                Bonjour {profile.pseudo} ! Aujourd&apos;hui on part dans{" "}
                <strong>{theme.nom}</strong>. On apprend, on joue, et après tu
                fais une vraie mission à la maison !
              </p>
            </SpeechBubble>
          </div>
          <div className="mt-4 grid w-full gap-2 text-left">
            {[
              { icon: "📖", texte: `${blueprint.lessons.length} petites leçons` },
              { icon: "🗣️", texte: `${blueprint.vocab.length} mots EcoLangues` },
              { icon: "🎮", texte: `Mini-jeu : ${theme.miniJeu}` },
              { icon: "❓", texte: `${blueprint.quiz.length} questions` },
            ].map((row) => (
              <div
                key={row.texte}
                className="card-soft flex items-center gap-3 px-4 py-3"
              >
                <span className="text-2xl">{row.icon}</span>
                <span className="font-display text-base">{row.texte}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 w-full">
            <Btn
              size="lg"
              onClick={() => {
                speak(
                  `Mission ${level.titre}. On apprend, on joue, et après tu fais une vraie mission à la maison !`,
                );
                setStep({ kind: "lesson", i: 0 });
              }}
            >
              C&apos;est parti !
            </Btn>
          </div>
        </div>
      ) : null}

      {/* ---------------------------- LEÇON ---------------------------- */}
      {step.kind === "lesson" ? (
        <LessonStep
          blueprint={blueprint}
          index={step.i}
          themeColor={theme.couleur}
          onNext={() => nextFromLesson(step.i)}
        />
      ) : null}

      {/* -------------------------- ECOLANGUES ------------------------- */}
      {step.kind === "vocab" ? (
        <VocabStep
          blueprint={blueprint}
          index={step.i}
          themeColor={theme.couleur}
          onNext={() => nextFromVocab(step.i)}
        />
      ) : null}

      {/* --------------------------- MINI-JEU -------------------------- */}
      {step.kind === "game" ? (
        <div className="anim-rise">
          <div className="mb-3 flex items-center gap-3 rounded-3xl bg-white/70 p-3">
            <Mascot id="coco" size={70} float={false} />
            <div>
              <p className="font-display text-lg">
                Mini-jeu : {theme.miniJeu} 🎮
              </p>
              <p className="text-xs font-bold text-ng-ink/50">
                Fais de ton mieux, tu gagnes des points à chaque réussite !
              </p>
            </div>
          </div>
          <MiniGame
            game={blueprint.game}
            onFinish={(correct, total) => {
              setJeuScore(correct);
              setPointsLive((p) => p + correct * 5);
              setStep({ kind: "quiz", i: 0 });
            }}
          />
        </div>
      ) : null}

      {/* ----------------------------- QUIZ ---------------------------- */}
      {step.kind === "quiz" ? (
        <QuizStep
          blueprint={blueprint}
          index={step.i}
          selected={quizAnswer}
          onSelect={answerQuiz}
          onNext={() => nextFromQuiz(step.i)}
          themeColor={theme.couleur}
        />
      ) : null}

      {/* ---------------------------- RÉSULTAT ------------------------- */}
      {step.kind === "result" ? (
        <div className="anim-pop flex flex-col items-center text-center">
          <Mascot id="coco" size={120} />
          <h2 className="mt-2 font-display text-2xl">Mission terminée !</h2>
          <div className="mt-2">
            <Stars
              score={Math.round(
                ((jeuScore + quizScore) /
                  Math.max(1, blueprint.quiz.length + 3)) *
                  100,
              )}
            />
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-3">
            <div className="card-soft p-4">
              <p className="font-display text-xs uppercase text-ng-ink/50">
                Mini-jeu
              </p>
              <p className="font-display text-2xl text-ng-orange">
                {jeuScore} /{" "}
                {blueprint.game.id === "tri"
                  ? blueprint.game.items.length
                  : blueprint.game.id === "eau"
                    ? blueprint.game.scenarios.length
                    : blueprint.game.id === "habitat"
                      ? blueprint.game.species.length
                      : blueprint.game.spots.filter((s) => s.gaspillage).length}
              </p>
            </div>
            <div className="card-soft p-4">
              <p className="font-display text-xs uppercase text-ng-ink/50">
                Quiz
              </p>
              <p className="font-display text-2xl text-ng-blue">
                {quizScore} / {blueprint.quiz.length}
              </p>
            </div>
          </div>
          {result ? (
            <div className="mt-4 w-full rounded-3xl border-3 border-ng-yellow bg-[#FFF8DC] p-4">
              <p className="font-display text-xl">
                ⭐ +{result.pointsGagnes} points
              </p>
              <p className="mt-1 text-sm font-semibold text-ng-ink/70">
                Récompense : {level.recompense}
              </p>
            </div>
          ) : null}
          {result?.nouveauxBadges.length ? (
            <div className="mt-4 w-full space-y-2">
              {result.nouveauxBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="anim-pop card-soft flex items-center gap-3 p-4"
                >
                  <span className="text-4xl">{badge.emoji}</span>
                  <div>
                    <p className="font-display text-base">Nouveau badge !</p>
                    <p className="text-sm font-bold text-ng-ink/60">
                      {badge.nom} — {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-5 w-full">
            <Btn
              size="lg"
              variant="yellow"
              disabled={saving}
              onClick={() => finish(true)}
            >
              {saving ? "Sauvegarde…" : "Recevoir ma récompense"}
            </Btn>
          </div>
        </div>
      ) : null}

      {/* ------------------------ ACTION HORS ÉCRAN -------------------- */}
      {step.kind === "action" ? (
        <div className="anim-rise flex flex-col items-center text-center">
          <Mascot id="awa" size={130} />
          <Chip color="bg-ng-green text-white">Mission du vrai monde</Chip>
          <h2 className="mt-3 font-display text-2xl">À toi de jouer, hors écran !</h2>
          <div className="mt-3 w-full">
            <SpeechBubble color="#1CB0F6">
              <p className="text-lg">{level.actionHorsEcran}</p>
            </SpeechBubble>
          </div>
          <p className="mt-4 max-w-sm text-sm font-semibold text-ng-ink/60">
            Personne ne vérifie : c&apos;est toi l&apos;héros ! Reviens après
            pour continuer l&apos;aventure.
          </p>
          <div className="mt-5 grid w-full gap-3">
            <Btn size="lg" variant="green" onClick={onExit}>
              Mission acceptée ✅
            </Btn>
            <Btn variant="white" onClick={onExit}>
              Plus tard
            </Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------- Sous-étapes ------------------------------ */

function LessonStep({
  blueprint,
  index,
  themeColor,
  onNext,
}: {
  blueprint: LevelBlueprint;
  index: number;
  themeColor: string;
  onNext: () => void;
}) {
  const lesson = blueprint.lessons[index];
  useEffect(() => {
    speak(`${lesson.titre}. ${lesson.contenu}`);
  }, [lesson]);
  return (
    <div className="anim-rise flex flex-col items-center">
      <Chip color="bg-white" className="shadow-sm">
        Leçon {index + 1} / {blueprint.lessons.length}
      </Chip>
      <div
        className="mt-3 flex h-40 w-40 items-center justify-center rounded-[2.5rem] border-4 bg-white text-7xl shadow-[0_10px_0_rgba(0,0,0,0.08)]"
        style={{ borderColor: `${themeColor}55` }}
      >
        <span className="anim-float">{lesson.emoji}</span>
      </div>
      <h2 className="mt-4 text-center font-display text-2xl">{lesson.titre}</h2>
      <p className="mt-3 max-w-md text-center text-base font-semibold leading-relaxed text-ng-ink/80">
        {lesson.contenu}
      </p>
      <div className="mt-4 w-full">
        <SpeechBubble color={themeColor} size="sm">
          <button
            type="button"
            onClick={() => speak(lesson.audioFr)}
            className="font-display text-sm text-ng-blue"
          >
            🔊 Réécouter la phrase
          </button>
        </SpeechBubble>
      </div>
      <div className="mt-6 w-full">
        <Btn onClick={onNext} sound="pop">
          J&apos;ai compris !
        </Btn>
      </div>
    </div>
  );
}

function VocabStep({
  blueprint,
  index,
  themeColor,
  onNext,
}: {
  blueprint: LevelBlueprint;
  index: number;
  themeColor: string;
  onNext: () => void;
}) {
  const word = blueprint.vocab[index];
  const [showLocal, setShowLocal] = useState(false);
  useEffect(() => {
    speak(`${word.motFr}. ${word.phraseFr}`);
    setShowLocal(false);
  }, [word]);
  return (
    <div className="anim-rise flex flex-col items-center">
      <Chip color="bg-white" className="shadow-sm">
        🗣️ EcoLangues · mot {index + 1} / {blueprint.vocab.length}
      </Chip>
      <div
        className="mt-3 flex h-36 w-36 items-center justify-center rounded-full border-4 bg-white text-7xl"
        style={{ borderColor: themeColor }}
      >
        <span className="anim-wiggle">{word.emoji}</span>
      </div>
      <p className="mt-4 font-display text-3xl">{word.motFr}</p>
      <p className="mt-1 text-center text-base font-bold text-ng-ink/70">
        « {word.phraseFr} »
      </p>

      <div className="mt-5 w-full rounded-3xl border-3 border-ng-purple/30 bg-[#FAEEFF] p-4">
        <p className="font-display text-xs uppercase tracking-widest text-ng-purple">
          En dioula
        </p>
        {showLocal ? (
          <p className="anim-pop mt-1 font-display text-2xl text-ng-purple-dark">
            {word.dioula ?? "—"}
          </p>
        ) : (
          <Btn
            variant="purple"
            size="sm"
            className="mt-2"
            onClick={() => {
              setShowLocal(true);
              if (word.dioula) speak(word.dioula, 0.8);
            }}
          >
            Découvrir le mot 🔊
          </Btn>
        )}
        <p className="mt-2 text-[11px] font-bold text-ng-ink/40">
          Traduction en cours de validation par des locuteurs natifs.
        </p>
      </div>

      <div className="mt-4 w-full">
        <SpeechBubble color="#B45CE2" size="sm">
          <button
            type="button"
            onClick={() => speak(`${word.motFr}. ${word.phraseFr}`)}
            className="font-display text-sm text-ng-purple"
          >
            🔊 Réécouter en français
          </button>
        </SpeechBubble>
      </div>

      <div className="mt-6 w-full">
        <Btn onClick={onNext} sound="pop">
          Mot suivant
        </Btn>
      </div>
    </div>
  );
}

function QuizStep({
  blueprint,
  index,
  selected,
  onSelect,
  onNext,
  themeColor,
}: {
  blueprint: LevelBlueprint;
  index: number;
  selected: string | null;
  onSelect: (reponse: string) => void;
  onNext: () => void;
  themeColor: string;
}) {
  const question = blueprint.quiz[index];
  const shuffled = useMemo(
    () => [...question.reponses].sort(() => Math.random() - 0.5),
    [question],
  );
  useEffect(() => {
    speak(question.question);
  }, [question]);

  const correct = selected !== null && selected === question.bonneReponse;

  return (
    <div className="anim-rise">
      <Chip color="bg-white" className="shadow-sm">
        ❓ Quiz {index + 1} / {blueprint.quiz.length}
      </Chip>
      <h2 className="mt-3 font-display text-2xl leading-tight">
        {question.question}
      </h2>
      <div className="mt-4 grid gap-3">
        {shuffled.map((reponse) => {
          const isCorrect = reponse === question.bonneReponse;
          const isChosen = reponse === selected;
          const state = !selected
            ? "idle"
            : isCorrect
              ? "good"
              : isChosen
                ? "bad"
                : "muted";
          return (
            <button
              key={reponse}
              type="button"
              disabled={Boolean(selected)}
              onClick={() => onSelect(reponse)}
              className={`btn3d tap-target flex items-center gap-3 px-4 py-4 text-left normal-case ${
                state === "good"
                  ? "border-ng-green-dark bg-ng-green text-white"
                  : state === "bad"
                    ? "anim-shake border-ng-red-dark bg-ng-red text-white"
                    : state === "muted"
                      ? "border-ng-ink/10 bg-white/60 text-ng-ink/40"
                      : "border-ng-ink/15 bg-white text-ng-ink"
              }`}
            >
              <span className="text-2xl">
                {state === "good" ? "✅" : state === "bad" ? "❌" : "🔹"}
              </span>
              <span className="font-display text-base leading-tight">
                {reponse}
              </span>
            </button>
          );
        })}
      </div>
      {selected ? (
        <div
          className={`anim-pop mt-4 rounded-3xl border-3 p-4 ${
            correct ? "border-ng-green bg-[#E8F8DC]" : "border-ng-red bg-[#FFE9E9]"
          }`}
        >
          <p className="font-display text-lg">
            {correct ? "✅ Exact !" : "💡 La bonne réponse était :"}
          </p>
          {!correct ? (
            <p className="font-display text-base text-ng-ink/70">
              {question.bonneReponse}
            </p>
          ) : null}
          <p className="mt-1 text-sm font-semibold text-ng-ink/70">
            {question.explication}
          </p>
          <div className="mt-3">
            <Btn variant={correct ? "green" : "red"} onClick={onNext} sound="none">
              Continuer
            </Btn>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs font-bold uppercase tracking-wide text-ng-ink/40">
          Choisis la bonne réponse · {themeColor ? "tu peux réécouter" : ""}
        </p>
      )}
    </div>
  );
}
