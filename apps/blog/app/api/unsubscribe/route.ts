import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables not set");
  }

  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.redirect(new URL("/subscribe/error?reason=invalid", request.url));
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Unsubscribe error:", error);
      return NextResponse.redirect(new URL("/subscribe/error?reason=server", request.url));
    }

    return NextResponse.redirect(new URL("/subscribe/unsubscribed", request.url));
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.redirect(new URL("/subscribe/error?reason=server", request.url));
  }
}
