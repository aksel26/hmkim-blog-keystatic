import { NextRequest, NextResponse } from "next/server";
import { validateParams, fetchTrends } from "@/lib/trends/service";
import { AllSourcesFailedError } from "@/lib/trends/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const rawParams = {
      sources: searchParams.get("sources") ?? undefined,
      country: searchParams.get("country") ?? undefined,
      timeframe: searchParams.get("timeframe") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      naverCategories: searchParams.get("naverCategories") ?? undefined,
    };

    const validation = validateParams(rawParams);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await fetchTrends(validation.parsed);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AllSourcesFailedError) {
      return NextResponse.json(
        { error: "All trend sources failed", errors: error.errors },
        { status: 502 },
      );
    }

    console.error("Trends API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch trends";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
