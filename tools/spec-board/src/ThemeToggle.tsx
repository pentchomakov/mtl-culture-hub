import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { useColorMode, type CdlColorMode } from "./lib/use-color-mode";
import { cn } from "./lib/utils";

/**
 * Dark / Light / System, as the CDL theme picker.
 *
 * This is the same control the docs portal carries in its sidebar footer, down to the
 * sliding indicator: one board, one theme picker, so a reader moving between the two
 * surfaces does not have to learn a second one. The order is the CDL order (Dark first),
 * and the icons are Phosphor because every other icon in the design system is.
 *
 * The indicator is a single absolutely-positioned element translated across the track
 * rather than a background on the active button. That is what makes the change read as
 * one control moving instead of two buttons blinking, and it is why the geometry below is
 * fixed: each cell is `h-5 w-6` (1.5rem wide), so the indicator's offset is the active
 * index times 1.5rem. Change one and you change the other.
 *
 * System is a real third mode, not a default: `useColorMode` subscribes to
 * `prefers-color-scheme` while it is selected, so the board follows the OS switching at
 * dusk without being told again.
 */
const OPTIONS = [
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export function ThemeToggle() {
  const { mode, setMode } = useColorMode();
  const activeIndex = Math.max(
    0,
    OPTIONS.findIndex((o) => o.value === mode),
  );

  return (
    <div
      role="radiogroup"
      aria-label="Color mode"
      className="relative flex items-center gap-0 rounded-lg border border-border bg-muted p-[3px]"
    >
      <span
        aria-hidden="true"
        className="absolute top-[3px] left-[3px] h-5 w-6 rounded-md bg-background shadow-sm transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(${activeIndex * 1.5}rem)` }}
      />
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setMode(value as CdlColorMode)}
            className={cn(
              "relative z-10 flex h-5 w-6 items-center justify-center rounded-md transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={12} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
