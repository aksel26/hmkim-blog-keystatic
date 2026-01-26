import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email/welcome";

interface SubscribeRequest {
  name: string;
  email: string;
  privacyAgreed: boolean;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables not set");
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json();
    const { name, email, privacyAgreed } = body;

    // 유효성 검사
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "유효한 이메일 주소를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!privacyAgreed) {
      return NextResponse.json(
        { success: false, error: "개인정보 수집에 동의해주세요." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const normalizedEmail = email.toLowerCase().trim();

    // 이미 구독 중인지 확인
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, status")
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { success: false, error: "이미 구독 중인 이메일입니다." },
          { status: 400 }
        );
      }

      // 구독 해지 상태라면 다시 활성화
      const { error: updateError } = await supabase
        .from("subscribers")
        .update({
          status: "active",
          name: name?.trim() || null,
          privacy_agreed_at: new Date().toISOString(),
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Reactivate error:", updateError);
        return NextResponse.json(
          { success: false, error: "구독 처리 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }

      // 환영 이메일 발송 (비동기, 실패해도 구독은 성공)
      sendWelcomeEmail(normalizedEmail, name).catch(console.error);

      return NextResponse.json({ success: true });
    }

    // 새 구독자 등록
    const { error: insertError } = await supabase.from("subscribers").insert({
      email: normalizedEmail,
      name: name?.trim() || null,
      status: "active",
      privacy_agreed_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "구독 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 환영 이메일 발송 (비동기, 실패해도 구독은 성공)
    sendWelcomeEmail(normalizedEmail, name).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
