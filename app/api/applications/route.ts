import { NextRequest, NextResponse } from "next/server";
import { getAllApplications, saveApplication } from "@/lib/storage";

export async function GET() {
  try {
    const applications = await getAllApplications();
    return NextResponse.json(applications);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to get applications:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const application = await request.json();
    await saveApplication(application);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to save application:", message, error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
