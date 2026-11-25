import Link from 'next/link';

export function CourseLogo() {
  return (
    <Link href="/" aria-label="Course home" title="Course home" className="ui-course-logo">
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <path d="M6 23Q11 2 25 21" fill="none" stroke="var(--color-turquoise)" strokeWidth="2.5"
          strokeDasharray=".1 5" strokeLinecap="round" />
        <circle cx="8" cy="23" r="4.4" fill="var(--color-coral)" />
        <circle cx="18" cy="10" r="4.4" fill="var(--color-amber)" />
        <circle cx="25" cy="22" r="4.4" fill="var(--color-turquoise)" />
      </svg>
      <span>Home</span>
    </Link>
  );
}
