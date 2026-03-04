import { NextRequest, NextResponse } from "next/server";
import { updateApplicationStatus } from "@/lib/storage";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, submittedAt } = await request.json();
    const updated = await updateApplicationStatus(
      params.id,
      status,
      submittedAt
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update application status:", error);
    return NextResponse.json(
      { error: "Failed to update application status" },
      { status: 500 }
    );
  }
}
