# Design System Strategy: The Elevated Campus Experience

## 1. Overview & Creative North Star

**Creative North Star: "The Academic Curator"**

This design system moves beyond the generic utility of a campus app, positioning itself as a high-end editorial platform for student life. We reject the "standard app" aesthetic characterized by rigid borders and flat grids. Instead, we embrace **Soft Minimalism**—a philosophy where high-contrast typography meets fluid, tonal layering.

By utilizing intentional asymmetry and generous whitespace (using our `24` and `20` spacing tokens), we create an environment that feels premium and breathing. The goal is to make the campus community feel vibrant yet organized, using a "nested" architecture that mimics physical sheets of fine paper layered under soft, ambient light.

---

## 2. Colors & Surface Philosophy

The palette is anchored by a deep, intellectual **Dark Violet (#4B0082)** and a clean, expansive **White**. We use Material Design tokens to create a sophisticated, monochromatic-leaning depth with unexpected tonal accents.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning or card definition. Structural boundaries must be achieved through:
1.  **Background Shifts:** Placing a `surface-container-low` card on a `surface` background.
2.  **Tonal Transitions:** Using `surface-container-highest` for secondary interaction areas to provide contrast without the "boxiness" of a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a three-dimensional stack. Use the hierarchy below to define importance:
*   **Base Level:** `surface` (#fff7fe) – The canvas.
*   **Section Level:** `surface-container-low` (#fcf0ff) – Sub-sections or large content groupings.
*   **Object Level:** `surface-container-lowest` (#ffffff) – Individual cards (e.g., a "Trending Confession").
*   **Interaction Level:** `surface-bright` (#fff7fe) – For elements requiring immediate focus.

### The "Glass & Gradient" Rule
To elevate the "Premium" feel, floating elements (like the Navigation Bar or persistent FABs) must use **Glassmorphism**:
*   **Fill:** `surface` at 70% opacity.
*   **Effect:** 20px Backdrop Blur.
*   **CTA Soul:** Main buttons should utilize a subtle linear gradient from `primary` (#7c42b3) to `primary_dim` (#6f34a6) at a 135-degree angle. This adds a "jewel-like" depth that flat hex codes lack.

---

## 3. Typography: Editorial Authority

We use a dual-font strategy to balance character with legibility.

*   **Display & Headlines (Plus Jakarta Sans):** Chosen for its modern, geometric structure. We use aggressive scaling (e.g., `display-lg` at 3.5rem) to create clear editorial entry points. Headlines should feel like magazine titles—bold and unapologetic.
*   **Body & Labels (Manrope):** Chosen for its high x-height and exceptional readability on mobile. Manrope feels functional yet sophisticated.

**Hierarchy Strategy:**
*   **Emphasis:** Use `primary` color tokens for `title-lg` to highlight navigation nodes (e.g., "Trending Confessions").
*   **Subtext:** Use `on_surface_variant` (#6c5680) for `body-sm` to create a clear separation between primary content and metadata.

---

## 4. Elevation & Depth

We avoid the "pasted-on" look of traditional drop shadows in favor of **Ambient Light Layering**.

*   **Tonal Layering:** 90% of your hierarchy should be solved by the Surface Hierarchy (Nesting) mentioned in Section 2.
*   **Ambient Shadows:** For floating cards, use a shadow with a 24px blur, 0px spread, and 4% opacity. The shadow color must be `on_surface` (#3e2a51), never pure black. This creates a soft, purple-tinted shadow that feels natural to the environment.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in high-glare environments), use `outline_variant` (#c2a8d7) at **15% opacity**.
*   **Roundedness:** Stick to the `xl` (1.5rem) token for main content cards to maintain the "Soft" aesthetic, and `full` (9999px) for chips and search bars.

---

## 5. Components

### Cards (The Primary Unit)
*   **Structure:** No borders. Use `surface-container-lowest` on a `surface-container-low` background.
*   **Padding:** Use `6` (2rem) for internal padding to ensure high whitespace.
*   **Imagery:** Apply `lg` (1rem) corner radius to nested images to create a "nested frame" effect.

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_dim`). Roundedness: `full`. No shadow.
*   **Secondary:** Ghost style. `outline` token at 20% opacity. Label in `primary`.
*   **Tertiary:** Text-only, `label-md` weight, in `on_surface_variant`.

### Input Fields & Search
*   **Background:** `surface_container_highest` (#f0dbff).
*   **Shape:** `full` (9999px).
*   **Placeholder:** `on_surface_variant` at 50% opacity.
*   **Elevation:** No shadow when idle. On focus, add a 1pt `primary` ghost border (20% opacity).

### Specialized Campus Components
*   **Confession Bubbles:** Use `surface_container_low` with an asymmetrical corner radius (top-left: `xl`, top-right: `xl`, bottom-right: `xl`, bottom-left: `sm`) to mimic a speech bubble without the cliché pointer.
*   **Event Chips:** Use `secondary_container` (#dafad2) with `on_secondary_container` (#466143) text for high-contrast "Active" states.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional tool. If elements feel crowded, increase spacing using the `10` or `12` tokens.
*   **DO** use "Plus Jakarta Sans" for all numerical data to give it a tech-forward, premium feel.
*   **DO** align text to a strict vertical rhythm, but allow cards to have varying heights for an organic, "Pinterest-style" flow.

### Don't
*   **DON'T** use 100% opaque black or grey for text. Always use the `on_surface` or `on_surface_variant` violet-tinted neutrals.
*   **DON'T** use traditional dividers (`<hr>`). Separate list items with a `2.5` (0.85rem) vertical gap instead.
*   **DON'T** use the `DEFAULT` (0.5rem) roundedness for large components; it feels too "standard." Lean into `lg` or `xl` for a more bespoke, modern look.