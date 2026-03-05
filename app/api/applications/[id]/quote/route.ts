import { NextRequest, NextResponse } from "next/server";
import { getQuoteData, saveQuoteData, updateApplicationStatus } from "@/lib/storage";
import { ApplicationStatus } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getQuoteData(params.id);
    if (!data) {
      return NextResponse.json({ result: "PENDING", message: "No quote data received yet" });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to get quote data:", error);
    return NextResponse.json(
      { error: "Failed to get quote data" },
      { status: 500 }
    );
  }
}

const RESULT_TO_STATUS: Record<string, ApplicationStatus> = {
  QUOTED: "quoted",
  DECLINED: "declined",
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    if (!body.result) {
      return NextResponse.json(
        { error: "Invalid webhook payload: missing 'result' field" },
        { status: 400 }
      );
    }

    await saveQuoteData(params.id, body);

    const newStatus = RESULT_TO_STATUS[body.result];
    if (newStatus) {
      await updateApplicationStatus(params.id, newStatus);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save quote data:", error);
    return NextResponse.json(
      { error: "Failed to save quote data" },
      { status: 500 }
    );
  }
}
