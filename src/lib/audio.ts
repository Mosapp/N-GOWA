"use client";

/* Audio essentiel : instructions vocales (synthèse vocale) + retours sonores.
   Tout fonctionne hors ligne, sans fichier audio à télécharger. */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
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

type Tone = "good" | "bad" | "win" | "tap" | "pop";

const RECIPES: Record<Tone, { freqs: number[]; duration: number; type: OscillatorType }> = {
  good: { freqs: [660, 880], duration: 0.16, type: "sine" },
  bad: { freqs: [220, 165], duration: 0.22, type: "triangle" },
  win: { freqs: [523, 659, 784, 1046], duration: 0.15, type: "sine" },
  tap: { freqs: [420], duration: 0.06, type: "square" },
  pop: { freqs: [880, 1320], duration: 0.09, type: "sine" },
};

export function playTone(tone: Tone) {
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
