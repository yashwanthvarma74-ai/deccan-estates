import type { Listing } from "@/lib/api";

export type PropertyType = Listing["type"];
export type AreaUnit = "sqyd" | "acre" | "sqft";

export const SQFT_PER_SQYD = 9;
export const SQYD_PER_ACRE = 4840;

export const FACING_LABELS: Record<string, string> = {
  EAST: "East", WEST: "West", NORTH: "North", SOUTH: "South",
  NORTH_EAST: "North-East", NORTH_WEST: "North-West", SOUTH_EAST: "South-East", SOUTH_WEST: "South-West",
};
export const FURNISHING_LABELS: Record<string, string> = { UNFURNISHED: "Unfurnished", SEMI_FURNISHED: "Semi-furnished", FURNISHED: "Fully furnished" };
export const POSSESSION_LABELS: Record<string, string> = { READY: "Ready to move", UNDER_CONSTRUCTION: "Under construction", NEW_LAUNCH: "New launch" };
export const APPROVAL_LABELS: Record<string, string> = { DTCP: "DTCP", HMDA: "HMDA", RERA: "RERA" };
export const AMENITY_LABELS: Record<string, string> = {
  LIFT: "Lift", GYM: "Gym", SWIMMING_POOL: "Swimming pool", CLUBHOUSE: "Clubhouse", POWER_BACKUP: "Power backup",
  SECURITY_24X7: "24x7 security", PARK: "Park", KIDS_PLAY_AREA: "Kids' play area", JOGGING_TRACK: "Jogging track",
  PRIVATE_GARDEN: "Private garden", PRIVATE_POOL: "Private pool",
};

export const AMENITIES_BY_TYPE: Record<PropertyType | "ANY", string[]> = {
  ANY: [],
  PLOT: [],
  APARTMENT: ["LIFT", "GYM", "SWIMMING_POOL", "CLUBHOUSE", "POWER_BACKUP", "SECURITY_24X7", "PARK", "KIDS_PLAY_AREA"],
  VILLA: ["PRIVATE_GARDEN", "PRIVATE_POOL", "SECURITY_24X7", "POWER_BACKUP", "PARK", "CLUBHOUSE"],
  GATED_COMMUNITY: ["CLUBHOUSE", "SWIMMING_POOL", "GYM", "PARK", "JOGGING_TRACK", "KIDS_PLAY_AREA", "SECURITY_24X7", "POWER_BACKUP"],
  COMMERCIAL: ["LIFT", "POWER_BACKUP", "SECURITY_24X7", "PARK", "GYM", "CLUBHOUSE"],
};

/**
 * Which filter groups make sense for each property type, following how Hyderabad listings are described:
 * plots by plot area (sq yd / acre) and approvals; flats by carpet and built-up sq ft and floor;
 * villas by plot area plus built-up and carpet area; gated communities as villas with shared amenities.
 */
export type FieldGroup =
  | "beds" | "baths" | "plotArea" | "builtUp" | "carpet" | "floor" | "storeys" | "furnishing" | "parking"
  | "age" | "possession" | "facing" | "approval" | "corner" | "road" | "gated" | "amenities" | "ppsf";

export const FIELDS_BY_TYPE: Record<PropertyType | "ANY", FieldGroup[]> = {
  ANY: ["beds", "builtUp", "possession", "facing", "ppsf"],
  PLOT: ["plotArea", "facing", "approval", "corner", "road", "gated", "ppsf"],
  APARTMENT: ["beds", "baths", "carpet", "builtUp", "floor", "furnishing", "parking", "age", "possession", "facing", "amenities", "ppsf"],
  VILLA: ["beds", "baths", "plotArea", "builtUp", "carpet", "storeys", "furnishing", "parking", "age", "possession", "facing", "gated", "amenities", "ppsf"],
  GATED_COMMUNITY: ["beds", "baths", "plotArea", "builtUp", "carpet", "furnishing", "parking", "age", "possession", "facing", "amenities", "ppsf"],
  COMMERCIAL: ["baths", "carpet", "builtUp", "floor", "furnishing", "parking", "age", "possession", "facing", "amenities", "ppsf"],
};

/** URL keys owned by each field group, used to drop filters that no longer apply when the type changes. */
export const KEYS_BY_GROUP: Record<FieldGroup, string[]> = {
  beds: ["minBeds", "beds"], baths: ["minBaths"], plotArea: ["minPlotArea", "maxPlotArea", "unit"], builtUp: ["minArea", "maxArea"],
  carpet: ["minCarpet", "maxCarpet"], floor: ["minFloor", "maxFloor"], storeys: ["minStoreys"], furnishing: ["furnishing"],
  parking: ["minParking"], age: ["maxAge"], possession: ["possession"], facing: ["facing"], approval: ["approval"],
  corner: ["corner"], road: ["minRoad"], gated: ["gated"], amenities: ["amenities"], ppsf: ["minPpsf", "maxPpsf"],
};

export function keysForType(type: string | undefined): string[] {
  const t = (type && type in FIELDS_BY_TYPE ? type : "ANY") as PropertyType | "ANY";
  return FIELDS_BY_TYPE[t].flatMap((g) => KEYS_BY_GROUP[g]);
}

export function sqydTo(unit: AreaUnit, sqyd: number) {
  if (unit === "acre") return sqyd / SQYD_PER_ACRE;
  if (unit === "sqft") return sqyd * SQFT_PER_SQYD;
  return sqyd;
}

export const UNIT_LABEL: Record<AreaUnit, string> = { sqyd: "sq yd", acre: "acre", sqft: "sq ft" };

/** "4,840 sq yd" / "1 acre" / "1,800 sq ft", trimming needless decimals. */
export function formatArea(sqyd: number, unit: AreaUnit = "sqyd") {
  const v = sqydTo(unit, sqyd);
  const text = unit === "acre" ? +v.toFixed(2) : Math.round(v);
  return `${text.toLocaleString("en-IN")} ${UNIT_LABEL[unit]}`;
}

/** Headline area line for a card, chosen by property type. */
export function areaSummary(l: Listing): string {
  const sqyd = l.plotAreaSqYd;
  if (l.type === "PLOT" && sqyd) return `${formatArea(sqyd)}${sqyd >= SQYD_PER_ACRE / 2 ? ` · ${formatArea(sqyd, "acre")}` : ""}`;
  const parts: string[] = [];
  if (l.bedrooms) parts.push(`${l.bedrooms} BHK`);
  if (l.type === "APARTMENT" || l.type === "COMMERCIAL") {
    if (l.carpetSqft) parts.push(`${l.carpetSqft.toLocaleString("en-IN")} sq ft carpet`);
    else parts.push(`${l.areaSqft.toLocaleString("en-IN")} sq ft`);
  } else {
    if (sqyd) parts.push(`${formatArea(sqyd)} plot`);
    parts.push(`${l.areaSqft.toLocaleString("en-IN")} sq ft built-up`);
  }
  return parts.join(" · ");
}

/** Price per unit, in the unit buyers quote for that type (per sq yd for plots, per sq ft otherwise). */
export function pricePerUnit(l: Listing) {
  return l.type === "PLOT" ? { value: l.pricePerSqft * SQFT_PER_SQYD, unit: "sq yd" } : { value: l.pricePerSqft, unit: "sq ft" };
}

/** Label/value rows for the detail page, chosen by property type. */
export function specsFor(l: Listing, formatPrice: (n: number) => string): [string, string][] {
  const rental = l.dealType === "RENT" || l.dealType === "LEASE";
  const rows: [string, string | null][] = rental
    ? [[l.dealType === "RENT" ? "Rent a month" : "Lease a month", formatPrice(l.priceInr)], ["Deposit", l.depositInr ? formatPrice(l.depositInr) : null]]
    : [["Price", formatPrice(l.priceInr)]];
  const per = pricePerUnit(l);
  rows.push([rental ? `Per ${per.unit} a month` : `Per ${per.unit}`, `₹${per.value.toLocaleString("en-IN")}`]);

  if (l.plotAreaSqYd) {
    rows.push(["Plot area", `${formatArea(l.plotAreaSqYd)} (${formatArea(l.plotAreaSqYd, "sqft")})`]);
    if (l.plotAreaSqYd >= SQYD_PER_ACRE / 4) rows.push(["In acres", formatArea(l.plotAreaSqYd, "acre")]);
  }
  if (l.type !== "PLOT") rows.push(["Built-up area", `${l.areaSqft.toLocaleString("en-IN")} sq ft`]);
  if (l.carpetSqft) rows.push(["Carpet area", `${l.carpetSqft.toLocaleString("en-IN")} sq ft`]);
  if (l.bedrooms) rows.push(["Bedrooms", String(l.bedrooms)]);
  if (l.bathrooms) rows.push(["Bathrooms", String(l.bathrooms)]);
  if (l.floor) rows.push(["Floor", l.totalFloors ? `${l.floor} of ${l.totalFloors}` : String(l.floor)]);
  else if (l.type !== "APARTMENT" && l.type !== "COMMERCIAL" && l.type !== "PLOT" && l.totalFloors) rows.push(["Floors", `G+${l.totalFloors - 1}`]);
  if (l.parking) rows.push(["Car parking", `${l.parking} covered`]);
  rows.push(["Facing", l.facing ? FACING_LABELS[l.facing] ?? l.facing : null]);
  if (l.furnishing) rows.push(["Furnishing", FURNISHING_LABELS[l.furnishing] ?? l.furnishing]);
  rows.push(["Possession", POSSESSION_LABELS[l.possession] ?? l.possession]);
  if (l.ageYears !== null && l.possession === "READY") rows.push(["Age", l.ageYears === 0 ? "New" : `${l.ageYears} years`]);
  if (l.approval) rows.push(["Approval", APPROVAL_LABELS[l.approval] ?? l.approval]);
  if (l.type === "PLOT") {
    if (l.roadWidthFt) rows.push(["Road width", `${l.roadWidthFt} ft`]);
    rows.push(["Corner plot", l.cornerPlot ? "Yes" : "No"]);
  }
  if (l.type !== "PLOT" || l.gated) rows.push([l.type === "PLOT" ? "Layout" : "Community", l.gated ? "Gated" : "Independent"]);
  return rows.filter((r): r is [string, string] => r[1] !== null);
}
