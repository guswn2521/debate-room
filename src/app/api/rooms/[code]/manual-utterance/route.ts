import { endSpeech } from "@/lib/debate-store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/rooms/[code]/manual-utterance">,
) {
  const { code } = await context.params;
  const body = (await request.json()) as {
    participantId?: string;
    transcript?: string;
  };

  if (!body.participantId || !body.transcript?.trim()) {
    return Response.json(
      { error: "participantId와 transcript가 필요합니다." },
      { status: 400 },
    );
  }

  const timestamp = new Date().toISOString();

  try {
    return Response.json(
      endSpeech(code, {
        participantId: body.participantId,
        transcript: body.transcript,
        startedAt: timestamp,
        endedAt: timestamp,
        peakVolume: 0.2,
        source: "manual",
      }),
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "수동 발언 저장에 실패했습니다.",
      },
      { status: 400 },
    );
  }
}
