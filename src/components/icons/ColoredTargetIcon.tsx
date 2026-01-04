interface ColoredTargetIconProps {
  className?: string;
  size?: number;
}

const ColoredTargetIcon = ({ className, size = 20 }: ColoredTargetIconProps) => {
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
      <circle cx="12" cy="12" r="10" stroke="#0ABAB5" />
      {/* Middle circle - #C029DE */}
      <circle cx="12" cy="12" r="6" stroke="#C029DE" />
      {/* Inner circle - #4300FF */}
      <circle cx="12" cy="12" r="2" stroke="#4300FF" />
    </svg>
  );
};

export default ColoredTargetIcon;
