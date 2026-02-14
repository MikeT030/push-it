interface MultiColorTargetIconProps {
  className?: string;
  size?: number;
}

const MultiColorTargetIcon = ({ className = "", size = 20 }: MultiColorTargetIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer circle - #0ABAB5 */}
      <circle cx="12" cy="12" r="10" stroke="#0ABAB5" fill="none" />
      {/* Middle circle - #C029DE */}
      <circle cx="12" cy="12" r="6" stroke="#C029DE" fill="none" />
      {/* Inner circle - #7036FF */}
      <circle cx="12" cy="12" r="2" stroke="#7036FF" fill="none" />
    </svg>
  );
};

export default MultiColorTargetIcon;
