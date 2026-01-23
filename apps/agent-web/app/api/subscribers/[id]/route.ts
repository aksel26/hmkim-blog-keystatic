import { NextRequest, NextResponse } from "next/server";
import { subscriberManager } from "@/lib/subscribers/manager";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const subscriber = await subscriberManager.getSubscriber(id);

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscriber);
  } catch (error) {
    console.error("Get subscriber error:", error);
    return NextResponse.json(
      { error: "Failed to get subscriber" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const subscriber = await subscriberManager.updateSubscriber(id, {
      name: body.name,
      status: body.status,
    });

    return NextResponse.json(subscriber);
  } catch (error) {
    console.error("Update subscriber error:", error);
    return NextResponse.json(
      { error: "Failed to update subscriber" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await subscriberManager.deleteSubscriber(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete subscriber error:", error);
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 }
    );
  }
}
