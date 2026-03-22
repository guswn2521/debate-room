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
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "발언 요청을 처리하지 못했습니다.",
      },
      { status: 400 },
    );
  }
}
