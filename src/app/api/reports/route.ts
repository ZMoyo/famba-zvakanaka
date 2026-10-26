import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const REPORT_TYPES = new Set([
  "accident",
  "congestion",
  "breakdown",
  "road_hazard",
  "checkpoint",
]);

const memoryReports = [
  {
    id: "demo-1",
    type: "checkpoint",
    road_name: "Harare–Bulawayo Road",
    lat: -17.824858,
    lng: 31.045361,
    note: "Police checkpoint visible near the turnoff.",
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    verified: false,
  },
  {
    id: "demo-2",
    type: "road_hazard",
    road_name: "M1 near Chinhoyi",
    lat: -17.366667,
    lng: 30.2,
    note: "Large pothole causing slow traffic.",
    created_at: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    verified: false,
  },
];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function readReports() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [...memoryReports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function writeReport(payload: {
  type: string;
  road_name: string;
  lat: number;
  lng: number;
  note?: string | null;
}) {
  const supabase = getSupabaseClient();

  const row = {
    id: crypto.randomUUID(),
    type: payload.type,
    road_name: payload.road_name,
    lat: payload.lat,
    lng: payload.lng,
    note: payload.note ?? null,
    created_at: new Date().toISOString(),
    verified: false,
  };

  if (!supabase) {
    memoryReports.unshift(row);
    return row;
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      id: row.id,
      type: row.type,
      road_name: row.road_name,
      lat: row.lat,
      lng: row.lng,
      note: row.note,
      created_at: row.created_at,
      verified: row.verified,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reports = await readReports();
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to read reports:", error);
    return NextResponse.json(
      { error: "Could not load reports." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = String(body?.type ?? "").trim();
    const roadName = String(body?.road_name ?? "Unknown road").trim();
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);
    const note = body?.note == null ? null : String(body.note).trim();

    if (!REPORT_TYPES.has(type)) {
      return NextResponse.json(
        { error: "Invalid report type." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Location coordinates are required." },
        { status: 400 }
      );
    }

    const report = await writeReport({
      type,
      road_name: roadName || "Unknown road",
      lat,
      lng,
      note: note || null,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Failed to save report:", error);
    return NextResponse.json(
      { error: "Report could not be submitted." },
      { status: 500 }
    );
  }
}
