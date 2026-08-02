/// <reference types="vite/client" />
import 'react';

// ─── Window Controls Overlay API ─────────────────────────────────────────────
// https://developer.mozilla.org/en-US/docs/Web/API/WindowControlsOverlay

interface WindowControlsOverlayGeometryChangeEvent extends Event {
  readonly titlebarAreaRect: DOMRect;
  readonly visible: boolean;
}

interface WindowControlsOverlay extends EventTarget {
  readonly visible: boolean;
  getTitlebarAreaRect(): DOMRect;
  addEventListener(type: 'geometrychange', listener: (ev: WindowControlsOverlayGeometryChangeEvent) => void, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: 'geometrychange', listener: (ev: WindowControlsOverlayGeometryChangeEvent) => void, options?: boolean | EventListenerOptions): void;
}

interface Navigator {
  readonly windowControlsOverlay?: WindowControlsOverlay;
}

// ─── CSS: -webkit-app-region drag property ───────────────────────────────────
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag' | 'inherit' | 'initial' | 'unset';
    appRegion?: 'drag' | 'no-drag' | 'inherit' | 'initial' | 'unset';
  }
}
