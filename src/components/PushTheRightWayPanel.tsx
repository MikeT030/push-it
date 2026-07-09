import { useState } from "react";
import { BookOpen, X, CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const ACCENT = "#0ABAB5";

const PushTheRightWayPanel = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-12 gap-2"
          style={{
            backgroundColor: `${ACCENT}1A`,
            borderColor: ACCENT,
            color: ACCENT,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${ACCENT}B3`;
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${ACCENT}1A`;
            e.currentTarget.style.color = ACCENT;
          }}
          onMouseDown={(e) => (e.currentTarget.style.backgroundColor = `${ACCENT}B3`)}
        >
          <BookOpen className="w-5 h-5" />
          Push the Right Way
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        hideCloseButton
        className="h-[100dvh] w-full max-w-none rounded-none border-none p-0 overflow-y-auto"
        style={{
          backgroundColor: "#101214",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.14 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\"), radial-gradient(ellipse at top left, #0C2544 0%, #101214 90%)",
        }}
      >
        <div className="safe-top px-6 pt-6 pb-12 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6 mt-5">
            <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6" style={{ color: ACCENT }} />
              Push the Right Way
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-[#3B404F] hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="space-y-4 mt-5">
            {/* Proper form */}
            <section className="bg-card/40 border border-[#3B404F] rounded-2xl p-5">
              <h3 className="text-lg text-foreground font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: ACCENT }} />
                Proper form
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Hands shoulder-width apart, fingers spread, index fingers pointing forward.</li>
                <li>Straight line from head to heels — no sagging hips, no piked butt.</li>
                <li>Brace your core and glutes the whole rep.</li>
                <li>Elbows tuck at roughly 45° — not flared to 90°.</li>
                <li>Lower until your chest is a fist above the floor, then press up fully.</li>
                <li>Breathe: inhale on the way down, exhale on the way up.</li>
              </ul>
            </section>

            {/* Common mistakes */}
            <section className="bg-card/40 border border-[#3B404F] rounded-2xl p-5">
              <h3 className="text-lg text-foreground font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FF8C00]" />
                Common mistakes
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Sagging or piking hips — kills core tension and lower back.</li>
                <li>Flared elbows — stresses shoulders.</li>
                <li>Half reps — no full lockout or no full descent.</li>
                <li>Head craning forward — keep your neck neutral.</li>
                <li>Rushing volume with sloppy reps — quality beats speed.</li>
              </ul>
            </section>

            {/* Counter-body activities */}
            <section className="bg-card/40 border border-[#3B404F] rounded-2xl p-5">
              <h3 className="text-lg text-foreground font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-white" />
                Counter-body activities
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Push-ups load the chest, front shoulders and triceps. Balance them
                so your posture, joints and back stay healthy.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li><span className="text-foreground font-medium">Pulling work:</span> rows, pull-ups, band pull-aparts — 1 pull for every 1–2 pushes.</li>
                <li><span className="text-foreground font-medium">Rear delts & upper back:</span> face pulls, reverse flys, YTWs.</li>
                <li><span className="text-foreground font-medium">Chest & shoulder mobility:</span> doorway pec stretch, thread-the-needle, wall angels.</li>
                <li><span className="text-foreground font-medium">Wrist care:</span> wrist circles, kneeling wrist stretches before pushing.</li>
                <li><span className="text-foreground font-medium">Core & posterior chain:</span> planks, hip bridges, bird-dogs.</li>
                <li><span className="text-foreground font-medium">Rest:</span> 1–2 lighter days per week — muscles grow between sessions.</li>
              </ul>
            </section>

            {/* Progression */}
            <section className="bg-card/40 border border-[#3B404F] rounded-2xl p-5">
              <h3 className="text-lg text-foreground font-semibold mb-3">
                Progress smart
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Warm up: arm circles, scap push-ups, a light first set.</li>
                <li>Add volume gradually — roughly 10% per week is plenty.</li>
                <li>Sharp joint pain = stop. Muscle burn = fine.</li>
                <li>Track quality reps, not just totals.</li>
              </ul>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PushTheRightWayPanel;
