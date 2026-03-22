import { joinRoom } from "@/lib/debate-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    code?: string;
    name?: string;
  };

  if (!body.code?.trim() || !body.name?.trim()) {
    return Response.json(
      { error: "방 코드와 이름을 입력해주세요." },
      { status: 400 },
    );
  }

  try {
    const payload = joinRoom(body.code, body.name);
    return Response.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "ROOM_NOT_FOUND") {
      return Response.json(
        { error: "해당 방을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return Response.json(
      { error: "방에 참가하지 못했습니다." },
      { status: 500 },
    );
  }
}
