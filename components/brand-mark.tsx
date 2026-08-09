export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/icons/app-icon.svg" />
    </span>
  );
}
