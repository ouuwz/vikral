interface BrandMarkProps {
  className?: string;
}

export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      focusable="false"
    >
      <rect x="4.5" y="11" width="25" height="25" rx="8" transform="rotate(-18 4.5 11)" fill="currentColor" />
      <rect x="17" y="8.5" width="25" height="25" rx="8" transform="rotate(17 17 8.5)" fill="currentColor" />
    </svg>
  );
}
