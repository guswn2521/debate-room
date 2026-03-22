import { getRoomSnapshot } from "@/lib/debate-store";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/rooms/[code]">,
) {
  const { code } = await context.params;
  const participantId = request.nextUrl.searchParams.get("participantId");

  if (!participantId) {
    return Response.json(
      { error: "participantId가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    return Response.json(getRoomSnapshot(code, participantId));
  } catch (error) {
    const message =
      error instanceof Error && error.message === "ROOM_NOT_FOUND"
        ? "방을 찾을 수 없습니다."
        : "참가자를 찾을 수 없습니다.";

    return Response.json({ error: message }, { status: 404 });
  }
}
