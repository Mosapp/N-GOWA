import { readDeviceId } from "@/lib/server/session";
import { getState, isOwnedByDevice } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const profileId = Number(url.searchParams.get("profileId"));
  if (!Number.isFinite(profileId) || profileId <= 0) {
    return Response.json({ error: "profileId invalide" }, { status: 400 });
  }

  // On ne renvoie les données que si la requête vient de l'appareil qui a
  // créé ce profil. Même message d'erreur que "profil introuvable" pour ne
  // pas révéler à un tiers qu'un profileId existe mais appartient à
  // quelqu'un d'autre.
  const deviceId = readDeviceId(request);
  if (!deviceId || !(await isOwnedByDevice(profileId, deviceId))) {
    return Response.json({ error: "profil introuvable" }, { status: 404 });
  }

  try {
    const state = await getState(profileId);
    if (!state) {
      return Response.json({ error: "profil introuvable" }, { status: 404 });
    }
    return Response.json(state);
  } catch (error) {
    console.error("[api/state]", error);
    return Response.json({ error: "erreur serveur" }, { status: 500 });
  }
}
