import { readDeviceId } from "@/lib/server/session";
import { completeLevel, getState, isOwnedByDevice } from "@/lib/server/store";
import type { CompleteLevelPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CompleteLevelPayload>;
    const profileId = Number(body.profileId);
    const levelId = Number(body.levelId);

    if (!Number.isFinite(profileId) || !Number.isFinite(levelId)) {
      return Response.json({ error: "paramètres invalides" }, { status: 400 });
    }

    const deviceId = readDeviceId(request);
    if (!deviceId || !(await isOwnedByDevice(profileId, deviceId))) {
      return Response.json({ error: "niveau introuvable" }, { status: 404 });
    }

    const result = await completeLevel({
      profileId,
      levelId,
      jeuScore: Math.max(0, Number(body.jeuScore) || 0),
      jeuTotal: Math.max(0, Number(body.jeuTotal) || 0),
      quizScore: Math.max(0, Number(body.quizScore) || 0),
      quizTotal: Math.max(0, Number(body.quizTotal) || 0),
      actionFaite: Boolean(body.actionFaite),
      secondes: Math.max(0, Number(body.secondes) || 0),
    });

    if (!result) {
      return Response.json({ error: "niveau introuvable" }, { status: 404 });
    }

    const state = await getState(profileId);
    return Response.json({ ...result, state });
  } catch (error) {
    console.error("[api/level/complete]", error);
    return Response.json({ error: "erreur serveur" }, { status: 500 });
  }
}
