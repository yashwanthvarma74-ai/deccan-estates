/** Black engineered-grid band whose lower edge dips in the middle into the white section below. */
export function GridBridge() {
  return (
    <section aria-hidden className="relative h-[46vh] min-h-[22rem] overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-90 [background-image:linear-gradient(to_right,rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:112px_112px] [mask-image:radial-gradient(ellipse_at_50%_40%,#000_30%,transparent_85%)]" />
      <div className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.28)_1.2px,transparent_1.4px)] [background-size:112px_112px]" />
      <svg className="absolute inset-x-0 bottom-0 h-10 w-full text-paper" viewBox="0 0 1920 40" preserveAspectRatio="none">
        <path fill="currentColor" d="M0 40V0H300C350 0 352 25 404 25H1516C1568 25 1570 0 1620 0H1920V40Z" />
      </svg>
    </section>
  );
}
