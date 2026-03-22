import { leaveRoom } from "@/lib/debate-store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/rooms/[code]/leave">,
) {
  const { code } = await context.params;
  const body = (await request.json()) as { participantId?: string };

  if (!body.participantId) {
    return Response.json({ error: "participantId가 필요합니다." }, { status: 400 });
  }

  try {
    return Response.json(leaveRoom(code, body.participantId));
  } catch (error) {
    const message =
      error instanceof Error && error.message === "LEAVE_ONLY_WAITING"
        ? "대기실에서만 홈으로 돌아갈 수 있습니다."
        : error instanceof Error && error.message === "ROOM_NOT_FOUND"
          ? "방을 찾을 수 없습니다."
          : "대기실 나가기에 실패했습니다.";

    return Response.json({ error: message }, { status: 400 });
  }
}
