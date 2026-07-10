import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-white/20 bg-input transition-colors duration-200 ease-in-out data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      "shadow-[inset_0_3px_6px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.06)]",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none absolute left-0.5 block h-7 w-7 rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.4),0_2px_2px_rgba(0,0,0,0.25),inset_0_-2px_2px_rgba(0,0,0,0.08)] ring-0 transition-transform duration-200 ease-in-out data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
