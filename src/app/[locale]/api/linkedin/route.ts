// import { scrapeLinkedinSearch } from '@/utils/scraper';

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);

//     const url = searchParams.get('url');

//     if (!url || !url.startsWith('https://www.linkedin.com/search')) {
//       return new Response(JSON.stringify({ error: 'Invalid or missing LinkedIn search URL' }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }

//     const prospects = await scrapeLinkedinSearch(url);

//     return new Response(JSON.stringify({ prospects }), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } catch (err: any) {
//     console.error('❌ Error in /api/linkedin:', err);
//     return new Response(JSON.stringify({ error: 'LinkedIn scrape failed' }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }
// }

type Prospect = {
  name: string | null;
  title: string | null;
  location: string | null;
  profileUrl: string | null;
  avatar: string | null;
};

function extractProspectsFromLixResponse(data: any): Prospect[] {
  const items = data?.response?.elements ?? [];

  const prospects: Prospect[] = [];

  for (const cluster of items) {
    for (const item of cluster.items ?? []) {
      const entity = item?.itemUnion?.entityResult;
      if (!entity) {
        continue;
      }

      const name = entity.title?.text ?? null;
      const title = entity.primarySubtitle?.text ?? null;
      const location = entity.secondarySubtitle?.text ?? null;
      const profileUrl = entity.navigationUrl ?? null;

      let avatar = null;
      try {
        const artifact = entity.image?.attributes?.[0]?.detailDataUnion?.nonEntityProfilePicture?.vectorImage?.artifacts?.[0];
        avatar = artifact?.fileIdentifyingUrlPathSegment ?? null;
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {}

      prospects.push({
        name,
        title,
        location,
        profileUrl,
        avatar,
      });
    }
  }

  return prospects;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing LinkedIn search URL' }), { status: 400 });
  }

  try {
    const lixRes = await fetch(`https://api.lix-it.com/v1/li/linkedin/search/people?url=${url}`, {
      method: 'GET',
      headers: {
        Authorization: 'Fcvz0Wu48SZV09yPRmWU7rQAf8c8A2Ymjw6ZcChMNaELbpHKu7QoKOnzU08o',
      },
    });

    if (!lixRes.ok) {
      const errorText = await lixRes.text();
      return new Response(JSON.stringify({ error: `Lix API failed: ${errorText}` }), {
        status: lixRes.status,
      });
    }

    const rawJson = await lixRes.json();
    const prospects = extractProspectsFromLixResponse(rawJson);
    return new Response(JSON.stringify({ prospects }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Lix API error', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch from Lix API' }), {
      status: 500,
    });
  }
}
