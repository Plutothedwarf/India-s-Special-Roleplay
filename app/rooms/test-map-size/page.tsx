import AzgaarMap from "@/components/azgaar-map";

export default function TestMapSize() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Map Size Test</h1>
      <AzgaarMap 
        mapSourceName="Morvaland 2026-08-24-18-39" 
        nations={[]}
      />
    </div>
  );
}
