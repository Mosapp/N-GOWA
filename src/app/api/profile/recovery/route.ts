import { NextResponse } from "next/server";

import {
    createPinRecovery,
    findProfileByParentEmail,
} from "@/lib/server/store";
import {
    generateRecoveryToken,
    hashRecoveryToken,
} from "@/lib/server/pinRecovery";

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as {
            email?: string;
        };

        const email = (body.email ?? "").trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "E-mail invalide." },
                { status: 400 },
            );
        }

        const profile = await findProfileByParentEmail(email);

        if (!profile) {
            return NextResponse.json({ ok: true });
        }

        const token = generateRecoveryToken();
        const tokenHash = hashRecoveryToken(token);

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await createPinRecovery(profile.id, tokenHash, expiresAt);

        console.log("[PIN RECOVERY TOKEN]", token);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[api/profile/recovery POST]", error);

        return NextResponse.json(
            { error: "Erreur serveur." },
            { status: 500 },
        );
    }
}