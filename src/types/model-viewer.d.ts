import type * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerJSXProps;
    }
  }
}

interface ModelViewerJSXProps extends React.HTMLAttributes<HTMLElement> {
  key?: React.Key;
  ref?: React.Ref<HTMLElement>;
  src?: string;
  poster?: string;
  alt?: string;
  ar?: boolean;
  arModes?: string;
  "ar-modes"?: string;
  "camera-controls"?: boolean;
  cameraControls?: boolean;
  "auto-rotate"?: boolean;
  autoRotate?: boolean;
  exposure?: string | number;
  "shadow-intensity"?: string | number;
  shadowIntensity?: string | number;
  loading?: "eager" | "lazy";
  reveal?: "auto" | "interaction";
  children?: React.ReactNode;
}
