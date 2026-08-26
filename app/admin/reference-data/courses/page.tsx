import ReferenceDataPageByKind from "../reference-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CoursesReferencePage() {
  return <ReferenceDataPageByKind kind="course" title="Courses" />;
}
