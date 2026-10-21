"use client";
import { useFilterParams } from "@/components/filter-bar";

export function SortSelect() {
  const { sp, set } = useFilterParams();
  return (
    <label className="label flex items-center gap-2">
      Sort:
      <select
        value={sp.get("sort") ?? "newest"}
        onChange={(e) => set({ sort: e.target.value === "newest" ? undefined : e.target.value })}
        className="label cursor-pointer bg-transparent text-primary"
      >
        <option value="newest">Newest (default)</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
    </label>
  );
}
