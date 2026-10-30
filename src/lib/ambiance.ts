"use client";

/* Sons d'ambiance des mondes, fabriqués en direct (bruit filtré, petits
   oscillateurs) : aucun fichier à télécharger, ça marche hors ligne.
   Volume très bas, montée et descente douces. */

import type { ZoneId } from "@/content/types";

import { ambianceAutorisee, getCtx } from "./audio";

type Ambiance = { zone: ZoneId; stop: () => void };
let enCours: Ambiance | null = null;

/** Bruit (blanc ou « brun », plus grave et doux) qui boucle sans fin. */
function bruit(ctx: AudioContext, brun: boolean): AudioBufferSourceNode {
  const duree = 3;
  const tampon = ctx.createBuffer(1, ctx.sampleRate * duree, ctx.sampleRate);
  const d = tampon.getChannelData(0);
  let dernier = 0;
  for (let i = 0; i < d.length; i += 1) {
    const blanc = Math.random() * 2 - 1;
    if (brun) {
      dernier = (dernier + 0.02 * blanc) / 1.02;
      d[i] = dernier * 3.5;
    } else d[i] = blanc;
  }
  const source = ctx.createBufferSource();
  source.buffer = tampon;
  source.loop = true;
  return source;
}

/** Couche de bruit filtré, avec une respiration lente du volume. */
function nappe(
  ctx: AudioContext,
  sortie: AudioNode,
  { brun, type, freq, q = 0.7, volume, respiration = 0 }: {
    brun: boolean;
    type: BiquadFilterType;
    freq: number;
    q?: number;
    volume: number;
    respiration?: number;
  },
) {
  const src = bruit(ctx, brun);
  const filtre = ctx.createBiquadFilter();
  filtre.type = type;
  filtre.frequency.value = freq;
  filtre.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(filtre).connect(gain).connect(sortie);
  const arrets: (() => void)[] = [() => src.stop()];
  if (respiration) {
    const lfo = ctx.createOscillator();
    const ampleur = ctx.createGain();
    lfo.frequency.value = respiration;
    ampleur.gain.value = volume * 0.45;
    lfo.connect(ampleur).connect(gain.gain);
    lfo.start();
    arrets.push(() => lfo.stop());
  }
  src.start();
  return () => arrets.forEach((a) => a());
}

/** Répète `jouer` à intervalles irréguliers (entre min et max secondes). */
function auHasard(jouer: () => void, min: number, max: number) {
  let t = 0;
  const suivant = () => {
    t = window.setTimeout(() => {
      jouer();
      suivant();
    }, (min + Math.random() * (max - min)) * 1000);
  };
  suivant();
  return () => window.clearTimeout(t);
}

/** Petit son bref : une note qui glisse (oiseau, grillon) ou un craquement. */
function note(ctx: AudioContext, sortie: AudioNode, de: number, a: number, duree: number, volume: number, debut = 0) {
  const t = ctx.currentTime + debut;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(de, t);
  osc.frequency.exponentialRampToValueAtTime(a, t + duree);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + duree * 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  osc.connect(gain).connect(sortie);
  osc.start(t);
  osc.stop(t + duree + 0.02);
}

function craquement(ctx: AudioContext, sortie: AudioNode, volume: number) {
  const src = bruit(ctx, false);
  const filtre = ctx.createBiquadFilter();
  filtre.type = "highpass";
  filtre.frequency.value = 3000;
  const gain = ctx.createGain();
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05 + Math.random() * 0.05);
  src.connect(filtre).connect(gain).connect(sortie);
  src.start(t);
  src.stop(t + 0.12);
}

const RECETTES: Record<ZoneId, (ctx: AudioContext, sortie: AudioNode) => (() => void)[]> = {
  // Le marché : un murmure de voix lointaines qui va et vient.
  "village-tri": (ctx, sortie) => [
    nappe(ctx, sortie, { brun: true, type: "bandpass", freq: 480, q: 0.9, volume: 0.05, respiration: 0.23 }),
    nappe(ctx, sortie, { brun: true, type: "bandpass", freq: 900, q: 1.2, volume: 0.018, respiration: 0.41 }),
  ],
  // La rivière : un courant grave et des petites gouttes claires.
  "riviere-vivante": (ctx, sortie) => [
    nappe(ctx, sortie, { brun: true, type: "lowpass", freq: 520, volume: 0.07, respiration: 0.12 }),
    nappe(ctx, sortie, { brun: false, type: "bandpass", freq: 2600, q: 2.5, volume: 0.006, respiration: 0.9 }),
    auHasard(() => note(ctx, sortie, 900 + Math.random() * 600, 1700, 0.06, 0.02), 0.6, 2.2),
  ],
  // La forêt : le vent dans les feuilles et des oiseaux.
  "foret-decouvertes": (ctx, sortie) => [
    nappe(ctx, sortie, { brun: true, type: "lowpass", freq: 380, volume: 0.04, respiration: 0.09 }),
    auHasard(
      () => {
        const base = 2300 + Math.random() * 1400;
        const notes = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < notes; i += 1) note(ctx, sortie, base, base * 1.35, 0.09, 0.035, i * 0.13);
      },
      1.4,
      4,
    ),
  ],
  // Le village la nuit : des grillons et, de temps en temps, un petit grésillement.
  "royaume-energie": (ctx, sortie) => [
    nappe(ctx, sortie, { brun: true, type: "lowpass", freq: 300, volume: 0.025, respiration: 0.07 }),
    auHasard(
      () => {
        for (let i = 0; i < 3; i += 1) note(ctx, sortie, 4400, 4600, 0.04, 0.012, i * 0.07);
      },
      0.8,
      2,
    ),
    auHasard(() => craquement(ctx, sortie, 0.02), 3, 7),
  ],
};

/** Lance l'ambiance d'un monde (remplace l'ambiance en cours). */
export function lancerAmbiance(zone: ZoneId) {
  if (enCours?.zone === zone) return;
  arreterAmbiance();
  if (!ambianceAutorisee()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const maitre = ctx.createGain();
  maitre.gain.setValueAtTime(0.0001, ctx.currentTime);
  maitre.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.5);
  maitre.connect(ctx.destination);
  const arrets = RECETTES[zone](ctx, maitre);
  enCours = {
    zone,
    stop: () => {
      const t = ctx.currentTime;
      maitre.gain.cancelScheduledValues(t);
      maitre.gain.setValueAtTime(Math.max(0.0001, maitre.gain.value), t);
      maitre.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      window.setTimeout(() => {
        arrets.forEach((a) => a());
        maitre.disconnect();
      }, 700);
    },
  };
}

export function arreterAmbiance() {
  enCours?.stop();
  enCours = null;
}

/** Zone en cours (pour la relancer quand on rallume les sons). */
export function zoneAmbiance() {
  return enCours?.zone ?? null;
}
