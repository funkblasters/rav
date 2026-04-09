import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

// World atlas TopoJSON — free, no API key needed
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Props {
  /** ISO 3166-1 numeric codes of countries to highlight */
  highlightedNumericIds?: Set<string>;
}

export function CountryChoropleth({ highlightedNumericIds = new Set() }: Props) {
  return (
    <div className="w-full h-full rounded overflow-hidden bg-muted/30">
      <ComposableMap projectionConfig={{ scale: 147 }} style={{ width: "100%", height: "100%" }}>
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isHighlighted = highlightedNumericIds.has(geo.id as string);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHighlighted ? "var(--color-primary)" : "var(--color-muted)"}
                    stroke="var(--color-border)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: isHighlighted ? "var(--color-primary)" : "var(--color-accent)" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
