import clsx from "clsx";
type Opts = {
  width?: number;
  height?: number;
  mirror?: true;
} & React.SVGProps<SVGSVGElement>;

// copy from excalidraw/packages/excalidraw/component/icons.tsx
export const createIcon = (
  d: string | React.ReactNode,
  opts: number | Opts = 512
) => {
  const {
    width = 512,
    height = width,
    mirror,
    style,
    ...rest
  } = typeof opts === "number" ? ({ width: opts } as Opts) : opts;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      className={clsx({ "rtl-mirror": mirror })}
      style={style}
      {...rest}
    >
      {typeof d === "string" ? <path fill="currentColor" d={d} /> : d}
    </svg>
  );
};

// @ts-expect-error tablerIconProps is declared but its value is never read.
const tablerIconProps: Opts = {
  width: 24,
  height: 24,
  fill: "none",
  strokeWidth: 2,
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const modifiedTablerIconProps: Opts = {
  width: 20,
  height: 20,
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// -----------------------------------------------------------------------------

// tabler: arrow-left
export const ArrowLeftIcon = createIcon(
  <path stroke-width="1.25" d="M5 12h14M5 12l6 6m-6-6l6-6"></path>,
  modifiedTablerIconProps
);
