const NoAvatarPlaceholder = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C9982E" />
        <stop offset="60%" stopColor="#D4AA3A" />
        <stop offset="100%" stopColor="#E8C85A" />
      </linearGradient>
    </defs>
    {/* Rounded square background */}
    <rect x="4" y="4" width="92" height="92" rx="20" ry="20" fill="url(#faceGrad)" />
    {/* Left eye */}
    <circle cx="34" cy="44" r="6.5" fill="white" />
    {/* Right eye (slightly higher for charm) */}
    <circle cx="66" cy="40" r="6.5" fill="white" />
    {/* Smile */}
    <path
      d="M 28 63 Q 50 82 72 63"
      stroke="white"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

export default NoAvatarPlaceholder;
