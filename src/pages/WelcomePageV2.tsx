import WelcomeShell from "@/components/WelcomeShell";

const WelcomePageV2 = () => (
  <WelcomeShell
    headline={
      <>
        You did it!
        <br />
        You hit 30k Push-Ups, awesome.
      </>
    }
    tiers={[82, 90, 100]}
    mode="additive"
    showFireworks
    fireworksDelayMs={5000}
    contentOffsetY={-12}
    showBackButton={false}
  />


);

export default WelcomePageV2;
