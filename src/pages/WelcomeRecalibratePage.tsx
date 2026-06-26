import WelcomeShell from "@/components/WelcomeShell";

const WelcomeRecalibratePage = () => (
  <WelcomeShell
    headline={
      <>
        Recalibrate Your
        <br />
        Daily Push-Ups
      </>
    }
    tiers={[50, 60, 70, 82]}
    mode="additive"
    successToast="Goal recalibrated. Keep pushing!"
    contentOffsetY={-12}
  />

);

export default WelcomeRecalibratePage;
