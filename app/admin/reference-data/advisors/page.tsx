import ReferenceDataPageByKind from "../reference-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdvisorsReferencePage() {
  return <ReferenceDataPageByKind kind="advisor" title="Advisors" />;
}
