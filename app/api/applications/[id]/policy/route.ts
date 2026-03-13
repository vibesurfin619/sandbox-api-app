import { NextRequest, NextResponse } from "next/server";
import { getPolicyData, savePolicyData } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getPolicyData(params.id);
    if (!data) {
      return NextResponse.json({ status: "PENDING", message: "No policy data received yet" });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to get policy data:", error);
    return NextResponse.json(
      { error: "Failed to get policy data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    if (!body.status && !body.policy) {
      return NextResponse.json(
        { error: "Invalid policy webhook payload: missing 'status' or 'policy' field" },
        { status: 400 }
      );
    }

    await savePolicyData(params.id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save policy data:", error);
    return NextResponse.json(
      { error: "Failed to save policy data" },
      { status: 500 }
    );
  }
}
