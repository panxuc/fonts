// The site mirrors fonts.google.com's DOM, which uses Angular-style custom
// elements (gf-*, mat-*, ...). Declare them for JSX with arbitrary attributes.
import type React from "react";

type AnyElement = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & { [attribute: string]: unknown },
  HTMLElement
>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [tag: `gf-${string}`]: AnyElement;
      [tag: `mat-${string}`]: AnyElement;
      [tag: `cdk-${string}`]: AnyElement;
      [tag: `router-${string}`]: AnyElement;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      [tag: `gf-${string}`]: AnyElement;
      [tag: `mat-${string}`]: AnyElement;
      [tag: `cdk-${string}`]: AnyElement;
      [tag: `router-${string}`]: AnyElement;
    }
  }
}

export {};
