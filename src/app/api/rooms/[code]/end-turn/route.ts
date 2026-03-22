import { endTurn } from "@/lib/debate-store";

export async function POST(
  request: Request,
  context: RouteContext<"/api/rooms/[code]/end-turn">,
) {
  const { code } = await context.params;
  const body = (await request.json()) as { participantId?: string };

  if (!body.participantId) {
    return Response.json({ error: "participantId가 필요합니다." }, { status: 400 });
  }

  try {
    return Response.json(endTurn(code, body.participantId));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "턴 종료에 실패했습니다.",
      },
      { status: 400 },
    );
  }
}
