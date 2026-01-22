import { NextRequest, NextResponse } from "next/server";
import { templateManager } from "@/lib/templates/manager";

export async function GET() {
  try {
    const result = await templateManager.listTemplates();
    return NextResponse.json(result);
  } catch (error) {
    console.error("List templates error:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.subject || !body.body) {
      return NextResponse.json(
        { error: "Name, subject, and body are required" },
        { status: 400 }
      );
    }

    const template = await templateManager.createTemplate({
      name: body.name,
      subject: body.subject,
      body: body.body,
      is_default: body.is_default,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
