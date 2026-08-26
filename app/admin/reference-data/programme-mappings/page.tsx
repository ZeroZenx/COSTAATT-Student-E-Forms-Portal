import ReferenceDataPageByKind from "../reference-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProgrammeMappingsReferencePage() {
  return <ReferenceDataPageByKind kind="programme_mapping" title="Programme mappings" />;
}
