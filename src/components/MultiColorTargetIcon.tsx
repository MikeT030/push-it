interface MultiColorTargetIconProps {
  className?: string;
  size?: number;
}

const MultiColorTargetIcon = ({ className = "", size = 20 }: MultiColorTargetIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="40" cy="40" r="37" stroke="#0ABAB5" strokeWidth="6" />
      <circle cx="40" cy="40" r="27" stroke="#4300FF" strokeWidth="6" />
      <circle cx="40" cy="40" r="17" stroke="#C029DE" strokeWidth="6" />
      <circle cx="40" cy="40" r="7" stroke="#FF2C2C" strokeWidth="6" />
    </svg>
  );
};

export default MultiColorTargetIcon;
