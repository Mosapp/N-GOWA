import { hashPin, isValidPinFormat } from "@/lib/server/pin";
import { clientKey, rateLimit } from "@/lib/server/rateLimit";
import { ensureDeviceId, readDeviceId, withDeviceCookie } from "@/lib/server/session";
import {
  checkParentPin,
  createProfile,
  deleteProfile,
  getState,
  isOwnedByDevice,
} from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(`create:${clientKey(request)}`, {
    max: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.allowed) {
    return Response.json(
      { error: "Trop de créations de profil. Réessaie plus tard." },
      { status: 429 },
    );
  }
  try {
    const body = (await request.json()) as {
      pseudo?: string;
      age?: number;
      avatar?: string;
      langue?: string;
      langueLocale?: string;
      parentPin?: string;
      parentEmail?: string;
    };

    const pseudo = (body.pseudo ?? "").trim().slice(0, 20);
    const age = Number(body.age);
    const avatar = (body.avatar ?? "kofi").slice(0, 30);

    if (pseudo.length < 2) {
      return Response.json(
        { error: "Ton pseudo doit avoir au moins 2 lettres !" },
        { status: 400 },
      );
    }
    const parentEmail = (body.parentEmail ?? "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
      return Response.json(
        { error: "L'e-mail du parent est invalide." },
        { status: 400 },
      );
    }
    if (!Number.isFinite(age) || age < 3 || age > 12) {
      return Response.json({ error: "Choisis un âge entre 3 et 12 ans." }, { status: 400 });
    }
    if (!isValidPinFormat(body.parentPin)) {
      return Response.json(
        { error: "Le code parent doit être composé de 4 chiffres." },
        { status: 400 },
      );
    }

    // Rattache ce profil à l'appareil courant (cookie signé, invisible pour
    // l'utilisateur). C'est ce qui empêchera un tiers d'accéder à ce profil
    // depuis un autre appareil, même en connaissant son identifiant.
    const { deviceId, setCookieHeader } = ensureDeviceId(request);

    const profile = await createProfile({
      pseudo,
      age: Math.round(age),
      avatar,
      langue: body.langue === "fr" ? "fr" : "fr",
      langueLocale: body.langueLocale === "baoule" ? "baoule" : "dioula",
      deviceId,
      parentPinHash: hashPin(body.parentPin),
      parentEmail,
    });

    const state = await getState(profile.id);
    const response = Response.json({ profile, state }, { status: 201 });
    return withDeviceCookie(response, setCookieHeader);
  } catch (error) {
    console.error("[api/profile POST]", error);
    return Response.json({ error: "erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const limited = rateLimit(`delete:${clientKey(request)}`, {
    max: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.allowed) {
    return Response.json({ error: "Trop de tentatives. Réessaie plus tard." }, { status: 429 });
  }
  const url = new URL(request.url);
  const profileId = Number(url.searchParams.get("profileId"));
  const parentPin = url.searchParams.get("parentPin") ?? "";

  if (!Number.isFinite(profileId) || profileId <= 0) {
    return Response.json({ error: "profileId invalide" }, { status: 400 });
  }
  if (!isValidPinFormat(parentPin)) {
    return Response.json(
      { error: "Code parent invalide (4 chiffres attendus)." },
      { status: 400 },
    );
  }

  // Le profil doit appartenir à l'appareil qui fait la demande.
  const deviceId = readDeviceId(request);
  if (!deviceId || !(await isOwnedByDevice(profileId, deviceId))) {
    return Response.json({ error: "profil introuvable" }, { status: 404 });
  }

  try {
    const pinResult = await checkParentPin(profileId, parentPin);
    if (!pinResult.ok) {
      if (pinResult.reason === "locked") {
        return Response.json(
          { error: "Trop de tentatives. Réessaie dans 15 minutes." },
          { status: 429 },
        );
      }
      return Response.json({ error: "Code parent incorrect." }, { status: 403 });
    }

    await deleteProfile(profileId);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/profile DELETE]", error);
    return Response.json({ error: "erreur serveur" }, { status: 500 });
  }
}
