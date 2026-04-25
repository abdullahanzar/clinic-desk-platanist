"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseMedical,
  Building2,
  Loader2,
  Mail,
  MapPinned,
  ShieldCheck,
} from "lucide-react";

function buildVerificationHref(signupId: string, email: string): string {
  return `/register/verify?signupId=${encodeURIComponent(signupId)}&email=${encodeURIComponent(email)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState("");
  const [clinicSlug, setClinicSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinicName,
          clinicSlug,
          phone,
          clinicEmail,
          website,
          doctorName,
          doctorEmail,
          password,
          address: {
            line1: addressLine1,
            line2: addressLine2,
            city,
            state: stateName,
            pincode,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "PENDING_SIGNUP_EXISTS" && data.signupId && data.email) {
          router.push(buildVerificationHref(data.signupId, data.email));
          return;
        }

        setError(data.error || "Signup failed");
        return;
      }

      router.push(buildVerificationHref(data.signupId, data.email));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-brand-50 via-white to-sky-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-12">
        <section className="hidden rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-xl shadow-slate-900/5 backdrop-blur lg:flex lg:flex-col dark:border-slate-800/80 dark:bg-slate-950/70">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-lg dark:bg-slate-900">
              <Image
                src="/platanist_clinic_desk_minimal.png"
                alt="Clinic Desk"
                width={46}
                height={46}
                className="rounded-xl"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Create your clinic workspace</h1>
              <p className="mt-1 text-sm text-brand-700 dark:text-brand-300">Doctor signup with email verification</p>
            </div>
          </div>

          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Start a brand-new Clinic Desk account for your practice. We create the clinic and grant access only after you verify the doctor email address.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="rounded-3xl border border-brand-100 bg-brand-50/80 p-5 dark:border-brand-900/60 dark:bg-brand-950/30">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-300" />
                <h2 className="font-semibold">What happens next</h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li>We email a six-digit verification code to the doctor address you enter.</li>
                <li>Your clinic and doctor account are created only after the code is confirmed.</li>
                <li>Verification signs you in immediately and redirects you into the dashboard.</li>
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-300" />
                <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">Clinic ready</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Reserve your clinic slug now so public profile and billing URLs can use it later.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                <BriefcaseMedical className="h-5 w-5 text-brand-600 dark:text-brand-300" />
                <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">Doctor-owned</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  The doctor created here becomes the first authenticated account for the clinic workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10 text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
              Sign in
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl rounded-[2rem] border border-slate-200/70 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200/70 px-6 py-6 dark:border-slate-800 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
                <Image
                  src="/platanist_clinic_desk_minimal.png"
                  alt="Clinic Desk"
                  width={34}
                  height={34}
                  className="rounded-lg"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-950 dark:text-white">Doctor signup</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Create a new clinic account</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Set up your clinic</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Fill in the clinic and doctor details below. We will email a verification code before access is granted.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
            {error ? (
              <div className="rounded-2xl border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
                {error}
              </div>
            ) : null}

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                Clinic details
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Clinic name</span>
                  <input
                    required
                    value={clinicName}
                    onChange={(event) => setClinicName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="Sunrise Family Clinic"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Clinic slug</span>
                  <input
                    required
                    value={clinicSlug}
                    onChange={(event) => setClinicSlug(event.target.value.toLowerCase())}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="sunrise-family-clinic"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Clinic phone</span>
                  <input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="9876543210"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Address line 1</span>
                  <input
                    required
                    value={addressLine1}
                    onChange={(event) => setAddressLine1(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="12 Market Road"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Address line 2</span>
                  <input
                    value={addressLine2}
                    onChange={(event) => setAddressLine2(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="Near city bus stand"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">City</span>
                  <input
                    required
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="Kochi"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">State</span>
                  <input
                    required
                    value={stateName}
                    onChange={(event) => setStateName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="Kerala"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pincode</span>
                  <input
                    required
                    value={pincode}
                    onChange={(event) => setPincode(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="682001"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Clinic email</span>
                  <input
                    type="email"
                    value={clinicEmail}
                    onChange={(event) => setClinicEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="hello@sunriseclinic.com"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Website</span>
                  <input
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="https://sunriseclinic.com"
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <MapPinned className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                Doctor account
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Doctor name</span>
                  <input
                    required
                    value={doctorName}
                    onChange={(event) => setDoctorName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="Dr. Aisha Rahman"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Doctor email</span>
                  <input
                    required
                    type="email"
                    value={doctorEmail}
                    onChange={(event) => setDoctorEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="doctor@sunriseclinic.com"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="At least 6 characters"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm password</span>
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900"
                    placeholder="Repeat your password"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                By continuing, you agree to verify the doctor email before clinic access is enabled.
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Create clinic account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200">
                Back to sign in
              </Link>
              <div className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Verification email required before access
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}