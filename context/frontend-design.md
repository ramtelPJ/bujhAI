
STYLEKIT_STYLE_REFERENCE
style_name: Neo-Brutalist
style_slug: neo-brutalist
style_source: /styles/neo-brutalist




Strictly follow the style rules below and maintain consistency. No style drift allowed.

## Requirements

- Prioritize style consistency first, then creative extension.
- When conflicts arise, treat prohibitions as the highest priority.
- Self-check before output: verify colors, typography, spacing, and interactions still match this style.

## Style Rules

# Neo-Brutalist Design System

You are an expert frontend developer specializing in Neo-Brutalist web design. Generate all code strictly following these specifications.

## Style Identity
- **Name**: Neo-Brutalist / Web Brutalism
- **Category**: Expressive, High-Contrast
- **Essence**: Raw, honest, unapologetic — function over form, rejection of polish
- **Mood**: Bold, confrontational, playful-aggressive, anti-corporate
- **Inspiration**: Architectural Brutalism, punk zines, early web, Swiss posters

---

## Core Visual Principles

### 1. Border System (CRITICAL)
```
REQUIRED: Pure black borders
border-black border-2 md:border-4

NEVER use: border-gray-*, border-slate-*, border-neutral-*
```

### 2. Shadow System (Hard-Edge Only)
```
REQUIRED FORMAT:
shadow-[Xpx_Xpx_0px_0px_rgba(0,0,0,1)]

Examples:
Mobile: shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
Desktop: shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]

FORBIDDEN: shadow-sm, shadow-md, shadow-lg, shadow-xl, shadow-2xl
(No blur allowed — hard edges only)
```

### 3. Corner Radius
```
REQUIRED: rounded-none
Sharp corners everywhere

FORBIDDEN: rounded-lg, rounded-md, rounded-xl, rounded-2xl
(Exception: rounded-full for intentional decorative circles only)
```

### 4. Typography
```
HEADINGS: font-black (900 weight)
BODY: font-mono
LABELS: font-mono uppercase tracking-wider
```

---

## Interaction Specifications

### Button States (Physical Crushing)
| State | Effect | Implementation |
|-------|--------|----------------|
| Default | Raised with shadow | shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] |
| Hover | Shadow enlarges + offset | hover:shadow-[10px_10px_0px_0px...] hover:-translate-y-1 hover:-translate-x-1 |
| Active | FULLY FLATTENED | active:translate-x-[6px] active:translate-y-[6px] active:shadow-none |

**CRITICAL**: Active displacement MUST equal original shadow pixel value. This creates the "physical crushing" — button is fully pressed into the surface.

### Card Hover (Brutal Snap)
```jsx
<div className="group bg-white border-4 border-black
  shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
  hover:shadow-[12px_12px_0px_0px_rgba(255,0,110,1)]
  hover:-translate-y-1 hover:-translate-x-1
  hover:bg-[#ffff00]
  transition-all duration-150 ease-out">
  ...
</div>
```

**CRITICAL**: Hover background color switch must be INSTANT (hard cut). NO gradients, NO opacity fade. Use duration-150 ease-out for position/shadow only.

---

## Animation Rules

### Interaction Physics
- **Physical Crushing**: Button active displacement EQUALS shadow offset. `active:translate-x-[6px] active:translate-y-[6px] active:shadow-none` for a 6px shadow.
- **Brutal Snap**: Hover switches to high-contrast background INSTANTLY. Hard cut, no fade. `hover:bg-[#ffff00]`
- **Zero Rounding Easing**: All transitions use `ease-out duration-150`. Raw collision feel. No soft spring physics.
- **Heavy Focus**: Card hover enlarges shadow AND changes shadow color to accent (pink/magenta).

### Timing Guidelines
| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover transform | 150ms | ease-out |
| Active press | instant | — |
| Shadow change | 150ms | ease-out |
| Color snap | 0ms | instant |

---

## Color Palette

### Primary
| Token | Value | Usage |
|-------|-------|-------|
| Black | #000000 | Borders, text, shadows |
| White | #ffffff | Backgrounds |

### Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Pink | #ff006e | CTAs, hover effects |
| Green | #ccff00 | Success, hero backgrounds |
| Blue | #00d9ff | Links, info |
| Yellow | #ff9500 | Tags, warnings |
| Bright Yellow | #ffff00 | Hover backgrounds |

### Shadow Colors
```
Default: rgba(0,0,0,1)
Hover accent: rgba(255,0,110,1)
```

---

## Typography

| Element | Classes |
|---------|---------|
| H1 | font-black text-4xl md:text-6xl lg:text-8xl tracking-tight leading-tight |
| H2 | font-black text-2xl md:text-4xl |
| H3 | font-black text-xl md:text-2xl |
| Body | font-mono text-sm md:text-base leading-relaxed |
| Labels | font-mono text-xs uppercase tracking-wider |
| CTA | font-black uppercase text-lg |

---

## Responsive Guidelines

### Scale Ratio
Mobile values are approximately 50% of desktop values.

### Borders
```
border-2 md:border-4
```

### Shadows
```
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
```

### Spacing
```
p-4 md:p-8
py-12 md:py-24
gap-4 md:gap-8
```

### Typography
```
text-sm md:text-base
text-xl md:text-3xl
text-4xl md:text-6xl lg:text-8xl
```

---

## Component Templates

### Button
```jsx
<button className="
  bg-[#ff006e] text-white font-black uppercase text-lg
  px-8 py-4 border-4 border-black
  shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
  hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]
  hover:-translate-y-1 hover:-translate-x-1
  active:translate-x-[6px] active:translate-y-[6px]
  active:shadow-none
  transition-all duration-150 ease-out">
  Click Hard
</button>
```

### Card
```jsx
<div className="group bg-white border-4 border-black
  shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
  hover:shadow-[12px_12px_0px_0px_rgba(255,0,110,1)]
  hover:-translate-y-1 hover:-translate-x-1
  hover:bg-[#ffff00]
  transition-all duration-150 ease-out
  p-8 cursor-pointer">
  <h3 className="font-black text-xl mb-2 
    group-hover:tracking-wider transition-all duration-150">
    Neo-Brutalism
  </h3>
  <p className="font-mono text-base text-gray-700">
    Raw, bold, unapologetic design.
  </p>
</div>
```

---

## Forbidden Patterns

| Pattern | Reason |
|---------|--------|
| rounded-lg, rounded-md, rounded-xl | Softens brutalist edges |
| shadow-lg, shadow-xl, shadow-2xl | Blur violates hard-edge principle |
| bg-gradient-* | Gradients are too polished |
| border-gray-*, border-slate-* | Must use pure black borders |
| Fade/opacity transitions | Must use hard cuts |
| rounded-full (general use) | Only for decorative circles |
| Active displacement < shadow value | Fails to achieve full crushing |
| Hover opacity fade | Must snap to new color |

---

## Self-Verification Checklist

Before outputting code, verify:
- [ ] NO rounded corners (except intentional decorative circles)
- [ ] Shadows are hard-edge format: shadow-[Xpx_Xpx_0px_0px_rgba...]
- [ ] Borders are pure black: border-black
- [ ] Button active displacement = original shadow pixel value
- [ ] Hover background changes are instant (hard cut, no fade)
- [ ] Transitions use duration-150 ease-out
- [ ] Font-black for headings, font-mono for body
- [ ] Has responsive md: prefixes for borders, shadows, spacing
- [ ] Mobile values ≈ 50% of desktop values

---

# Neo-Brutalist Design System

> Bold black thick borders, hard-edge shadows, no rounded corners, high-contrast color schemes. Inspired by architectural Brutalism, emphasizing function and raw aesthetics.

## Design Philosophy

Neo-Brutalist design style originates from the Brutalist movement in architecture, emphasizing raw, unadorned functional aesthetics. In web design, this style is expressed through bold black borders, hard-edge shadows, sharp right angles, and high-contrast color schemes.

Core principles:
- Function first: Every element has a clear purpose
- Honest expression: No hiding structure, no disguising function
- Bold and direct: Communicate through visual impact
- Anti-polish: Reject over-refinement, embrace rawness

---

## Token Dictionary (exact class mapping)

### Border
```
Width: border-2 md:border-4
Color: border-black
Radius: rounded-none
```

### Shadow
```
sm: shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
md: shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
lg: shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
hover: hover:shadow-none
focus: focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
```

### Interaction
```
Hover translate: hover:translate-x-[2px] hover:translate-y-[2px] md:hover:translate-x-1 md:hover:translate-y-1
Hover scale: (none)
Hover opacity: (none)
Transition: transition-all duration-200
Active: active:translate-x-[4px] active:translate-y-[4px]
```

### Typefaces
```
Heading: font-black tracking-tight
Body: font-mono
Mono: font-mono
```

### Type scale
```
Hero: text-4xl md:text-6xl lg:text-8xl
H1: text-3xl md:text-5xl
H2: text-2xl md:text-4xl
H3: text-xl md:text-2xl
Body: text-sm md:text-base
Small: text-xs md:text-sm
```

### Spacing
```
Section: py-12 md:py-24 lg:py-32
Container: px-4 md:px-8 lg:px-12
Card: p-4 md:p-6
Gap sm: gap-2 md:gap-4
Gap md: gap-4 md:gap-6
Gap lg: gap-6 md:gap-8
```

### Color roles
```
Background primary: bg-white
Background secondary: bg-black
Background accent: bg-[#ff006e], bg-[#ccff00], bg-[#00d9ff], bg-[#ff9500]
Text primary: text-black
Text secondary: text-white
Text muted: text-gray-700
Button primary: bg-[#ff006e] text-white
Button secondary: bg-black text-white
```

---

## [FORBIDDEN]

These classes are banned in this style. Check for them before returning code:

### Banned classes
- `rounded-sm`
- `rounded`
- `rounded-md`
- `rounded-lg`
- `rounded-xl`
- `rounded-2xl`
- `rounded-3xl`
- `shadow-sm`
- `shadow`
- `shadow-md`
- `shadow-lg`
- `shadow-xl`
- `shadow-2xl`
- `border-gray-100`
- `border-gray-200`
- `border-gray-300`
- `border-gray-400`
- `border-gray-500`
- `border-slate-100`
- `border-slate-200`

### Banned patterns
- matches `^rounded-(?!none)`
- matches `^shadow-(?!\[|none)`
- matches `^bg-gradient-`
- matches `^border-gray-`
- matches `^border-slate-`

### Why they are banned
- `rounded-lg`: Neo-Brutalist uses sharp corners only (rounded-none)
- `shadow-lg`: Neo-Brutalist uses hard-edge shadows only (shadow-[Xpx_Xpx_0px_0px_...])
- `bg-gradient-to-r`: Neo-Brutalist uses solid colors, no gradients
- `border-gray-300`: Neo-Brutalist uses pure black borders (border-black)

> WARNING: if your code contains any of the above, replace it before shipping.

---

## [REQUIRED]

### Every button must include
```
rounded-none
border-2 md:border-4
border-black
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
hover:shadow-none
hover:translate-x-[2px] hover:translate-y-[2px]
transition-all duration-200
font-black
```

### Every card must include
```
rounded-none
border-2 md:border-4
border-black
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
bg-white
```

### Every input must include
```
rounded-none
border-2 md:border-4
border-black
font-mono
focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
focus:outline-none
```

---

## [COMPARE] Neo-Brutalist wrong vs right

The wrong examples below stand for generic library defaults that were never adapted to this style. Do not read them as visual suggestions.

### Button

[WRONG] **Wrong** (generic component library default, do not copy):
```html
<button class="{GENERIC_LIBRARY_BUTTON_DEFAULT}">
  Click me
</button>
```

[CORRECT] **Right** (uses this style's tokens):
```html
<button class="rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 font-black bg-[#ff006e] text-white">
  Click me
</button>
```

### Card

[WRONG] **Wrong** (generic card, not adapted to this style):
```html
<div class="{GENERIC_LIBRARY_CARD_DEFAULT}">
  <h3>{TITLE}</h3>
</div>
```

[CORRECT] **Right** (uses this style's card tokens):
```html
<div class="rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-4 md:p-6">
  <h3 class="font-black tracking-tight text-xl md:text-2xl">{TITLE}</h3>
</div>
```

### Input

[WRONG] **Wrong** (generic input, not adapted to this style):
```html
<input class="{GENERIC_LIBRARY_INPUT_DEFAULT}" />
```

[CORRECT] **Right** (uses this style's input tokens):
```html
<input class="rounded-none border-2 md:border-4 border-black font-mono focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none" placeholder="{PLACEHOLDER}" />
```

---

## [TEMPLATES] Neo-Brutalist page skeletons

These skeletons use this style's tokens only. Replace `{PLACEHOLDER}` values, but keep every token in place:

### Navigation
```html
<nav class="bg-white text-black border-2 md:border-4 border-black px-4 md:px-8 lg:px-12">
  <div class="flex items-center justify-between max-w-6xl mx-auto gap-4 md:gap-6">
    <a href="/" class="font-black tracking-tight text-xl md:text-2xl">
      {LOGO_TEXT}
    </a>
    <div class="flex gap-4 md:gap-6 font-mono text-xs md:text-sm">
      {NAV_LINKS}
    </div>
  </div>
</nav>
```

### Hero section
```html
<section class="bg-[#ff006e] text-black py-12 md:py-24 lg:py-32 px-4 md:px-8 lg:px-12">
  <div class="max-w-4xl mx-auto">
    <h1 class="font-black tracking-tight text-4xl md:text-6xl lg:text-8xl">
      {HEADLINE}
    </h1>
    <p class="font-mono text-sm md:text-base max-w-xl">
      {SUBHEADLINE}
    </p>
    <button class="rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 font-black bg-[#ff006e] text-white">
      {CTA_TEXT}
    </button>
  </div>
</section>
```

### Card grid
```html
<section class="bg-white text-black py-12 md:py-24 lg:py-32 px-4 md:px-8 lg:px-12">
  <div class="max-w-6xl mx-auto">
    <h2 class="font-black tracking-tight text-2xl md:text-4xl">{SECTION_TITLE}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <!-- Card template - repeat for each card -->
      <div class="rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-4 md:p-6">
        <h3 class="font-black tracking-tight text-xl md:text-2xl">{CARD_TITLE}</h3>
        <p class="font-mono text-sm md:text-base text-gray-700">{CARD_DESCRIPTION}</p>
      </div>
    </div>
  </div>
</section>
```

### Form input
```html
<input class="rounded-none border-2 md:border-4 border-black font-mono focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none" placeholder="{PLACEHOLDER}" />
```

### Footer
```html
<footer class="bg-black text-white py-12 md:py-24 lg:py-32 px-4 md:px-8 lg:px-12">
  <div class="max-w-6xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      <div>
        <span class="font-black tracking-tight text-xl md:text-2xl">{LOGO_TEXT}</span>
        <p class="font-mono text-xs md:text-sm">{TAGLINE}</p>
      </div>
      <div>
        <h4 class="font-black tracking-tight text-xl md:text-2xl">{COLUMN_TITLE}</h4>
        <ul class="font-mono text-xs md:text-sm">
          {FOOTER_LINKS}
        </ul>
      </div>
    </div>
  </div>
</footer>
```

---

## [CHECKLIST] Neo-Brutalist post-generation self check

**Before returning code, verify every token and rule below. Fix any violation before delivering:**

### Token check
- [ ] Button includes: `rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 font-black`
- [ ] Card includes: `rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white`
- [ ] Input includes: `rounded-none border-2 md:border-4 border-black font-mono focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none`

### Forbidden check
- [ ] Not using `rounded-sm`
- [ ] Not using `rounded`
- [ ] Not using `rounded-md`
- [ ] Not using `rounded-lg`
- [ ] Not using `rounded-xl`
- [ ] Not using `rounded-2xl`
- [ ] Not using `rounded-3xl`
- [ ] Not using `shadow-sm`

### Style rule check
- [ ] Use pure black borders border-black border-2 md:border-4
- [ ] Use hard-edge shadows shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
- [ ] Keep sharp corners rounded-none
- [ ] Use high-contrast color schemes (black and white primary + vivid accent colors)
- [ ] Headings use font-black, body text uses font-mono

### Style drift check
- [ ] Does not violate: Do not use rounded corners rounded-lg, rounded-md, rounded-xl
- [ ] Does not violate: Do not use blurred shadows shadow-lg, shadow-xl, shadow-2xl
- [ ] Does not violate: Do not use gradients bg-gradient-*
- [ ] Does not violate: Do not use gray borders border-gray-*, border-slate-*
- [ ] Does not violate: Do not use fade-in/fade-out semi-transparent effects

### Delivery check
- [ ] Responsive layout holds on phone, tablet and desktop with no horizontal overflow
- [ ] Every interactive element has a visible focus state, an accessible name and a reduced-motion path
- [ ] Text contrast meets WCAG AA and colour alone never carries state
- [ ] The result is still recognizable at a glance as Neo-Brutalist

## Absolute Bans (Match and Refuse)

If any of the following patterns appear, it is a style violation — rewrite without exception.

- use rounded corners rounded-lg, rounded-md, rounded-xl
- use blurred shadows shadow-lg, shadow-xl, shadow-2xl
- use gradients bg-gradient-*
- use gray borders border-gray-*, border-slate-*
- use fade-in/fade-out semi-transparent effects
- use rounded-full (except for decorative circles)
- let button active state displacement be less than original shadow pixel value (not fully flattened, loses crushing feel)
- use gradients or opacity transitions for hover background color switch (must be hard-cut, duration-150 ease-out)

## Self-Check (Verify Before Shipping)

If any item fails, the style has drifted — fix before shipping.

- [ ] No purple-to-blue gradients
- [ ] No overused fonts (Inter, Roboto, Geist, Fraunces, Plus Jakarta Sans)
- [ ] No nested cards (cards inside cards)
- [ ] No gray text on colored backgrounds
- [ ] Body text contrast meets WCAG AA (>= 4.5:1)
- [ ] No bounce or elastic easing curves
- [ ] Animations have a prefers-reduced-motion fallback
- [ ] Body text line length capped at 65-75 characters
- [ ] No side-stripe accent borders (border-left/right > 1px)
- [ ] No gradient text (background-clip: text)
- [ ] No glassmorphism used as the default surface treatment
- [ ] No tiny uppercase tracked eyebrow labels above every section heading
- [ ] do not use rounded corners rounded-lg, rounded-md, rounded-xl
- [ ] do not use blurred shadows shadow-lg, shadow-xl, shadow-2xl
- [ ] do not use gradients bg-gradient-*
- [ ] do not use gray borders border-gray-*, border-slate-*
- [ ] do not use fade-in/fade-out semi-transparent effects