/**
 * API Route: /api/admin/support-tickets/[id]/comments
 * Agregar comentarios técnicos a un ticket.
 */
import { NextRequest } from 'next/server';
import { AddTicketCommentDTO } from '@/core/dtos/support-ticket.dto';
import { addComment } from '@/services/support-ticket.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parseResult = AddTicketCommentDTO.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { success: false, message: 'Datos inválidos', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const authorId = body.authorId || 'system';
    const authorName = body.authorName || 'Sistema';
    const authorType = body.authorType || 'employee';

    const ticket = await addComment(id, authorId, authorName, authorType, parseResult.data);
    return Response.json({ success: true, ticket });
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
