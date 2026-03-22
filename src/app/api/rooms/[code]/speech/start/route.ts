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
    const message =
      error instanceof Error && error.message === "ROOM_NOT_ACTIVE"
        ? "토론이 아직 시작되지 않았거나 이미 종료되었습니다."
        : "음성 시작 처리에 실패했습니다.";
    return Response.json(
      { error: message },
      { status: 400 },
    );
  }
}
