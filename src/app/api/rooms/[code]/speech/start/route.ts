import { startSpeech } from "@/lib/debate-store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/rooms/[code]/speech/start">,
) {
  const { code } = await context.params;
  const body = (await request.json()) as {
    participantId?: string;
    startedAt?: string;
  };

  if (!body.participantId || !body.startedAt) {
    return Response.json(
      { error: "participantId와 startedAt이 필요합니다." },
      { status: 400 },
    );
  }

  try {
    return Response.json(startSpeech(code, body.participantId, body.startedAt));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "음성 시작 처리에 실패했습니다.",
      },
      { status: 400 },
    );
  }
}
