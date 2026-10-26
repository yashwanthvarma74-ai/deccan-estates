"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PUBLIC_API_URL, fetchLocalities, typeLabels, type Listing } from "@/lib/api";
import { authedRequest } from "@/lib/authed";
import { AMENITIES_BY_TYPE, AMENITY_LABELS } from "@/lib/listing-meta";
import { formatInr, type Deal } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Photo = { file: string; url: string };
type PropertyType = Listing["type"];

const field = "mt-1.5 h-12 w-full rounded-lg border border-white/20 bg-white/[0.04] px-3 text-[15px] text-white outline-none placeholder:text-white/40 focus-visible:border-[#b6f400] [&>option]:text-black";
const area = "mt-1.5 w-full rounded-lg border border-white/20 bg-white/[0.04] p-3 text-[15px] text-white outline-none placeholder:text-white/40 focus-visible:border-[#b6f400]";

function Block({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 sm:p-8">
      <legend className="mono-label px-2 text-[#b6f400]">{n}. {title}</legend>
      <div className="mt-2 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Label({ text, hint, children, wide }: { text: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={cn("block text-sm text-white/80", wide && "sm:col-span-2")}>
      {text}
      {children}
      {hint && <span className="mt-1.5 block text-xs text-white/60">{hint}</span>}
    </label>
  );
}

export function PostForm() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const localities = useQuery({ queryKey: ["localities"], queryFn: () => fetchLocalities(PUBLIC_API_URL) });

  const [deal, setDeal] = useState<Deal>("SALE");
  const [type, setType] = useState<PropertyType>("APARTMENT");
  const [price, setPrice] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  if (isPending) return <p className="p-10 text-white/70">Loading…</p>;
  if (!session) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-white/12 bg-white/[0.03] p-8 text-center sm:p-10">
        <h2 className="text-[1.8rem] tracking-[-0.03em]">Sign in to post your property</h2>
        <p className="mt-3 text-white/75">Posting is free. We ask you to sign in so only you can change or remove your listings, and so buyers know the post is from a real person.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login?next=/post" className="mono-label flex h-12 items-center rounded-lg bg-[#b6f400] px-7 text-black">Log in or sign up</Link>
        </div>
      </div>
    );
  }

  const rental = deal !== "SALE";
  const plot = type === "PLOT";
  const commercial = type === "COMMERCIAL";
  const flatLike = type === "APARTMENT" || commercial;
  const priceNum = Number(price.replace(/,/g, ""));

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = 8 - photos.length;
    const picked = [...files].slice(0, room);
    setErrors(files.length > room ? [`You can add up to 8 photos; the first ${room} were used.`] : []);
    setUploading((n) => n + picked.length);
    for (const f of picked) {
      try {
        if (f.size > 5 * 1024 * 1024) throw new Error(`${f.name} is over 5 MB.`);
        const body = new FormData();
        body.append("photo", f);
        const r = await authedRequest<{ file: string; url: string }>("/uploads", { method: "POST", body });
        setPhotos((p) => [...p, { file: r.file, url: r.url }]);
      } catch (e) {
        setErrors((x) => [...x, (e as Error).message]);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (input.current) input.current.value = "";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const errs: string[] = [];
    if (!photos.length) errs.push("Add at least one photo.");
    if (uploading) errs.push("Wait for the photos to finish uploading.");
    if (errs.length) return setErrors(errs);

    // Plots are entered in square yards, as people in Hyderabad do; the listing stores both.
    const plotSqYd = Number(get("plotArea"));
    const body = {
      dealType: deal,
      type,
      title: get("title"),
      description: get("description"),
      locality: get("locality"),
      priceInr: priceNum,
      depositInr: rental ? get("deposit").replace(/,/g, "") : "",
      areaSqft: plot ? Math.round(plotSqYd * 9) : Number(get("areaSqft")),
      plotAreaSqYd: plot ? plotSqYd : "",
      bedrooms: plot ? "" : get("bedrooms"),
      bathrooms: plot ? "" : get("bathrooms"),
      floor: flatLike ? get("floor") : "",
      totalFloors: flatLike ? get("totalFloors") : "",
      ageYears: plot ? "" : get("ageYears"),
      parking: get("parking"),
      facing: get("facing"),
      furnishing: plot ? "" : get("furnishing"),
      possession: get("possession") || "READY",
      gated: f.get("gated") === "on",
      amenities,
      contactName: get("contactName"),
      contactPhone: get("contactPhone"),
      images: photos.map((p) => p.file),
    };
    setBusy(true);
    setErrors([]);
    try {
      const made = await authedRequest<{ id: string }>("/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      router.push(`/listings/${made.id}`);
      router.refresh();
    } catch (err) {
      setErrors((err as Error).message.split("\n"));
      setBusy(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const amenityOptions = AMENITIES_BY_TYPE[type];

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-[900px] gap-6 px-5 pb-24 sm:px-8" noValidate={false}>
      {errors.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-100">
          <ul className="list-disc pl-5">{errors.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      <Block n={1} title="What are you offering?">
        <div className="sm:col-span-2">
          <span className="text-sm text-white/80">I want to</span>
          <div role="group" aria-label="Sell, rent or lease" className="mt-1.5 flex gap-1 rounded-xl bg-white/[0.06] p-1">
            {([["SALE", "Sell"], ["RENT", "Rent out"], ["LEASE", "Commercial lease"]] as [Deal, string][]).map(([d, label]) => (
              <button key={d} type="button" aria-pressed={deal === d} onClick={() => setDeal(d)} className={cn("mono-label h-11 flex-1 cursor-pointer rounded-lg text-[12px]", deal === d ? "bg-[#b6f400] text-black" : "text-white/80 hover:text-white")}>{label}</button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-white/60">{deal === "SALE" ? "Buyers pay you once." : deal === "RENT" ? "Short, month-to-month tenancy (usually 11 months)." : "Long, fixed-term commercial lease (often 3 to 9 years), common for offices, shops and open land."}</p>
        </div>
        <Label text="Property type">
          <select value={type} onChange={(e) => { setType(e.target.value as PropertyType); setAmenities([]); }} className={field}>
            {Object.entries(typeLabels).map(([k, l]) => <option key={k} value={k}>{l === "Apartment" ? "Flat / apartment" : l}</option>)}
          </select>
        </Label>
        <Label text="Area">
          <select name="locality" required defaultValue="" className={field}>
            <option value="" disabled>Choose an area</option>
            {localities.data?.map((l) => <option key={l.id} value={l.slug}>{l.name}</option>)}
          </select>
        </Label>
      </Block>

      <Block n={2} title="Details">
        <Label text="Title" wide hint="For example: 3 BHK flat near the metro, East facing">
          <input name="title" required minLength={8} maxLength={100} className={field} placeholder="A short headline buyers will see" />
        </Label>
        <Label text="Description" wide hint="Mention what is nearby, the condition and anything special. At least 20 characters.">
          <textarea name="description" required minLength={20} maxLength={2000} rows={5} className={area} />
        </Label>
        <Label text={rental ? "Rent a month (₹)" : "Price (₹)"} hint={priceNum >= 1000 ? `About ${formatInr(priceNum)}${rental ? " a month" : ""}` : "Enter the full amount in rupees"}>
          <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d,]/g, ""))} inputMode="numeric" required className={field} placeholder={rental ? "e.g. 32000" : "e.g. 6500000"} />
        </Label>
        {rental && (
          <Label text="Security deposit (₹)" hint="Leave blank if there is none">
            <input name="deposit" inputMode="numeric" className={field} placeholder="e.g. 100000" />
          </Label>
        )}
        {plot ? (
          <Label text="Plot area (sq yd)" hint="Hyderabad plots are sold by the square yard">
            <input name="plotArea" type="number" min={1} required className={field} />
          </Label>
        ) : (
          <Label text="Built-up area (sq ft)">
            <input name="areaSqft" type="number" min={50} required className={field} />
          </Label>
        )}
        {!plot && (
          <>
            <Label text="Bedrooms"><input name="bedrooms" type="number" min={0} max={20} className={field} /></Label>
            <Label text="Bathrooms"><input name="bathrooms" type="number" min={0} max={20} className={field} /></Label>
            <Label text="Age of building (years)"><input name="ageYears" type="number" min={0} max={100} className={field} /></Label>
            <Label text="Furnishing">
              <select name="furnishing" defaultValue="" className={field}>
                <option value="">Not stated</option>
                <option value="UNFURNISHED">Unfurnished</option>
                <option value="SEMI_FURNISHED">Semi-furnished</option>
                <option value="FURNISHED">Furnished</option>
              </select>
            </Label>
          </>
        )}
        {flatLike && (
          <>
            <Label text="Floor"><input name="floor" type="number" min={0} max={150} className={field} /></Label>
            <Label text="Floors in the building"><input name="totalFloors" type="number" min={1} max={150} className={field} /></Label>
          </>
        )}
        <Label text="Parking spaces"><input name="parking" type="number" min={0} max={50} defaultValue={0} className={field} /></Label>
        <Label text="Facing">
          <select name="facing" defaultValue="" className={field}>
            <option value="">Not stated</option>
            {["EAST", "WEST", "NORTH", "SOUTH", "NORTH_EAST", "NORTH_WEST", "SOUTH_EAST", "SOUTH_WEST"].map((d) => <option key={d} value={d}>{d.replace("_", "-").toLowerCase().replace(/^\w|-\w/g, (c) => c.toUpperCase())}</option>)}
          </select>
        </Label>
        <Label text="Possession">
          <select name="possession" defaultValue="READY" className={field}>
            <option value="READY">Ready to move in</option>
            <option value="UNDER_CONSTRUCTION">Under construction</option>
            <option value="NEW_LAUNCH">New launch</option>
          </select>
        </Label>
        <label className="flex items-center gap-3 text-sm text-white/80 sm:col-span-2">
          <input name="gated" type="checkbox" className="h-5 w-5 accent-[#b6f400]" /> Inside a gated community
        </label>
        {amenityOptions.length > 0 && (
          <div className="sm:col-span-2">
            <span className="text-sm text-white/80">Amenities</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {amenityOptions.map((a) => {
                const on = amenities.includes(a);
                return (
                  <button key={a} type="button" aria-pressed={on} onClick={() => setAmenities(on ? amenities.filter((x) => x !== a) : [...amenities, a])} className={cn("cursor-pointer rounded-full border px-4 py-2 text-sm", on ? "border-[#b6f400] bg-[#b6f400]/15 text-white" : "border-white/20 text-white/75 hover:text-white")}>
                    {AMENITY_LABELS[a] ?? a}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Block>

      <Block n={3} title="Photos">
        <div className="sm:col-span-2">
          <p className="text-sm text-white/75">Add 1 to 8 photos (JPG, PNG or WebP, up to 5 MB each). The first one is the cover.</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p, i) => (
              <li key={p.file} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white/10">
                <Image src={p.url} alt={`Photo ${i + 1}`} fill sizes="200px" className="object-cover" />
                {i === 0 && <span className="mono-label absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px]">Cover</span>}
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos(photos.filter((x) => x.file !== p.file))} className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/70 hover:bg-black"><X className="h-4 w-4" /></button>
              </li>
            ))}
            {Array.from({ length: uploading }).map((_, i) => <li key={`u${i}`} className="flex aspect-[4/3] animate-pulse items-center justify-center rounded-lg bg-white/10 text-xs text-white/60">Uploading…</li>)}
            {photos.length + uploading < 8 && (
              <li>
                <button type="button" onClick={() => input.current?.click()} className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/30 text-sm text-white/75 hover:border-[#b6f400] hover:text-white">
                  <ImagePlus className="h-6 w-6" /> Add photos
                </button>
              </li>
            )}
          </ul>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
        </div>
      </Block>

      <Block n={4} title="How buyers reach you">
        <Label text="Your name">
          <input name="contactName" required minLength={2} maxLength={80} defaultValue={session.user.name} className={field} />
        </Label>
        <Label text="Phone number" hint="Shown only to people who are signed in.">
          <input name="contactPhone" type="tel" required className={field} placeholder="+91 98xxx xxxxx" />
        </Label>
      </Block>

      <p className="text-sm text-white/65">By posting you confirm you are allowed to {deal === "SALE" ? "sell" : deal === "RENT" ? "rent out" : "lease out"} this property and that the details are true. See our <Link href="/terms" className="underline">terms</Link>. Deccan Estates does not verify owner posts until papers are checked.</p>
      <button type="submit" disabled={busy || uploading > 0} className="mono-label flex h-14 cursor-pointer items-center justify-center rounded-lg bg-[#b6f400] px-9 text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? "Posting…" : "Post my property"}
      </button>
    </form>
  );
}
