import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { useAuth } from "@/shared/hooks/useAuth";
import { wards } from "@/shared/lib/kwali-mock";
import { LevyEducation } from "@/shared/components/ui/LevyEducation";
import { StepProgress } from "@/shared/components/ui/StepProgress";
import { LocationPicker } from "@/shared/components/ui/LocationPicker";

export const Route = createFileRoute("/(public)/properties/register")({
  head: () => ({ meta: [{ title: "Register a property — Kwali Revenue Portal" }] }),
  component: RegisterPropertyPage,
});

const STEPS = ["Property details", "Location", "Review & submit"];

function RegisterPropertyPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const backTo = isAdmin ? "/properties" : "/dashboard";

  const [step, setStep] = useState(0);
  const [propertyType, setPropertyType] = useState("Residential");
  const [ward, setWard] = useState(wards[0]);
  const [street, setStreet] = useState("");
  const [plotSize, setPlotSize] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const value =
    Number.isFinite(latNum) && Number.isFinite(lngNum) ? { lat: latNum, lng: lngNum } : null;

  const stepValid = step === 0 ? street.trim() !== "" : true;
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function submit() {
    toast.success("Property registered", {
      description: "Your property has been added and queued for assessment.",
    });
    navigate({ to: backTo });
  }

  return (
    <DashboardShell
      title="Register a property"
      subtitle="Tag it with GPS so assessment is accurate."
      requireAdmin={false}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <StepProgress
          steps={STEPS}
          current={step}
          onJump={setStep}
          className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
        />

        <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          {/* Step 1 — Property details */}
          {step === 0 && (
            <div className="space-y-6">
              <LevyEducation category="property" />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-ink">Property type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Mixed-use</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-ink">Ward</label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    {wards.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Street address</label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="12 Old Garki Road"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Plot size (sqm)</label>
                <input
                  value={plotSize}
                  onChange={(e) => setPlotSize(e.target.value)}
                  type="number"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Location */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Pin the property location
                </h2>
                <p className="text-sm text-muted-foreground">
                  Search, use your location, or tap the map — confirm the resolved place name
                  matches your property.
                </p>
              </div>
              <LocationPicker
                value={value}
                height={320}
                onChange={(v, meta) => {
                  setLat(v.lat.toFixed(6));
                  setLng(v.lng.toFixed(6));
                  if (meta?.ward && wards.includes(meta.ward)) setWard(meta.ward);
                }}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-ink">Latitude</label>
                  <input
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="8.8742"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-ink">Longitude</label>
                  <input
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="7.0192"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Review & submit */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Review your details</h2>
                <p className="text-sm text-muted-foreground">
                  Confirm everything is correct before submitting for assessment.
                </p>
              </div>
              <dl className="divide-y divide-border rounded-xl border border-border">
                <ReviewRow k="Property type" v={propertyType} />
                <ReviewRow k="Ward" v={ward} />
                <ReviewRow k="Street address" v={street || "—"} />
                <ReviewRow k="Plot size" v={plotSize ? `${plotSize} sqm` : "—"} />
                <ReviewRow k="Coordinates" v={value ? `${lat}, ${lng}` : "Not pinned"} />
              </dl>
            </div>
          )}

          {/* Wizard navigation */}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            {step === 0 ? (
              <Link
                to={backTo}
                className="rounded-md border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                Cancel
              </Link>
            ) : (
              <button
                type="button"
                onClick={back}
                className="rounded-md border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={!stepValid}
                className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
              >
                Register property
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function ReviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold text-ink">{v}</dd>
    </div>
  );
}
