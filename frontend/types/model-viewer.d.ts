import type React from "react";

// Allow usage of the <model-viewer> web component in TSX
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        "auto-rotate"?: boolean;
        "camera-controls"?: boolean;
        "shadow-intensity"?: string | number;
        "shadow-softness"?: string | number;
        exposure?: string | number;
        "camera-orbit"?: string;
        "min-camera-orbit"?: string;
        "max-camera-orbit"?: string;
        "interpolation-decay"?: string | number;
        slot?: string;
        poster?: string;
        ar?: boolean;
        "ar-modes"?: string;
      };
    }
  }
}
