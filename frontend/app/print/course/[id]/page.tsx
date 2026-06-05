import { CoursePrint } from "@/components/print/course-print";
import { getCourseForPrint, printAcademicYear, printDepartment } from "@/lib/print-fixture";

export default async function CoursePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourseForPrint(id);
  return <CoursePrint course={course} department={printDepartment} academicYear={printAcademicYear} />;
}
