import { endSpeech } from "@/lib/debate-store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/rooms/[code]/speech/end">,
) {
  const { code } = await context.params;
  const body = (await request.json()) as {
    participantId?: string;
    transcript?: string;
    startedAt?: string;
    endedAt?: string;
    peakVolume?: number;
    source?: "speech" | "manual";
  };

  if (!body.participantId || !body.startedAt || !body.endedAt) {
    return Response.json(
      { error: "participantId, startedAt, endedAt이 필요합니다." },
      { status: 400 },
    );
  }

  try {
    return Response.json(
      endSpeech(code, {
        participantId: body.participantId,
        transcript: body.transcript ?? "",
        startedAt: body.startedAt,
        endedAt: body.endedAt,
        peakVolume: Number(body.peakVolume ?? 0),
        source: body.source ?? "speech",
      }),
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "발언 저장에 실패했습니다.",
      },
      { status: 400 },
    );
  }
}
