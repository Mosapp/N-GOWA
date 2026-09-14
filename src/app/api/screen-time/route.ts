import { readDeviceId } from "@/lib/server/session";
import { addScreenTime, isOwnedByDevice } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profileId?: number;
      secondes?: number;
      pause?: boolean;
    };
    const profileId = Number(body.profileId);
    const secondes = Math.max(0, Math.min(3600, Number(body.secondes) || 0));

    if (!Number.isFinite(profileId) || profileId <= 0) {
      return Response.json({ error: "profileId invalide" }, { status: 400 });
    }

    const deviceId = readDeviceId(request);
    if (!deviceId || !(await isOwnedByDevice(profileId, deviceId))) {
      return Response.json({ error: "profil introuvable" }, { status: 404 });
    }

    const result = await addScreenTime(profileId, secondes, Boolean(body.pause));
    if (!result) {
      return Response.json({ error: "profil introuvable" }, { status: 404 });
    }
    return Response.json(result);
  } catch (error) {
    console.error("[api/screen-time]", error);
    return Response.json({ error: "erreur serveur" }, { status: 500 });
  }
}
