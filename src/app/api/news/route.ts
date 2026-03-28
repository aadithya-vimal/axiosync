import { NextResponse } from "next/server";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Article {
    title: string;
    url: string;
    source: string;
    pubDate: string;
    summary: string;
}

// ── RSS Sources ───────────────────────────────────────────────────────────────
const RSS_FEEDS = [
    { url: "https://www.nerdfitness.com/blog/feed/", source: "Nerd Fitness" },
    { url: "https://barbend.com/feed/", source: "BarBend" },
    { url: "https://breakingmuscle.com/feed/", source: "Breaking Muscle" },
];

// ── Simple XML text extractor ─────────────────────────────────────────────────
function extractTag(xml: string, tag: string): string {
    const reCDATA = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`, "s");
    const reNormal = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, "s");
    const m = xml.match(reCDATA) || xml.match(reNormal);
    return m ? m[1].trim() : "";
}

function stripHtml(str: string): string {
    return str.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}

function parseRSS(xml: string, source: string): Article[] {
    try {
        const items = xml.split(/<item[\s>]/i).slice(1);
        return items.slice(0, 4).map((item) => {
            const title = stripHtml(extractTag(item, "title"));
            const url = extractTag(item, "link") || extractTag(item, "guid");
            const pubDate = extractTag(item, "pubDate");
            const rawDesc = extractTag(item, "description") || extractTag(item, "summary");
            const summary = stripHtml(rawDesc).slice(0, 240);
            return { title, url: url.replace(/\s/g, ""), source, pubDate, summary };
        }).filter((a) => a.title && a.url);
    } catch {
        return [];
    }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET() {
    const results = await Promise.allSettled(
        RSS_FEEDS.map(async ({ url, source }) => {
            const res = await fetch(url, {
                headers: { "User-Agent": "Axiosync/1.0" },
                next: { revalidate: 600 }, // cache 10 minutes
            });
            if (!res.ok) return [];
            const xml = await res.text();
            return parseRSS(xml, source);
        })
    );

    const articles: Article[] = [];
    for (const r of results) {
        if (r.status === "fulfilled") articles.push(...r.value);
    }

    // Sort newest first if dates exist
    articles.sort((a, b) => {
        const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return db - da;
    });

    if (articles.length === 0) {
        return NextResponse.json({ articles: [] }); // Always return 200 to prevent client 500 logs
    }

    return NextResponse.json({ articles: articles.slice(0, 10) });
}
