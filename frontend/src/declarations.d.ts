/// <reference types="vite/client" />

// SVG asset imports
declare module "*.svg" {
  const src: string;
  export default src;
}

// react-simple-maps v3 ships no bundled types
declare module "react-simple-maps" {
  import type { ReactNode, CSSProperties } from "react";

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: CSSProperties;
    children?: ReactNode;
  }
  export function ComposableMap(props: ComposableMapProps): JSX.Element;

  interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    children?: ReactNode;
  }
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;

  interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: GeoFeature[] }) => ReactNode;
  }
  export function Geographies(props: GeographiesProps): JSX.Element;

  interface GeoFeature {
    rsmKey: string;
    id: string | number;
    properties: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface GeographyProps {
    geography: GeoFeature;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
  }
  export function Geography(props: GeographyProps): JSX.Element;
}
