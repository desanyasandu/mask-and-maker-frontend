import type * as React from "react";
import type { ModelViewerElement } from "@google/model-viewer";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerJSXProps;
    }
  }
}

interface ModelViewerJSXProps extends React.HTMLAttributes<HTMLElement> {
  key?: React.Key;
  ref?: React.Ref<ModelViewerElement>;
  src?: string;
  poster?: string;
  alt?: string;
  ar?: boolean;
  arModes?: string;
  "ar-modes"?: string;
  "ar-placement"?: "floor" | "wall";
  "camera-controls"?: boolean;
  cameraControls?: boolean;
  orientation?: string;
  "camera-orbit"?: string;
  cameraOrbit?: string;
  "interaction-prompt"?: "auto" | "when-focused" | "none";
  interactionPrompt?: "auto" | "when-focused" | "none";
  "touch-action"?: "pan-y";
  "auto-rotate"?: boolean;
  autoRotate?: boolean;
  exposure?: string | number;
  "shadow-intensity"?: string | number;
  shadowIntensity?: string | number;
  "shadow-softness"?: string | number;
  shadowSoftness?: string | number;
  "environment-image"?: string;
  environmentImage?: string;
  "field-of-view"?: string;
  fieldOfView?: string;
  loading?: "eager" | "lazy";
  reveal?: "auto" | "interaction";
  children?: React.ReactNode;
}
