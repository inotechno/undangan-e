import { getLogoData, type LogoFileKey } from "./logo-paths";

export type LogoVariant = LogoFileKey;

const MONO_VARIANTS = new Set<LogoVariant>([
  "undangane-monochrome-black",
  "undangane-monochrome-white",
  "undangane-watermark",
]);

export interface UndanganELogoProps {
  variant?: LogoVariant;
  className?: string;
  width?: number;
  height?: number;
  title?: string;
}

export function UndanganELogo({
  variant = "undangane-primary",
  className,
  width,
  height,
  title = "UndanganE",
}: UndanganELogoProps) {
  const data = getLogoData(variant);
  if (!data) return null;

  const mono = MONO_VARIANTS.has(variant);

  return (
    <svg
      viewBox={data.viewBox}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={title}
      fill={mono ? "currentColor" : undefined}
      focusable="false"
      style={{ display: "block", maxWidth: "100%", height: "auto" }}
    >
      {data.paths.map((path, i) => (
        <path
          key={i}
          d={path.d}
          fill={mono ? "currentColor" : path.fill}
          transform={path.transform}
          opacity={path.opacity}
        />
      ))}
    </svg>
  );
}
