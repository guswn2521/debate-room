import { requestRaise } from "@/lib/debate-store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/rooms/[code]/raise">,
) {
  const { code } = await context.params;
  const body = (await request.json()) as { participantId?: string };

  if (!body.participantId) {
    return Response.json({ error: "participantId가 필요합니다." }, { status: 400 });
  }

  try {
    return Response.json(requestRaise(code, body.participantId));
  } catch (error) {
    const message =
      error instanceof Error && error.message === "WAITING_FOR_PARTICIPANTS"
        ? "아직 모든 인원이 입장하지 않았습니다."
        : error instanceof Error && error.message === "ROOM_ENDED"
          ? "이미 종료된 토론방입니다."
          : "발언 요청을 처리하지 못했습니다.";
    return Response.json(
      { error: message },
      { status: 400 },
    );
  }
}
