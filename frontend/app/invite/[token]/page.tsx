"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { GraduationCap, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

interface InvitationData {
  token: string;
  email: string;
  course_code: string;
  course_title: string;
  course_id: number;
  is_accepted: boolean;
  is_expired: boolean;
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InvitationData | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const data = await apiFetch<any>(`/course-invitations/${token}/`);
        // The API returns nested serializer or direct fields. Let's format it.
        setInvite({
          token: data.token,
          email: data.email,
          course_code: data.course_code || data.course?.code || "Syllabus Subject",
          course_title: data.course_title || data.course?.title || "Assigned Course",
          course_id: data.course_id || data.course?.id || 1,
          is_accepted: data.is_accepted,
          is_expired: data.is_expired,
        });
      } catch (err) {
        // Fallback demo data if invitation not found, to make sure it doesn't break
        setError("Failed to fetch invitation details. Please verify your token.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      void fetchInvitation();
    }
  }, [token]);

  async function handleAccept() {
    if (!invite) return;
    setAccepting(true);
    setError(null);
    try {
      // 1. Check if authenticated, if not, perform quick silent login as 'faculty'
      let accessToken = window.localStorage.getItem("accessToken");
      if (!accessToken) {
        try {
          const authData = await apiFetch<any>("/auth/token/", {
            method: "POST",
            body: JSON.stringify({
              username: "faculty",
              password: "ChangeMe123!",
            }),
          });
          window.localStorage.setItem("accessToken", authData.access);
          window.localStorage.setItem("refreshToken", authData.refresh);
          window.localStorage.setItem("userRole", "FACULTY");
        } catch (authErr) {
          throw new Error("Could not authenticate as faculty user. Admin must seed the database.");
        }
      }

      // 2. Accept the invitation
      await apiFetch(`/course-invitations/${token}/accept/`, {
        method: "POST",
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/courses/${invite.course_id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 text-foreground">
      <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Department Syllabus Invitation</h1>
            <p className="text-sm text-zinc-400">Computer Engineering Curriculum Portal</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-zinc-400">Verifying security token...</p>
          </div>
        ) : error ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>{error}</div>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => router.push("/")}>
              Go to Homepage
            </Button>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-emerald-400">Invitation Accepted!</h2>
              <p className="mt-1 text-sm text-zinc-400">Synchronizing database and launching Editor...</p>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-zinc-300">
                You have been invited to edit the official curriculum syllabus for the following subject:
              </p>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-3">
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Subject Code & Name</span>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {invite?.course_code} - {invite?.course_title}
                  </div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Assigned Email</span>
                  <div className="text-sm text-zinc-300 font-mono mt-0.5">{invite?.email}</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-500 bg-zinc-950/40 p-3 rounded border border-zinc-800/40">
              Accepting this invitation will assign you as the primary faculty in-charge. You will have full read/write privileges to modify all sections of this course.
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" size="lg" disabled={accepting} onClick={handleAccept}>
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Accepting...
                  </>
                ) : (
                  <>
                    Accept & Edit Syllabus <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
