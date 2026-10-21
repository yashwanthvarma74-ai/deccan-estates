import { getLocalities } from "@/lib/data";
import { typeLabels, type ListingFilters } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass =
  "h-10 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950";

/** Plain GET form: filters live in the URL, so results are shareable and server-rendered. */
export async function SearchForm({ values = {} }: { values?: ListingFilters }) {
  const localities = await getLocalities();
  return (
    <form action="/listings" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" role="search">
      <Input name="q" placeholder="Search villas, plots…" defaultValue={values.q} aria-label="Search" className="lg:col-span-2" />
      <select name="locality" defaultValue={values.locality ?? ""} className={selectClass} aria-label="Locality">
        <option value="">All localities</option>
        {localities.map((l) => (
          <option key={l.id} value={l.slug}>{l.name}</option>
        ))}
      </select>
      <select name="type" defaultValue={values.type ?? ""} className={selectClass} aria-label="Property type">
        <option value="">Any type</option>
        {Object.entries(typeLabels).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <Input name="maxPrice" type="number" min={0} step={100000} placeholder="Max price (₹)" defaultValue={values.maxPrice} aria-label="Maximum price" />
      <Button type="submit">Search</Button>
    </form>
  );
}
