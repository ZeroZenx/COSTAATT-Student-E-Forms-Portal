import ReferenceDataPageByKind from "../reference-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CrnsReferencePage() {
  return <ReferenceDataPageByKind kind="crn" title="CRNs" />;
}
