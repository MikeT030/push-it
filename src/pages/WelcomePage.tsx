import WelcomeShell from "@/components/WelcomeShell";

const WelcomePage = () => (
  <WelcomeShell
    headline="Welcome to the Team"
    tiers={[50, 60, 70, 82]}
    mode="absolute"
    showBackButton={false}
    contentOffsetY={-12}
  />
);

export default WelcomePage;
