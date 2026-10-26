import type { ReactNode } from "react";

const BRICK = {
  backgroundColor: "#0d2a22",
  backgroundImage: "repeating-linear-gradient(0deg, rgb(0 0 0 / 0.38) 0 1px, transparent 1px 12px), repeating-linear-gradient(90deg, rgb(0 0 0 / 0.26) 0 1px, transparent 1px 26px), linear-gradient(180deg, rgb(255 255 255 / 0.06), transparent 40%)",
} as const;
const IRON = "repeating-linear-gradient(90deg, #0a1c19 0 2.2px, transparent 2.2px 18px)";

/** Wall and railing that run out from the gate pillars to the edge of the screen. */
function WallRun() {
  return (
    <div aria-hidden className="relative h-full flex-1">
      <div className="absolute inset-x-0 bottom-0 h-[38px] sm:h-[50px]" style={BRICK}><div className="absolute inset-x-0 top-0 h-[5px] bg-[#255b49]" /></div>
      <div className="absolute inset-x-0 bottom-[38px] h-[26px] sm:bottom-[50px] sm:h-[34px]" style={{ backgroundImage: IRON }}>
        <div className="absolute inset-x-0 top-[3px] h-[2.5px] bg-[#0a1c19]" /><div className="absolute inset-x-0 bottom-[3px] h-[2.5px] bg-[#0a1c19]" />
      </div>
    </div>
  );
}

/** The gate itself: two plain stone pillars and an arched wrought-iron gate with a name plate. */
function Gate() {
  const bars = Array.from({ length: 30 }, (_, i) => 452 + i * 14.4);
  return (
    <svg aria-hidden viewBox="380 0 560 170" className="block h-[100px] w-auto max-w-[70vw] shrink-0 sm:h-[134px] lg:h-[170px]">
      <defs><linearGradient id="gwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#173d31" /><stop offset="1" stopColor="#0a211a" /></linearGradient></defs>
      {[392, 872].map((x) => (
        <g key={x}>
          <rect x={x} y="44" width="56" height="126" fill="url(#gwall)" />
          <rect x={x - 6} y="38" width="68" height="10" fill="#255b49" />
          <path d={`M${x - 2} 38 L${x + 28} 22 L${x + 58} 38Z`} fill="#1c4a3b" />
          <rect x={x + 8} y="70" width="40" height="3" fill="#255b49" /><rect x={x + 8} y="100" width="40" height="3" fill="#255b49" />
        </g>
      ))}
      <path d="M448 92 Q660 24 872 92" stroke="#0a1c19" strokeWidth="5" fill="none" />
      <path d="M448 108 Q660 44 872 108" stroke="#0a1c19" strokeWidth="2.5" fill="none" />
      <rect x="448" y="154" width="424" height="4" fill="#0a1c19" />
      {bars.map((x) => {
        if (x > 652 && x < 668) return null;
        const t = (x - 448) / 424, top = 92 - Math.sin(t * Math.PI) * 38 + 2;
        return <g key={x}><rect x={x} y={top} width="2.4" height={158 - top} fill="#0a1c19" /><path d={`M${x - 1.6} ${top} L${x + 1.2} ${top - 9} L${x + 4} ${top}Z`} fill="#0a1c19" /></g>;
      })}
      <rect x="656" y="62" width="8" height="96" fill="#0a1c19" />
      <rect x="590" y="46" width="140" height="20" rx="3" fill="#0a1c19" />
      <text x="660" y="60" textAnchor="middle" fontSize="10" letterSpacing="3.2" fill="#d9e6df" fontFamily="ui-monospace, monospace">DECCAN ESTATES</text>
    </svg>
  );
}

/** Content sits inside a compound: gate on top with walls running to the screen edges, brick walls down both sides and along the bottom. */
export function CompoundFrame({ children, level = 0.3 }: { children: ReactNode; level?: number }) {
  // The wall keeps its thickness. The price only moves the walls: less room inside and outside means walls close to the content.
  // inverted on request: the lower the price, the more room; the higher the price, the tighter the walls
  const lvl = 1 - Math.min(1, Math.max(0, level));
  return (
    <div
      className="relative transition-[margin] duration-300 ease-out"
      style={{
        ["--lvl" as string]: lvl,
        ["--pad" as string]: "calc(10px + var(--lvl) * clamp(20px, 5.5vw, 100px))",
        ["--out" as string]: "calc(8px + var(--lvl) * clamp(10px, 5vw, 90px))",
        marginInline: "var(--out)",
      }}
    >
      <div className="flex items-end"><WallRun /><Gate /><WallRun /></div>
      <div className="relative">
        <div aria-hidden className="absolute inset-y-0 left-0 w-3 sm:w-5 lg:w-7" style={BRICK} />
        <div aria-hidden className="absolute inset-y-0 right-0 w-3 sm:w-5 lg:w-7" style={BRICK} />
        <div className="mx-auto max-w-[1320px] px-[calc(var(--pad)+1.5rem)] py-[var(--pad)] transition-[padding] duration-300 ease-out lg:px-[calc(var(--pad)+2.5rem)]">{children}</div>
      </div>
      <div className="relative h-14 sm:h-16" style={BRICK}>
        <div aria-hidden className="absolute inset-x-0 top-0 h-2 bg-[#255b49]" />
        {[0, 25, 50, 75, 100].map((l) => (
          <div key={l} aria-hidden className="absolute -top-[14px] h-[calc(100%+14px)] w-9 -translate-x-1/2 sm:w-11" style={{ left: `${l}%`, ...BRICK }}>
            <div className="absolute -top-2 -inset-x-1.5 h-2.5 bg-[#255b49]" />
          </div>
        ))}
      </div>
    </div>
  );
}
