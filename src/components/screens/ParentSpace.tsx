"use client";

import { useState } from "react";

import { IconLock, IconSheet } from "@/components/icons";
import type { Naviguer } from "@/components/navigation";
import { Btn, ProgressBar, ScreenHeader } from "@/components/ui";
import { CarteInstallation } from "@/components/Installation";
import { Toggle } from "@/components/screens/Shell";
import type { TrancheAge } from "@/content/types";
import { DEFI_BY_ID, DEFIS_REELS } from "@/content/village";
import { estBloque, hacherPin, nouveauSel, pinValide, questionAdulte, verifierPin } from "@/lib/game/parentPin";
import { remettreDefiAFaire, validerDefi } from "@/lib/game/rules";
import { sauvegardeVide, type Reglages, type Sauvegarde } from "@/lib/game/save";
import { accorderBonus, limiteJour, limitesPour } from "@/lib/game/screenTime";
import { infosStockage, modifierSauvegarde } from "@/lib/game/store";
import { playTone } from "@/lib/audio";

function hashJour(texte: string) {
  let h = 7;
  for (const c of texte) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return h;
}

const TRANCHES: { id: TrancheAge; label: string }[] = [
  { id: "4-5", label: "4-5 ans" },
  { id: "6-8", label: "6-8 ans" },
  { id: "9-10", label: "9-10 ans" },
];

/**
 * Espace parent : séparé de l'espace enfant par un code à 4 chiffres.
 * Validation des défis, temps d'écran, tranche d'âge, réglages, données.
 */
export function ParentSpace({
  save,
  defiId,
  naviguer,
  now,
}: {
  save: Sauvegarde;
  defiId?: string;
  naviguer: Naviguer;
  now: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  const retour = () => naviguer({ nom: defiId ? "defis" : "carte" }, { remplacer: true });

  return (
    <div className="min-h-[100dvh] bg-[#F4F1EC]">
      <ScreenHeader
        title="Espace parent"
        onBack={retour}
        right={<IconLock size={26} className="text-ng-muted" />}
      />
      <main className="mx-auto w-full max-w-xl px-4 pb-12">
        {!ouvert ? (
          save.parent.pinHash ? (
            <EntrerCode save={save} now={now} onOk={() => setOuvert(true)} />
          ) : (
            <CreerCode question={questionAdulte(hashJour(save.temps.date))} onOk={() => setOuvert(true)} />
          )
        ) : (
          <Tableau save={save} defiId={defiId} naviguer={naviguer} />
        )}
      </main>
    </div>
  );
}

/* ------------------------------ Code parent ------------------------------- */

function ChampCode({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-display text-lg">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        type="password"
        autoComplete="off"
        maxLength={4}
        className="mt-1 w-full rounded-2xl border-3 border-ng-ink/15 bg-white px-4 py-3 text-center font-display text-3xl tracking-[0.5em] outline-none focus:border-ng-blue"
        style={{ borderWidth: 3 }}
      />
    </div>
  );
}

function CreerCode({ question, onOk }: { question?: { texte: string; reponse: number }; onOk: () => void }) {
  const [reponse, setReponse] = useState("");
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const adulte = !question || Number(reponse) === question.reponse;

  const creer = async () => {
    if (!adulte) return setErreur("La réponse au calcul n'est pas la bonne.");
    if (!pinValide(pin)) return setErreur("Le code doit contenir 4 chiffres.");
    if (pin !== confirmation) return setErreur("Les deux codes ne sont pas identiques.");
    const sel = nouveauSel();
    const pinHash = await hacherPin(pin, sel);
    modifierSauvegarde((s) => ({ ...s, parent: { pinHash, sel, echecs: 0, bloqueJusqua: null } }));
    playTone("good");
    onOk();
  };

  return (
    <section className="card-ng mt-4 p-5">
      <h2 className="font-display text-2xl">Bienvenue, parent ou éducateur</h2>
      <p className="mt-2 font-semibold text-ng-muted">
        Créez un code à 4 chiffres pour protéger cet espace (validation des défis, temps d&apos;écran,
        effacement). Le code reste sur cet appareil.
      </p>
      <div className="mt-4 grid gap-4">
        {question ? (
        <div>
          <label htmlFor="calcul" className="block font-display text-lg">
            Pour commencer, combien font {question.texte} ?
          </label>
          <input
            id="calcul"
            value={reponse}
            onChange={(e) => setReponse(e.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
            className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-center font-display text-2xl outline-none focus:border-ng-blue"
            style={{ border: "3px solid rgba(45,42,38,0.15)" }}
          />
        </div>
        ) : null}
        <ChampCode id="pin" label="Nouveau code" value={pin} onChange={setPin} />
        <ChampCode id="pin2" label="Confirmez le code" value={confirmation} onChange={setConfirmation} />
      </div>
      {erreur ? <p className="mt-3 font-bold text-ng-coral-dark" role="alert">{erreur}</p> : null}
      <div className="mt-5">
        <Btn variant="blue" onClick={creer} disabled={(question && !reponse) || pin.length < 4 || confirmation.length < 4}>
          Créer le code
        </Btn>
      </div>
    </section>
  );
}

function EntrerCode({ save, now, onOk }: { save: Sauvegarde; now: number; onOk: () => void }) {
  const [pin, setPin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const bloque = estBloque(save.parent, now);
  const reste = bloque && save.parent.bloqueJusqua ? Math.ceil((save.parent.bloqueJusqua - now) / 1000) : 0;

  const valider = async () => {
    const r = await verifierPin(save.parent, pin, Date.now());
    modifierSauvegarde((s) => ({ ...s, parent: r.parent }));
    if (r.ok) {
      playTone("good");
      onOk();
    } else {
      setPin("");
      setErreur("Ce n'est pas le bon code.");
    }
  };

  return (
    <section className="card-ng mt-4 p-5">
      <h2 className="font-display text-2xl">Cet espace est réservé aux adultes</h2>
      <p className="mt-1 font-semibold text-ng-muted">Entrez le code parent à 4 chiffres.</p>
      <div className="mt-4">
        <ChampCode id="pin-entree" label="Code parent" value={pin} onChange={setPin} />
      </div>
      {bloque ? (
        <p className="mt-3 font-bold text-ng-coral-dark" role="alert">
          Trop d&apos;essais. Réessayez dans {reste} secondes.
        </p>
      ) : erreur ? (
        <p className="mt-3 font-bold text-ng-coral-dark" role="alert">
          {erreur}
        </p>
      ) : null}
      <div className="mt-5">
        <Btn variant="blue" onClick={valider} disabled={bloque || pin.length < 4}>
          Ouvrir
        </Btn>
      </div>
      <p className="mt-4 text-sm font-semibold text-ng-muted">
        Code oublié ? Il n&apos;existe pas de récupération à distance (aucun compte, aucune donnée en ligne).
        Vous pouvez effacer les données du site dans les réglages du navigateur : la progression sera perdue.
      </p>
    </section>
  );
}

/* -------------------------------- Tableau --------------------------------- */

function Tableau({ save, defiId, naviguer }: { save: Sauvegarde; defiId?: string; naviguer: Naviguer }) {
  const [effacer, setEffacer] = useState(false);
  const [changerCode, setChangerCode] = useState(false);
  const profil = save.profil;
  const iso = () => new Date().toISOString();
  const enAttente = DEFIS_REELS.filter((d) => save.defis[d.id]?.statut === "declare");
  // Le défi que l'enfant vient de montrer apparaît en premier.
  const declares = [...enAttente.filter((d) => d.id === defiId), ...enAttente.filter((d) => d.id !== defiId)];
  const valides = DEFIS_REELS.filter((d) => save.defis[d.id]?.statut === "valide");
  const L = profil ? limitesPour(profil.tranche) : null;
  const stockage = infosStockage();
  const minutes = (s: number) => Math.round(s / 60);

  const basculer = (cle: keyof Reglages) =>
    modifierSauvegarde((s) => ({ ...s, reglages: { ...s.reglages, [cle]: !s.reglages[cle] } }));

  return (
    <div className="mt-2 grid gap-4">
      {!stockage.ecritureOk ? (
        <p className="rounded-2xl bg-ng-coral-soft p-3 font-bold text-ng-coral-dark" role="alert">
          Attention : cet appareil refuse d&apos;enregistrer les données (navigation privée ou stockage plein).
          La progression risque d&apos;être perdue en fermant l&apos;application.
        </p>
      ) : null}

      {/* Défis à valider */}
      <section className="card-ng p-5">
        <h2 className="font-display text-2xl">Défis du vrai monde</h2>
        <p className="mt-1 text-sm font-semibold text-ng-muted">
          Validez seulement ce que vous avez vu, ou ce dont vous avez parlé avec l&apos;enfant. Aucune photo
          n&apos;est demandée.
        </p>
        {declares.length ? (
          <ul className="mt-3 grid gap-3">
            {declares.map((d) => (
              <li
                key={d.id}
                className={`rounded-2xl p-3 ${d.id === defiId ? "bg-ng-sun-soft ring-4 ring-ng-yellow" : "bg-ng-cream"}`}
              >
                <p className="font-display text-lg">
                  {d.emoji} {d.titre}
                </p>
                <p className="font-semibold">{d.consigne.grand}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Btn
                    size="sm"
                    sound="win"
                    onClick={() => modifierSauvegarde((s) => validerDefi(s, d.id, iso()).save)}
                  >
                    Je valide
                  </Btn>
                  <Btn size="sm" variant="white" onClick={() => modifierSauvegarde((s) => remettreDefiAFaire(s, d.id))}>
                    Pas encore
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl bg-ng-cream p-3 font-semibold">Aucun défi en attente de validation.</p>
        )}
        {valides.length ? (
          <p className="mt-3 text-sm font-bold text-ng-green-dark">
            Déjà validés : {valides.map((d) => DEFI_BY_ID[d.id].titre).join(", ")}.
          </p>
        ) : null}
      </section>

      {/* Fiche */}
      <section className="card-ng p-5">
        <h2 className="font-display text-2xl">Fiche de progression</h2>
        <p className="mt-1 text-sm font-semibold text-ng-muted">
          Une page simple à consulter ou imprimer : points de jeu, compétences, défis déclarés et validés.
        </p>
        <div className="mt-3">
          <Btn variant="white" onClick={() => naviguer({ nom: "fiche" })}>
            <IconSheet size={24} /> Voir la fiche
          </Btn>
        </div>
      </section>

      {/* Temps d'écran */}
      {profil && L ? (
        <section className="card-ng p-5">
          <h2 className="font-display text-2xl">Temps de jeu</h2>
          <p className="mt-1 font-semibold">
            Aujourd&apos;hui : {minutes(save.temps.secondesJour)} min sur {minutes(limiteJour(save.temps, L))} min
          </p>
          <div className="mt-2">
            <ProgressBar value={save.temps.secondesJour} max={limiteJour(save.temps, L)} color="bg-ng-blue" height="h-3" label="temps de jeu du jour" />
          </div>
          <p className="mt-2 text-sm font-semibold text-ng-muted">
            Pour {profil.tranche} ans : sessions de {minutes(L.sessionSec)} min, pause de {minutes(L.pauseSec)} min,
            {" "}{minutes(L.jourSec)} min maximum par jour. Seul le temps où l&apos;application est affichée est compté,
            et une mission commencée peut toujours se terminer.
          </p>
          <div className="mt-3">
            <Btn
              variant="white"
              size="sm"
              onClick={() => modifierSauvegarde((s) => ({ ...s, temps: accorderBonus(s.temps, 10) }))}
            >
              Accorder 10 minutes de plus aujourd&apos;hui
            </Btn>
          </div>
        </section>
      ) : null}

      {/* Tranche d'âge */}
      {profil ? (
        <section className="card-ng p-5">
          <h2 className="font-display text-2xl">Tranche d&apos;âge</h2>
          <p className="mt-1 text-sm font-semibold text-ng-muted">
            Elle règle la difficulté (4-5 ans : consignes vocales et moins de choix ; 6-10 ans : plus de bacs et une
            question de compréhension) et le temps de jeu.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {TRANCHES.map((t) => (
              <Btn
                key={t.id}
                size="sm"
                variant={profil.tranche === t.id ? "green" : "white"}
                onClick={() =>
                  modifierSauvegarde((s) => (s.profil ? { ...s, profil: { ...s.profil, tranche: t.id } } : s))
                }
              >
                {t.label}
              </Btn>
            ))}
          </div>
        </section>
      ) : null}

      {/* Réglages */}
      <section className="card-ng p-5">
        <h2 className="font-display text-2xl">Réglages</h2>
        <div className="mt-3 grid gap-2">
          <Toggle label="Sons" emoji="🔔" actif={save.reglages.sons} onClick={() => basculer("sons")} />
          <Toggle label="Voix" emoji="🗣️" actif={save.reglages.voix} onClick={() => basculer("voix")} />
          <Toggle label="Bruits de la nature" emoji="🐦" actif={save.reglages.ambiance} onClick={() => basculer("ambiance")} />
          <Toggle
            label="Animations réduites"
            emoji="🐢"
            actif={save.reglages.animationsReduites}
            onClick={() => basculer("animationsReduites")}
          />
          <Toggle
            label="Ouvrir tous les mondes"
            emoji="🔓"
            actif={save.reglages.toutOuvert}
            onClick={() => basculer("toutOuvert")}
          />
        </div>
        <p className="mt-2 text-sm text-ng-muted">
          Pour tester ou rejouer : toutes les missions s&apos;ouvrent, sans donner de points ni de pins.
        </p>
      </section>

      <CarteInstallation />

      {/* Données */}
      <section className="card-ng p-5">
        <h2 className="font-display text-2xl">Données et confidentialité</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 font-semibold text-ng-muted">
          <li>Aucun compte, aucune adresse e-mail, aucune publicité, aucun achat.</li>
          <li>Le surnom, l&apos;avatar et la progression restent uniquement sur cet appareil.</li>
          <li>Aucun profil public, aucun classement entre enfants.</li>
          <li>Effacer les données du navigateur supprime aussi la progression.</li>
        </ul>
        <div className="mt-4 grid gap-2">
          {changerCode ? (
            <CreerCode onOk={() => setChangerCode(false)} />
          ) : (
            <Btn variant="white" size="sm" onClick={() => setChangerCode(true)}>
              Changer le code parent
            </Btn>
          )}
          {effacer ? (
            <div className="rounded-2xl bg-ng-coral-soft p-3">
              <p className="font-bold text-ng-coral-dark">
                Tout effacer ? Le profil, les points, les pins et les défis de cet appareil seront supprimés.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Btn
                  size="sm"
                  variant="coral"
                  onClick={() => {
                    modifierSauvegarde(() => sauvegardeVide(Date.now()));
                    naviguer({ nom: "accueil" }, { remplacer: true });
                  }}
                >
                  Oui, effacer
                </Btn>
                <Btn size="sm" variant="white" onClick={() => setEffacer(false)}>
                  Annuler
                </Btn>
              </div>
            </div>
          ) : (
            <Btn variant="white" size="sm" onClick={() => setEffacer(true)}>
              Effacer la progression
            </Btn>
          )}
        </div>
      </section>
    </div>
  );
}
