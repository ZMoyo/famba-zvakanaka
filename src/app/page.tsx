
"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  ShieldCheck,
  Siren,
  CarFront,
  RefreshCw,
} from "lucide-react";

type Report = {
  id: string;
  type: string;
  road_name: string;
  lat: number;
  lng: number;
  created_at: string;
  verified: boolean;
};

const REPORT_TYPES = [
  { value: "accident", label: "Accident", icon: "🚗" },
  { value: "congestion", label: "Traffic congestion", icon: "🚦" },
  { value: "breakdown", label: "Vehicle breakdown", icon: "🛠️" },
  { value: "road_hazard", label: "Road hazard", icon: "⚠️" },
  { value: "checkpoint", label: "Traffic checkpoint", icon: "🚔" },
];

function distanceMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const radians = (n: number) => (n * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ageLabel(date: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  );

  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} day(s) ago`;
}

export default function HomePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationMessage, setLocationMessage] = useState(
    "Location has not been checked yet."
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState("checkpoint");
  const [roadName, setRoadName] = useState("");
  const [note, setNote] = useState("");

  async function loadReports() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Reports service is not ready yet.");
      }
      const data = await response.json();
      setReports(Array.isArray(data) ? data : data.reports ?? []);
    } catch {
      setError(
        "Reports are not connected yet. The home screen is ready, but the secure Supabase reporting API still needs to be added."
      );
    } finally {
      setBusy(false);
    }
  }

  function detectLocation() {
    setError("");
    if (!navigator.geolocation) {
      setLocationMessage("GPS is not supported by this browser.");
      return;
    }

    setLocationMessage("Checking your GPS location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationMessage(
          `GPS ready · accuracy about ${Math.round(position.coords.accuracy)} m`
        );
      },
      (err) => {
        setLocationMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access in your browser."
            : "Could not get your location. Check GPS and try again."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }

  useEffect(() => {
    void loadReports();
  }, []);

  const recentCheckpoints = reports.filter(
    (r) =>
      r.type === "checkpoint" &&
      Date.now() - new Date(r.created_at).getTime() < 2 * 60 * 60 * 1000
  );

  const nearbyCheckpoints = location
    ? recentCheckpoints
        .map((r) => ({
          ...r,
          distance: distanceMetres(location.lat, location.lng, r.lat, r.lng),
        }))
        .filter((r) => r.distance <= 5000)
        .sort((a, b) => a.distance - b.distance)
    : [];

  const visibleReports = reports.filter(
    (r) => filter === "all" || r.type === filter
  );

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!location) {
      setError("Check your GPS location before submitting a report.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          road_name: roadName.trim() || "Unknown road",
          lat: location.lat,
          lng: location.lng,
          note: note.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Report could not be submitted.");
      }

      setSuccess("Report submitted. Thank you for helping other road users.");
      setShowForm(false);
      setRoadName("");
      setNote("");
      await loadReports();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Reporting is not connected yet. Please try again later."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F0F2F5] text-[#17202A]">
      <header className="sticky top-0 z-20 border-b border-[#E4E6EB] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8B634A] text-lg font-black text-white">
              FZ
            </div>
            <div>
              <p className="font-extrabold">Famba Zvakanaka</p>
              <p className="text-xs text-[#65676B]">Zimbabwe Road Safety</p>
            </div>
          </div>
          <button
            onClick={() => void loadReports()}
            className="rounded-full border border-[#E4E6EB] bg-white p-3"
            aria-label="Refresh reports"
          >
            <RefreshCw size={19} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 p-4">
        <section className="rounded-3xl bg-gradient-to-br from-[#8B634A] to-[#A67C5B] p-6 text-white shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/90">
            <ShieldCheck size={18} /> SAFER JOURNEYS START HERE
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">
            Know the road.
            <br />
            Travel safely.
          </h1>
          <p className="mt-3 max-w-md leading-relaxed text-white/90">
            Help fellow drivers by reporting accidents, congestion, road
            hazards and recently observed checkpoints.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-full bg-white px-5 py-3 font-bold text-[#684B37]"
            >
              + Report an incident
            </button>
            <button
              onClick={detectLocation}
              className="flex items-center gap-2 rounded-full border border-white/50 px-5 py-3 font-bold text-white"
            >
              <Navigation size={17} /> Check my GPS
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-black/10 p-3 text-sm">
            <MapPin className="mr-1 inline" size={16} />
            {locationMessage}
          </div>
        </section>

        {location && nearbyCheckpoints.length > 0 && (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <div className="flex items-center gap-2 font-extrabold">
              <Siren size={21} /> Recent checkpoint reports nearby
            </div>
            {nearbyCheckpoints.map((r) => (
              <p key={r.id} className="mt-2 text-sm">
                {r.road_name} ·{" "}
                {r.distance < 1000
                  ? `${Math.round(r.distance)} m away`
                  : `${(r.distance / 1000).toFixed(1)} km away`}
                {" · "}
                {ageLabel(r.created_at)}
              </p>
            ))}
            <p className="mt-2 text-xs">
              Community reports are not official confirmation. Drive carefully
              and obey all traffic laws.
            </p>
          </section>
        )}

        {success && (
          <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
            {success}
          </p>
        )}
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {showForm && (
          <section className="rounded-2xl border border-[#E4E6EB] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-extrabold">Report a road event</h2>
            <form onSubmit={submitReport} className="space-y-4">
              <label className="block text-sm font-bold">
                What did you observe?
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#D8DBE0] bg-white p-3 font-normal"
                >
                  {REPORT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold">
                Road or location name (optional)
                <input
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder="e.g. Harare–Bulawayo Road"
                  className="mt-2 w-full rounded-xl border border-[#D8DBE0] p-3 font-normal"
                />
              </label>
              <label className="block text-sm font-bold">
                Additional details (optional)
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                  placeholder="Short description"
                  className="mt-2 w-full rounded-xl border border-[#D8DBE0] p-3 font-normal"
                />
              </label>
              <p className="rounded-xl bg-[#FBF6F1] p-3 text-xs text-[#684B37]">
                Your current GPS coordinates will be attached to the report.
                Only report what you personally observed.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy || !location}
                  className="rounded-full bg-[#8B634A] px-5 py-3 font-bold text-white disabled:opacity-50"
                >
                  {busy ? "Submitting…" : "Submit report"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full bg-[#E4E6EB] px-5 py-3 font-bold"
                >
                  Cancel
                </button>
              </div>
              {!location && (
                <p className="text-xs text-[#65676B]">
                  Check your GPS first to enable submission.
                </p>
              )}
            </form>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Recent road reports</h2>
            <span className="text-sm text-[#65676B]">
              {reports.length} reports
            </span>
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {[
              ["all", "All reports"],
              ["accident", "Accidents"],
              ["congestion", "Congestion"],
              ["breakdown", "Breakdowns"],
              ["road_hazard", "Road hazards"],
              ["checkpoint", "Checkpoints"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold ${
                  filter === value
                    ? "border-[#8B634A] bg-[#8B634A] text-white"
                    : "border-[#E4E6EB] bg-white text-[#343A40]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {busy && reports.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-[#65676B]">
              Loading reports…
            </div>
          ) : visibleReports.length === 0 ? (
            <div className="rounded-2xl border border-[#E4E6EB] bg-white p-8 text-center">
              <AlertTriangle className="mx-auto mb-3 text-[#8B634A]" size={30} />
              <p className="font-bold">No reports to show yet</p>
              <p className="mt-1 text-sm text-[#65676B]">
                Reports will appear here once the reporting API is connected.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border border-[#E4E6EB] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold">
                        {REPORT_TYPES.find((t) => t.value === report.type)
                          ?.icon ?? "📍"}{" "}
                        {REPORT_TYPES.find((t) => t.value === report.type)
                          ?.label ?? report.type}
                      </p>
                      <p className="mt-1 text-sm text-[#65676B]">
                        <MapPin className="mr-1 inline" size={14} />
                        {report.road_name || "Unknown road"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FBF6F1] px-2 py-1 text-xs font-bold text-[#684B37]">
                      {ageLabel(report.created_at)}
                    </span>
                  </div>
                  {!report.verified && (
                    <p className="mt-3 text-xs text-[#65676B]">
                      Community report · not yet verified
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#E4E6EB] bg-white p-4">
          <div className="flex items-start gap-3">
            <CarFront className="mt-1 text-[#8B634A]" size={24} />
            <div>
              <h2 className="font-extrabold">A reminder for every journey</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#65676B]">
                Keep your eyes on the road. Never use your phone while driving.
                Check reports before departure or ask a passenger to help.
              </p>
            </div>
          </div>
        </section>

        <footer className="px-3 py-4 text-center text-xs leading-relaxed text-[#65676B]">
          Famba Zvakanaka · Zimbabwe Road Safety
          <br />
          Checkpoint information is community-reported, may be outdated, and is
          not a guarantee of police activity.
        </footer>
      </div>
    </main>
  );
}
