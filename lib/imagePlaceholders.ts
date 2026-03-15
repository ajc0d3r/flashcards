function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildPlaceholderSvg(
  width: number,
  height: number,
  options: {
    topColor: string;
    bottomColor: string;
    accentOne: string;
    accentTwo: string;
  },
): string {
  const { topColor, bottomColor, accentOne, accentTwo } = options;

  return svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${topColor}" />
          <stop offset="100%" stop-color="${bottomColor}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <circle cx="${Math.floor(width * 0.23)}" cy="${Math.floor(height * 0.3)}" r="${Math.floor(Math.min(width, height) * 0.12)}" fill="${accentOne}" opacity="0.82" />
      <circle cx="${Math.floor(width * 0.72)}" cy="${Math.floor(height * 0.28)}" r="${Math.floor(Math.min(width, height) * 0.16)}" fill="${accentTwo}" opacity="0.78" />
      <circle cx="${Math.floor(width * 0.5)}" cy="${Math.floor(height * 0.72)}" r="${Math.floor(Math.min(width, height) * 0.2)}" fill="${accentOne}" opacity="0.56" />
    </svg>`,
  );
}

export const PLACEHOLDER_IMAGE_SQUARE = buildPlaceholderSvg(640, 640, {
  topColor: "#f5edff",
  bottomColor: "#eadcff",
  accentOne: "#d7c2ff",
  accentTwo: "#c6d8ff",
});

export const PLACEHOLDER_IMAGE_THEME = buildPlaceholderSvg(600, 400, {
  topColor: "#f4efff",
  bottomColor: "#ece0ff",
  accentOne: "#d4c4ff",
  accentTwo: "#c6ddff",
});

export const PLACEHOLDER_IMAGE_HERO = buildPlaceholderSvg(1200, 720, {
  topColor: "#f6eeff",
  bottomColor: "#eee2ff",
  accentOne: "#d5c6ff",
  accentTwo: "#cbe2ff",
});
