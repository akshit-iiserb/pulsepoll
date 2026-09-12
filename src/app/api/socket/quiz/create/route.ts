import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { roomCode, hostSecret, quiz } = await req.json();
  const room = await prisma.room.findUnique({ where: { code: (roomCode as string).toUpperCase() } });
  if (!room || room.hostSecret !== hostSecret) return err('Unauthorized', 401);

  await prisma.quiz.create({
    data: {
      roomId: room.id,
      title: quiz.title,
      questions: {
        create: quiz.questions.map((q: any, i: number) => ({
          text: q.text,
          options: JSON.stringify(q.options),
          timeLimit: q.timeLimit,
          order: i,
        })),
      },
    },
  });
  return ok({ ok: true });
}
