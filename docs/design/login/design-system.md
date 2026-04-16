# Design System: The Executive Lens

## 1. Overview & Creative North Star
**Creative North Star: "The Precision Architect"**

The objective of this design system is to move beyond the "bootstrap" aesthetic of typical admin consoles and instead evoke the feel of a high-end, editorialized data dashboard. We are not just building a tool; we are building a command center. 

The "Precision Architect" philosophy relies on **monochromatic layering** and **intentional white space** to manage high information density. We reject the "box-within-a-box" approach typical of legacy software. Instead, we use a sophisticated interplay of tonal shifts and editorial typography (Manrope for headers, Inter for utility) to guide the eye. The interface should feel like it was carved from a single block of material, where depth is felt rather than seen.

---

## 2. Colors & Surface Philosophy

### The "No-Line" Rule
Standard admin consoles rely on 1px borders to separate data. In this design system, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts or subtle tonal transitions.
- Use `surface_container_low` for the main body background.
- Use `surface_container_lowest` (pure white) for primary content cards to create a natural, soft lift.
- Use `surface_dim` for the sidebar to create a grounded, authoritative anchor for navigation.

### Surface Hierarchy & Nesting
- **Level 0 (Base):** `surface` (#f7f9fb)
- **Level 1 (Sectioning):** `surface_container_low` (#f0f4f7)
- **Level 2 (Active Cards):** `surface_container_lowest` (#ffffff)
- **Level 3 (Popovers/Overlays):** `surface_bright` with Glassmorphism.

### Named Colors
| Token | HEX |
|-------|-----|
| background | #f7f9fb |
| primary | #0053db |
| primary_dim | #0048c1 |
| primary_container | #dbe1ff |
| surface | #f7f9fb |
| surface_container_low | #f0f4f7 |
| surface_container_lowest | #ffffff |
| surface_dim | #cfdce3 |
| on_surface | #2a3439 |
| on_surface_variant | #566166 |
| outline | #717c82 |
| outline_variant | #a9b4b9 |
| error | #9f403d |

---

## 3. Typography
- **Headlines (Manrope):** display, headline, title
- **Body/Labels (Inter):** body, label
- **Display-LG (3.5rem):** "At a Glance" metrics
- **Headline-SM (1.5rem):** Page titles
- **Label-MD (0.75rem):** Table headers, All-Caps +0.05em letter-spacing

---

## 4. Elevation & Depth
- **Ambient Shadow:** `box-shadow: 0px 12px 32px rgba(42, 52, 57, 0.06)`
- **Ghost Border:** `outline: 1px solid rgba(169, 180, 185, 0.2)`

---

## 5. Components
- **Primary Button:** Gradient `primary` → `primary_dim` at 135°, `md` radius
- **Input Fields:** `surface_container_highest` fill, `md` radius, 2px `primary` bottom border on focus
- **Tables:** No dividers, alternating `surface_container_low` rows, 16-20px vertical padding
- **Chips:** `secondary_container` bg, `full` roundedness
