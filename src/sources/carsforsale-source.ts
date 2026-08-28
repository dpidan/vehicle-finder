import type { CollectionContext, ListingCandidate, ListingSource, SellerSeed } from '../domain/entities.js';

const source = { name: 'carsforsale seeded dealer', access: 'structured-web' } as const;

export const carsforsaleSource: ListingSource = {
  name: source.name,
  access: source.access,
  collect: async (context) => {
    const seeds = context.sellerSeeds?.filter((seed) => seed.inventoryUrl) ?? [];
    const pages = await Promise.all(
      seeds.map(async (seed) => ({
        seed,
        html: await fetchInventoryHtml(seed)
      }))
    );

    return pages.flatMap(({ seed, html }) => parseCarsforsaleInventory(html, seed, context.collectedAt));
  }
};

export function parseCarsforsaleInventory(
  html: string,
  seed: SellerSeed,
  capturedAt: CollectionContext['collectedAt']
): ListingCandidate[] {
  const fallbackUrl = seed.inventoryUrl ?? seed.websiteUrl ?? '';
  const titleLinks = parseTitleLinks(html, fallbackUrl);

  if (titleLinks.length > 0) {
    return titleLinks.flatMap(({ title, url, detail }, index) =>
      buildListingCandidate({ seed, capturedAt, title, url, detail, index })
    );
  }

  const lines = htmlToText(html).split('\n');

  return lines.flatMap((line, index) => {
    const title = parseTitleLine(line);

    if (!title) {
      return [];
    }

    const detail = lines.slice(index + 1, index + 10).join('\n');
    return buildListingCandidate({ seed, capturedAt, title, url: fallbackUrl, detail, index });
  });
}

async function fetchInventoryHtml(seed: SellerSeed): Promise<string> {
  if (!seed.inventoryUrl) {
    return '';
  }

  const response = await fetch(seed.inventoryUrl, {
    headers: { 'user-agent': 'vehicle-finder/0.1 low-frequency family vehicle search' }
  });

  if (!response.ok) {
    console.warn(`Skipping ${seed.inventoryUrl}: HTTP ${response.status}`);
    return '';
  }

  return response.text();
}

function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:a|div|h\d|li|p|span)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function parseTitleLine(line: string): string | undefined {
  const title = line.match(/\b((?:19|20)\d{2}\s+[A-Z][^\n$|]+?)\s*$/)?.[1]?.trim();
  return title && !title.includes(' for Sale') ? title : undefined;
}

function parseTitleLinks(html: string, baseUrl: string): Array<{ title: string; url: string; detail: string }> {
  return Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>\s*((?:19|20)\d{2}[\s\S]*?)<\/a>/gi)).flatMap(
    (match) => {
      const href = match[1];
      const title = htmlToText(match[2] ?? '').split('\n').map(parseTitleLine).find(Boolean);

      if (!href || !title) {
        return [];
      }

      return [
        {
          title,
          url: resolveUrl(href, baseUrl),
          detail: htmlToText(html.slice(match.index, match.index + 1200))
        }
      ];
    }
  );
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return baseUrl || href;
  }
}

function buildListingCandidate({
  seed,
  capturedAt,
  title,
  url,
  detail,
  index
}: {
  seed: SellerSeed;
  capturedAt: CollectionContext['collectedAt'];
  title: string;
  url: string;
  detail: string;
  index: number;
}): ListingCandidate[] {
  const price = parsePrice(detail);
  const mileage = parseMileage(detail);

  if (price === 0 && mileage === 0) {
    return [];
  }

  const vehicle = parseVehicleTitle(title);

  return [
    {
      source,
      sourceListingId: `${seed.name}:${url || `${index}:${title}`}`,
      url,
      title,
      status: 'active',
      vehicle,
      seller: seed,
      ...(price > 0 ? { price: { amount: price, currency: 'USD' } } : {}),
      ...(mileage > 0 ? { mileage } : {}),
      ...(seed.location ? { location: seed.location } : {}),
      capturedAt,
      evidence: [{ label: `${seed.name} vehicle listing`, url, confidence: url ? 0.7 : 0.6 }]
    }
  ];
}

function parseVehicleTitle(title: string): ListingCandidate['vehicle'] {
  const [, year, make, ...modelParts] = title.match(/^((?:19|20)\d{2})\s+(\S+)\s+(.+)$/) ?? [];

  return {
    ...(year ? { year: Number(year) } : {}),
    ...(make ? { make } : {}),
    ...(modelParts.length > 0 ? { model: modelParts.join(' ') } : {})
  };
}

function parsePrice(text: string): number {
  return parseInteger(text.match(/(?:Price\n)?\$(\d[\d,]+)/)?.[1]);
}

function parseMileage(text: string): number {
  return parseInteger(
    text.match(/Mileage\n(\d[\d,]+)/i)?.[1] ?? text.match(/\b(\d[\d,]+)\s*(?:mi\.?|miles)\b/i)?.[1]
  );
}

function parseInteger(value: string | undefined): number {
  return Number(value?.replace(/\D/g, '') ?? 0);
}
