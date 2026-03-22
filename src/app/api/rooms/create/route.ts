import { createRoom } from "@/lib/debate-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    topic?: string;
    participantCount?: number;
    hostName?: string;
  };

  if (!body.topic?.trim() || !body.hostName?.trim()) {
    return Response.json(
      { error: "주제와 방장 이름을 입력해주세요." },
      { status: 400 },
    );
  }

  const participantCount = Number(body.participantCount ?? 3);
  const payload = createRoom({
    topic: body.topic,
    participantCount: Number.isFinite(participantCount)
      ? Math.min(Math.max(participantCount, 2), 8)
      : 3,
    hostName: body.hostName,
  });

  return Response.json(payload);
}
