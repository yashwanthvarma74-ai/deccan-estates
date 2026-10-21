import { cacheLife } from "next/cache";
import { fetchListing, fetchListings, fetchLocalities, type ListingFilters } from "@/lib/api";

export async function getListings(filters: ListingFilters) {
  "use cache";
  cacheLife("minutes");
  return fetchListings(filters);
}

export async function getListing(id: string) {
  "use cache";
  cacheLife("minutes");
  return fetchListing(id);
}

export async function getLocalities() {
  "use cache";
  cacheLife("hours");
  return fetchLocalities();
}
