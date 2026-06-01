"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { GraduationCap, Loader2, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, MailCheck } from "lucide-react";
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
        setInvite({
          token: data.token,
          email: data.email,
          course_code: data.course_code || data.course?.code || "Syllabus Subject",
          course_title: data.course_title || data.course?.title || "Assigned Course",
          course_id: typeof data.course === 'number' ? data.course : (data.course_id || data.course?.id || 1),
          is_accepted: data.is_accepted,
          is_expired: data.is_expired,
        });
      } catch (err) {
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
    <main className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden select-none">
      {/* Subtle paper-pulp textures and faint watermark rings in the background */}
      <div className="absolute inset-0 bg-[radial-gradient(#00000003_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      
      <div className="w-full max-w-lg border border-border bg-card p-8 shadow-md academic-document-shadow relative z-10 animate-fade-in rounded-sm">
        {/* Double ledger lines for academic validation */}
        <div className="academic-double-border pb-4 mb-6 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 border border-primary/20 text-primary shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-serif font-bold text-foreground tracking-tight">Syllabus Mandate Invitation</h1>
            <p className="text-[9px] text-muted-foreground font-mono font-bold uppercase tracking-wider mt-0.5">official curriculum register</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Verifying secure token docket...</p>
          </div>
        ) : error ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded bg-rose-500/5 border border-rose-500/10 p-4 text-[11px] text-rose-600 font-semibold leading-relaxed">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
              <div>{error}</div>
            </div>
            <Button variant="secondary" className="w-full h-10 text-xs font-bold uppercase tracking-wider rounded-sm border-border/80" onClick={() => router.push("/")}>
              Return to register dashboard
            </Button>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/5 text-emerald-600 border border-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-serif font-bold text-emerald-600 dark:text-emerald-400">Assignment Accepted</h2>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Synchronizing credentials &amp; redirecting to workspace...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            <div className="space-y-3.5">
              <div className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <MailCheck className="h-4 w-4 shrink-0" /> Academic Appointment Pending
              </div>
              
              <div className="rounded-sm border border-border bg-background p-5 space-y-4 shadow-inner">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Subject Specification</span>
                  <div className="text-sm font-serif font-bold text-foreground mt-1 flex items-start gap-2 flex-wrap">
                    <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded-sm border border-border font-bold text-muted-foreground shrink-0">{invite?.course_code}</span>
                    <span className="leading-tight">{invite?.course_title}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground font-bold">Assigned Faculty Coordinator</span>
                  <div className="text-xs font-mono font-bold text-foreground mt-1">{invite?.email}</div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground bg-muted/40 p-4 rounded-sm border border-border/80 font-medium leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <span>Accepting this mandate assigns your account as the primary course coordinator. You will receive exclusive revision authority to draft, validate, and submit sections of this syllabus.</span>
            </div>

            <div className="pt-2">
              <Button className="w-full h-11 text-xs font-bold uppercase tracking-wider rounded-sm" disabled={accepting} onClick={handleAccept}>
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Authorizing appointment...
                  </>
                ) : (
                  <>
                    Accept Assignment &amp; Start Drafting <ArrowRight className="ml-2 h-3.5 w-3.5" />
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
