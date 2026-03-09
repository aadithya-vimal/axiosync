import { NextResponse } from "next/server";

const FEEDS = [
    "https://fitnessvolt.com/feed/",
    "https://www.muscleandfitness.com/feed/",
];

interface Article {
    title: string;
    url: string;
    source: string;
    thumbnail?: string;
    pubDate: string;
    summary: string;
}

function parseRSS(xml: string, source: string): Article[] {
    const items: Article[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
        const item = match[1];
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
            ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1]
            ?? item.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/)?.[1] ?? "";
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
        const summary = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
            ?? item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "";
        const cleanSummary = summary.replace(/<[^>]+>/g, "").slice(0, 180).trim();
        const thumbnail = item.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1]
            ?? item.match(/<enclosure[^>]+url="([^"]+)"/)?.[1];

        if (title && link) {
            items.push({ title: title.trim(), url: link.trim(), source, thumbnail, pubDate: pubDate.trim(), summary: cleanSummary });
        }
    }
    return items;
}

// Fallback mock articles if RSS fetch fails
const MOCK_ARTICLES: Article[] = [
    { title: "The Science of Progressive Overload", url: "#", source: "Fitness Volt", pubDate: "Sun, 08 Mar 2026", thumbnail: undefined, summary: "Progressive overload is the cornerstone of all strength and hypertrophy training. Here's how to apply it optimally across different training styles." },
    { title: "Best Bodyweight Exercises for Chest Mass", url: "#", source: "Muscle & Fitness", pubDate: "Sat, 07 Mar 2026", thumbnail: undefined, summary: "You don't need a barbell to build an impressive chest. These bodyweight movements can drive serious chest development when programmed correctly." },
    { title: "How Zone 2 Cardio Transforms Your Aerobic Base", url: "#", source: "Fitness Volt", pubDate: "Fri, 06 Mar 2026", thumbnail: undefined, summary: "Zone 2 training — the oft-misunderstood low-intensity zone — may be one of the most important tools for longevity and performance." },
    { title: "Creatine: Everything You Need to Know in 2026", url: "#", source: "Muscle & Fitness", pubDate: "Thu, 05 Mar 2026", thumbnail: undefined, summary: "Still one of the most well-researched supplements in sports science, creatine continues to show benefits far beyond just muscle size." },
    { title: "Optimal Protein Timing for Muscle Growth", url: "#", source: "Fitness Volt", pubDate: "Wed, 04 Mar 2026", thumbnail: undefined, summary: "The anabolic window debate continues. New research clarifies whether you need to slam a shake immediately post-workout." },
    { title: "Sleep Architecture and Athletic Recovery", url: "#", source: "Muscle & Fitness", pubDate: "Tue, 03 Mar 2026", thumbnail: undefined, summary: "Deep sleep is where real recovery happens. Understanding sleep phases can help you prioritize and optimize your rest for better performance." },
];

export async function GET() {
    const articles: Article[] = [];

    for (const feed of FEEDS) {
        try {
            const res = await fetch(feed, {
                next: { revalidate: 3600 }, // cache for 1 hour
                headers: { "User-Agent": "Axiosync/1.0 RSS Reader" },
                signal: AbortSignal.timeout(4000),
            });
            if (res.ok) {
                const xml = await res.text();
                const source = feed.includes("fitnessvolt") ? "Fitness Volt" : "Muscle & Fitness";
                articles.push(...parseRSS(xml, source));
            }
        } catch {
            // Feed failed — use mocks
        }
    }

    const result = articles.length >= 4 ? articles : MOCK_ARTICLES;
    return NextResponse.json({ articles: result.slice(0, 10) });
}
