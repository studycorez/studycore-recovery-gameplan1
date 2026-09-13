import { searchGameplans } from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const rows = await searchGameplans(q);
    return Response.json({ gameplans: rows });
  } catch (err) {
    console.error('[GET /api/gameplans]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
