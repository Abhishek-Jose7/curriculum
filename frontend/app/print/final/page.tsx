import { CurriculumPrint } from "@/components/print/curriculum-print";
import { getCurriculumForPrint } from "@/lib/print-fixture";

export default async function FinalCurriculumPrintPage({ searchParams }: { searchParams: Promise<{ version?: string }> }) {
  const { version = "fidelity-validation" } = await searchParams;
  const curriculum = await getCurriculumForPrint();
  return <CurriculumPrint curriculum={curriculum} version={version} />;
}
