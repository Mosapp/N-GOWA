"use client";

import { useState } from "react";

import { Btn, Sheet } from "@/components/ui";
import { installer, useInstallation } from "@/lib/installation";

/** Le geste à faire sur iPhone / iPad (Safari ne propose pas de bouton). */
function GesteIos() {
  return (
    <ol className="mt-2 grid gap-2 text-left text-base">
      <li className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ng-blue text-white">1</span>
        <span>
          Touchez <strong>Partager</strong>{" "}
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" className="inline align-text-bottom text-ng-blue">
            <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>{" "}
          en bas de Safari.
        </span>
      </li>
      <li className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ng-blue text-white">2</span>
        <span>
          Choisissez <strong>Sur l&apos;écran d&apos;accueil</strong>.
        </span>
      </li>
    </ol>
  );
}

/** Carte de l'espace parent : installer l'app ou expliquer comment faire. */
export function CarteInstallation() {
  const { installee, possible, ios } = useInstallation();
  return (
    <section className="card-ng p-5">
      <h2 className="font-display text-2xl">Installer l&apos;application</h2>
      {installee ? (
        <p className="mt-2 font-bold text-ng-green-dark">✓ N&apos;GOWA est installée sur cet appareil.</p>
      ) : (
        <>
          <p className="mt-1 text-ng-muted">
            N&apos;GOWA s&apos;ouvre alors comme une vraie application, en plein écran, même sans internet.
          </p>
          {possible ? (
            <div className="mt-3">
              <Btn onClick={() => void installer()}>📲 Installer sur cet appareil</Btn>
            </div>
          ) : ios ? (
            <GesteIos />
          ) : (
            <p className="mt-2 text-base">
              Ouvrez le menu du navigateur (⋮), puis choisissez <strong>Installer l&apos;application</strong> ou{" "}
              <strong>Ajouter à l&apos;écran d&apos;accueil</strong>.
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Petit bouton de l'accueil, visible seulement quand l'installation est possible. */
export function BoutonInstaller() {
  const { installee, possible, ios } = useInstallation();
  const [aide, setAide] = useState(false);
  if (installee || (!possible && !ios)) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => (possible ? void installer() : setAide(true))}
        className="mx-auto mt-3 flex min-h-[44px] items-center gap-2 rounded-full bg-white/85 px-4 font-display text-base text-ng-green-dark shadow"
      >
        📲 Installer l&apos;app sur ce téléphone
      </button>
      {aide ? (
        <Sheet label="Installer N'GOWA" onClose={() => setAide(false)}>
          <h2 className="font-display text-2xl">Installer N&apos;GOWA</h2>
          <GesteIos />
          <div className="mt-4">
            <Btn onClick={() => setAide(false)}>J&apos;ai compris</Btn>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}
