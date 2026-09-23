# UI / UX Specification

## Visual references

Inspect the repository for these assets before implementing the product UI:

- `home-image.png` or `home-img.png`;
- `tradingengine.png`;
- `rewards.png`;
- any related design references.

These assets come from a previous project. They are **visual references only**, not product specifications.

Do not blindly copy old terminology, labels, data, features, navigation, or business logic. Adapt every visible element to the current self-rebalancing treasury product and only to functionality that is actually implemented.

If a referenced asset is absent, do not invent or recreate it. Record the missing asset as a visual-reference blocker and continue all UI work that does not depend on exact visual matching.

## Interactive home

The home reference must not remain a flat static image. Recognizable product regions should become accessible interactive entry points.

At minimum, when present:

- **Wallet** → real supported wallet selection/connection flow;
- **Trading Engine** → real market participation/trading interface, using `tradingengine.png` as visual reference;
- **Rewards** → real incentives/rewards interface, using `rewards.png` as visual reference;
- **Settings** → real useful settings/diagnostics UI;
- other recognizable regions → map only when they correspond to truthful product functionality.

Every interactive region needs:

- clear hover highlight;
- focus-visible state;
- keyboard access;
- semantic control/accessible label;
- appropriate pointer affordance;
- real target action;
- no dead or misleading hotspots.

## Implementation preference

Prefer, in order:

1. reconstruct the scene as real semantic React components when practical;
2. use the image as a base with a typed/config-driven hotspot overlay;
3. use a hybrid of artwork + real interactive components.

Do not scatter one-off absolute click handlers across components. Centralize hotspot definitions and actions.

## Product copy

Use language consistent with the real product:

- private prediction market;
- weekly round;
- market conviction;
- quote-side assets;
- market resolution;
- treasury allocation/rebalancing;
- asymmetric friction/taxes;
- rewards/incentives;
- wallet connection;
- privacy.

Never claim "fully private", "anonymous", or similar guarantees unless verified.

## Required UX states

Implement relevant states for:

- wallet missing / rejected / connected / disconnected / wrong network;
- provider initialization;
- market unavailable / open / closed / resolving / resolved;
- position entry / proving / awaiting signature / submitting / confirmed / failed;
- treasury rebalancing / complete;
- rewards unavailable / available / claiming / claimed;
- unsupported feature;
- actionable unexpected errors.

Avoid indefinite ambiguous loading states.

## Responsive behavior

The core product must remain usable on desktop, tablet, and mobile. If image hotspots become fragile on narrow screens, provide an accessible mobile fallback such as stacked product cards or equivalent navigation exposing the same core features.
