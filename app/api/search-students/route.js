export const maxDuration = 15;

async function gql(query, variables, sessionCookie) {
  const res = await fetch('https://my.studycore.net/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': sessionCookie },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export async function POST(request) {
  try {
    const { query, sessionCookie } = await request.json();

    if (!query || !sessionCookie) {
      return Response.json({ error: 'query and sessionCookie are required.' }, { status: 400 });
    }

    const data = await gql(
      `query SearchStudents($search: String!, $limit: Int) {
        searchStudents(search: $search, limit: $limit) {
          id
          firstName
          lastName
          email
        }
      }`,
      { search: query, limit: 10 },
      sessionCookie
    );

    const raw = data.searchStudents || [];
    const students = raw.map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`.trim(),
      email: s.email || null,
    }));

    return Response.json({ students });
  } catch (err) {
    console.error('/api/search-students error:', err.message);
    return Response.json({ error: err.message || 'Search failed.' }, { status: 500 });
  }
}
