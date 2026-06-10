// Promo carousel above the catalog (gf-guidance-cards), mirroring the
// fonts.google.com guidance cards and their scroll-snap carousel behavior.
import { useEffect, useRef, useState } from "react";
import { ButtonSpans, GfIcon, attrs, withAttrs } from "./mat";

const cards = [
  {
    header: "Readability",
    description: "How type influences readability",
    icon: "accessibility_new",
    href: "#",
  },
  {
    header: "Typography guidelines",
    description: "Styling text",
    icon: "material_design",
    href: "#",
  },
  {
    header: "Optimize font loading",
    description: "Achieve faster page load times",
    icon: "arrow_outward",
    href: "#",
  },
  {
    header: "Fonts API",
    description: "Get started with web fonts",
    icon: "code",
    href: "#",
  },
  {
    header: "Self-hosting web fonts",
    description: "Get the most out of self-hosting",
    icon: "arrow_outward",
    href: "#",
  },
  {
    header: "Internationalization",
    description: "Consider your language needs",
    icon: "language",
    href: "#",
  },
];

// The "star" badge behind each card icon.
function StarThumbnail() {
  return (
    <gf-thumbnail className="button__star">
      <span className="star-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          fill="currentColor"
        >
          <path d="M.41 12.649C-1.78 5.166 5.166-1.781 12.65.41l4.579 1.342c1.81.53 3.734.53 5.544 0L27.352.41C34.833-1.78 41.781 5.166 39.59 12.65l-1.342 4.579a9.864 9.864 0 0 0 0 5.544l1.342 4.58c2.191 7.482-4.756 14.43-12.239 12.238l-4.578-1.342a9.864 9.864 0 0 0-5.546 0L12.65 39.59C5.166 41.78-1.781 34.834.41 27.35l1.342-4.578c.53-1.81.53-3.735 0-5.546L.41 12.65Z"></path>
        </svg>
      </span>
    </gf-thumbnail>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      {...withAttrs({ "mat-fab": "", appearance: "fill", color: "secondary" })}
      className={`mdc-fab mat-mdc-fab-base mat-mdc-fab mat-mdc-button-base gmat-mdc-button nav-button nav-button--${side} gmat-elevation-z2 mat-secondary gmat-mdc-fab-fill gmat-mdc-fab-lowered`}
      aria-hidden="true"
      tabIndex={-1}
      onClick={onClick}
    >
      <span className="mat-mdc-button-persistent-ripple mdc-fab__ripple"></span>
      <span className="mdc-button__label">
        <GfIcon
          name={side === "right" ? "arrow_forward_ios" : "arrow_back_ios"}
          size={20}
          className="nav-button__icon"
          withName
        />
      </span>
      <ButtonSpans />
    </button>
  );
}

export function GuidanceCards() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({ start: true, end: false });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    const update = () => {
      const max = element.scrollWidth - element.clientWidth;
      setScrollState({
        start: element.scrollLeft <= 4,
        end: element.scrollLeft >= max - 4,
      });
      // Cards are 296px wide with a 12px gap.
      setActiveIndex(
        Math.max(
          0,
          Math.min(cards.length - 1, Math.round(element.scrollLeft / 308)),
        ),
      );
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const shift = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: direction * 308,
      behavior: "smooth",
    });
  };

  return (
    <gf-guidance-cards>
      <gf-carousel>
        <div className="scrollable guidance-carousel" ref={scrollerRef}>
          <div className="wrapper carousel__cols-3">
            {cards.map((card, index) => (
              <gf-guidance-item
                key={card.header}
                {...attrs("gf-carousel-item")}
                className={`carousel-item guidance-item${
                  index === activeIndex ? " carousel-item--active" : ""
                }`}
              >
                <a className="item-container" href={card.href}>
                  <div className="item-contents">
                    <span className="item-contents__left">
                      <div className="item-contents__header gf-title-medium">
                        {card.header}
                      </div>
                      <div className="item-contents__description gf-body-small">
                        {card.description}
                      </div>
                    </span>
                    <div className="item-contents__button">
                      <StarThumbnail />
                      <GfIcon name={card.icon} className="button__icon" />
                    </div>
                  </div>
                </a>
              </gf-guidance-item>
            ))}
          </div>
          {!scrollState.start ? (
            <div className="gradient gradient--left"></div>
          ) : null}
          {!scrollState.end ? (
            <div className="gradient gradient--right"></div>
          ) : null}
          {!scrollState.start ? (
            <NavButton side="left" onClick={() => shift(-1)} />
          ) : null}
          {!scrollState.end ? (
            <NavButton side="right" onClick={() => shift(1)} />
          ) : null}
        </div>
      </gf-carousel>
    </gf-guidance-cards>
  );
}
