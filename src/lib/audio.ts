"use client";

/* Audio essentiel : instructions vocales (synthèse vocale) + retours sonores.
   Tout fonctionne hors ligne, sans fichier audio à télécharger. */

let audioCtx: AudioContext | null = null;

/** Préférences de l'enfant : les sons et la voix peuvent être coupés. */
const prefs = { sons: true, voix: true, ambiance: true };

export function reglerAudio(next: { sons: boolean; voix: boolean; ambiance: boolean }) {
  prefs.sons = next.sons;
  prefs.voix = next.voix;
  prefs.ambiance = next.ambiance;
  if (!next.voix) stopSpeaking();
}

/** Les sons d'ambiance jouent seulement si les sons ET l'ambiance sont activés. */
export function ambianceAutorisee() {
  return prefs.sons && prefs.ambiance;
}

export function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

export type Tone = "good" | "bad" | "win" | "tap" | "pop" | "clac";

const RECIPES: Record<Tone, { freqs: number[]; duration: number; type: OscillatorType }> = {
  good: { freqs: [660, 880], duration: 0.16, type: "sine" },
  // Son d'erreur doux (pas de « buzzer ») : on se trompe, on réessaie.
  bad: { freqs: [392, 330], duration: 0.14, type: "sine" },
  win: { freqs: [523, 659, 784, 1046], duration: 0.15, type: "sine" },
  tap: { freqs: [520], duration: 0.05, type: "sine" },
  pop: { freqs: [880, 1320], duration: 0.09, type: "sine" },
  // Couvercle de poubelle qui se referme.
  clac: { freqs: [196, 147], duration: 0.07, type: "triangle" },
};

export function playTone(tone: Tone) {
  if (!prefs.sons) return;
  const ctx = getCtx();
  if (!ctx) return;
  const recipe = RECIPES[tone];
  recipe.freqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = recipe.type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + index * recipe.duration;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + recipe.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + recipe.duration + 0.02);
  });
}

let frVoice: SpeechSynthesisVoice | null = null;

function pickFrenchVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (frVoice) return frVoice;
  const voices = window.speechSynthesis.getVoices();
  frVoice =
    voices.find((v) => v.lang?.toLowerCase().startsWith("fr")) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ??
    null;
  return frVoice;
}

export function speak(text: string, rate = 0.92) {
  if (!prefs.voix) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = rate;
    utterance.pitch = 1.12;
    const voice = pickFrenchVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* la synthèse vocale n'est pas disponible : l'expérience reste jouable */
  }
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export function warmUpAudio() {
  getCtx();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
  }
}
