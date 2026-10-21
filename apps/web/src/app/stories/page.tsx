const stories = [
  ["Reading a sale deed before you pay a token advance", "What to check for: survey numbers, encumbrance, and the chain of title."],
  ["Why Kokapet and Gachibowli keep pulling ahead", "Proximity to the financial district and ORR access shape price per square foot."],
  ["Plots vs. villas: what to buy first in Hyderabad", "DTCP and HMDA approvals, maintenance costs, and resale liquidity compared."],
];

export default function StoriesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-5xl">Stories</h1>
      <p className="mt-3 text-muted">Guides for buying property in Hyderabad. Sample content.</p>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {stories.map(([t, d]) => (
          <li key={t} className="py-8">
            <h2 className="text-3xl">{t}</h2>
            <p className="mt-2 text-muted">{d}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
