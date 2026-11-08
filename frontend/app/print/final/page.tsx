import { CurriculumPrint } from "@/components/print/curriculum-print";
import { DEFAULT_BOOKLET_DATA } from "@/lib/default-booklet-data";

export default async function FinalCurriculumPrintPage({
  searchParams,
}: {
  searchParams: Promise<{
    version?: string;
    department?: string;
    scheme_id?: string;
    year_of_study?: string;
    academic_year?: string;
  }>;
}) {
  const params = await searchParams;
  const version = params.version || "FRCRCE-2-25";
  const schemeId = params.scheme_id || "sch-ce-2025";
  const yearOfStudy = params.year_of_study || "SE";
  const departmentId = params.department || "1";

  // Attempt server-side fetch from worker if reachable, otherwise fallback to DEFAULT_BOOKLET_DATA
  let bookletData = DEFAULT_BOOKLET_DATA;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://curriculum-backend.collacou.workers.dev/api";

  try {
    const res = await fetch(`${apiUrl}/curriculum-schemes/${schemeId}/booklet-data?year_of_study=${yearOfStudy}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.semesters) {
        bookletData = json;
      }
    }
  } catch (err) {
    // Graceful offline fallback
    console.warn("Could not fetch server-side booklet data, using default seed:", err);
  }

  return (
    <CurriculumPrint
      initialData={bookletData}
      version={version}
      schemeId={schemeId}
      yearOfStudy={yearOfStudy}
      departmentId={departmentId}
    />
  );
}
