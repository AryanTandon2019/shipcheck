import { getStore } from "@/lib/storage";
import { NextResponse } from "next/server";

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "#0b6e4f";
    case "B":
      return "#15803d";
    case "C":
      return "#b54708";
    case "D":
      return "#c2410c";
    default:
      return "#b42318";
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const report = await getStore().get(id);

  if (!report) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="20" role="img">
  <rect width="160" height="20" rx="3" fill="#555"/>
  <text x="80" y="14" fill="#fff" font-family="Verdana,sans-serif" font-size="11" text-anchor="middle">shipcheck: unknown</text>
</svg>`;
    return new NextResponse(svg, {
      status: 404,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store",
      },
    });
  }

  const label = "shipcheck";
  const message = `${report.score.grade} · ${report.score.overall}`;
  const color = gradeColor(report.score.grade);
  const labelW = 72;
  const msgW = 64;
  const w = labelW + msgW;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#555"/>
    <rect x="${labelW}" width="${msgW}" height="20" fill="${color}"/>
    <rect width="${w}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="14">${label}</text>
    <text x="${labelW + msgW / 2}" y="14">${message}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60",
    },
  });
}
