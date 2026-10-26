import { Suspense } from "react";
import { SearchStrip } from "@/components/search-strip";
import { getAgents, getLocalities } from "@/lib/data";

async function Loaded() {
  const [localities, agents] = await Promise.all([getLocalities(), getAgents()]);
  return <SearchStrip localities={localities} agents={agents} />;
}

/** Server wrapper: fetches the (cached) areas and agents once and hands them to the client strip. */
export function SearchStripLoader() {
  return <Suspense fallback={null}><Loaded /></Suspense>;
}
