import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 });
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateIndicator = () => {
      if (listRef.current) {
        const activeTab = listRef.current.querySelector('[data-state="active"]') as HTMLElement;
        if (activeTab) {
          const listRect = listRef.current.getBoundingClientRect();
          const tabRect = activeTab.getBoundingClientRect();
          setIndicatorStyle({
            left: tabRect.left - listRect.left,
            width: tabRect.width,
          });
        }
      }
    };

    updateIndicator();
    
    // Use MutationObserver to detect tab changes
    const observer = new MutationObserver(updateIndicator);
    if (listRef.current) {
      observer.observe(listRef.current, { attributes: true, subtree: true, attributeFilter: ['data-state'] });
    }

    window.addEventListener('resize', updateIndicator);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, []);

  return (
    <TabsPrimitive.List
      ref={(node) => {
        (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn(
        "relative inline-flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <span
        className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />
    </TabsPrimitive.List>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-lg font-medium ring-offset-background transition-all data-[state=active]:text-foreground data-[state=active]:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
