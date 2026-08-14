
# Let me create the ultimate prompt for GitHub Copilot + Figma MCP
# Based on all the uploaded instruction files and rules.md

ultimate_prompt = """
================================================================================
ULTIMATE COPILOT PROMPT — FIGMA TO ANGULAR 17+ IMPLEMENTATION
================================================================================

You are an expert Angular 17+ developer implementing Figma designs with strict 
reuse-first architecture. Follow EVERY rule below without exception.

════════════════════════════════════════════════════════════════════════════════
STEP 0: MANDATORY PRE-READ (DO THIS FIRST — BEFORE ANY CODE)
════════════════════════════════════════════════════════════════════════════════

Before writing a single line of code, you MUST read and understand these files 
in this exact order:

1. rules.md                    → Single source of truth for ALL reusable 
                                           components, services, design tokens, 
                                           and project structure
2.  copilot-instructions.md     → Core principles and architecture overview
3.  shared-reuse.instructions.md → Component/service reuse workflow
4.  styling-themes.instructions.md → SCSS theming, tokens, motion rules
5.  formly-forms.instructions.md  → JSON-driven form patterns
6.  i18n.instructions.md        → Translation key rules and RTL requirements

After reading, scan these directories to check existing inventory:
- src/app/shared/components/            → UI components (app-card, app-button, etc.)
- src/app/shared/formly/custom-components/ → Form field types
- src/app/layouts/                      → Header/footer shells
- src/app/shared/services/              → Business logic services
- src/styles/themes/                    → CSS variable definitions
- src/assets/i18n/en.json & ar.json     → Existing translation keys

════════════════════════════════════════════════════════════════════════════════
STEP 1: DESIGN ANALYSIS — EXTRACT EVERY DETAIL FROM FIGMA
════════════════════════════════════════════════════════════════════════════════

For the Figma design at: https://www.figma.com/design/TPz1p0lGwK2U6Zuquoxe0B/Marafiq-web--1-?node-id=252-1742&t=eVHfD6whDQ0PeKQS-4

Analyze and document EVERY element with pixel-perfect precision:

┌─ LAYOUT STRUCTURE ───────────────────────────────────────────────────────────┐
│ • Page sections and their order                                              │
│ • Grid/flex layouts (columns, gaps, alignment)                               │
│ • Responsive breakpoints (mobile/tablet/desktop)                             │
│ • Container max-widths and padding                                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ COLORS (Map EXACTLY to CSS variables — NEVER hardcode) ─────────────────────┐
│ For each color found in Figma:                                               │
│ • Identify the exact hex/rgba value                                          │
│ • Map to the corresponding CSS variable from rules.md §1                     │
│ • If NO matching variable exists:                                            │
│   → Add to ALL THREE theme files: _light-theme.scss, _dark-theme.scss,       │
│     _green-theme.scss                                                        │
│   → Add entry to rules.md §1 token table                                     │
│   → THEN use var(--color-your-new-token)                                     │
│                                                                              │
│ CRITICAL: These are theme-invariant and ALWAYS #ffffff:                      │
│   --color-modal-bg, --color-modal-input-bg                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ TYPOGRAPHY ─────────────────────────────────────────────────────────────────┐
│ • Font family (should match existing project fonts)                          │
│ • Font sizes (px → rem if project uses rem)                                  │
│ • Font weights (400, 500, 600, 700)                                          │
│ • Line heights                                                               │
│ • Letter spacing                                                             │
│ • Text transforms (uppercase, capitalize)                                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ SPACING ────────────────────────────────────────────────────────────────────┐
│ • Margins and paddings (all directions)                                      │
│ • Gap values between elements                                                │
│ • Border radius values                                                       │
│ • Check against existing token scale; if new, document in rules.md           │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ INTERACTIVE STATES ─────────────────────────────────────────────────────────┐
│ • Default state styling                                                      │
│ • Hover state (colors, transforms, shadows)                                  │
│ • Focus state (outline, ring, shadow)                                        │
│ • Active/pressed state                                                       │
│ • Disabled state                                                             │
│ • Transition durations and easing functions                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ ASSETS ─────────────────────────────────────────────────────────────────────┐
│ • Images: extract URLs or note if localhost source provided                  │
│ • Icons: identify which icon library or SVG assets                           │
│ • If Figma MCP returns localhost image sources → USE THEM DIRECTLY           │
│ • DO NOT import new icon packages                                            │
│ • DO NOT create placeholders if localhost source is available                │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ MOTION & ANIMATION ─────────────────────────────────────────────────────────┐
│ • Page enter transitions (opacity, translateY/translateX)                    │
│ • Component hover effects                                                    │
│ • Loading/skeleton states                                                    │
│ • Modal/dialog open/close animations                                         │
│ • Duration values (keep under 300ms for UI, 400-500ms for page transitions)  │
│ • Easing functions (prefer ease-out, cubic-bezier(0.4, 0, 0.2, 1))           │
│ • MUST include @media (prefers-reduced-motion: reduce) fallback              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ FORMS (If present) ─────────────────────────────────────────────────────────┐
│ • Field types (text, email, password, dropdown, date, file, etc.)            │
│ • Validation rules (required, pattern, min/max length)                       │
│ • Labels and placeholders (will become translation keys)                     │
│ • Error messages                                                             │
│ • Submit button styling                                                      │
│ • Field layout (single column, two-column, inline)                           │
└──────────────────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════
STEP 2: REUSE-FIRST AUDIT — CHECK BEFORE CREATING ANYTHING
════════════════════════════════════════════════════════════════════════════════

For EVERY design block, follow this decision tree IN ORDER:

┌──────────────────────────────────────────────────────────────────────────────┐
│ DECISION TREE:                                                               │
│                                                                              │
│ 1. EXACT MATCH in rules.md §2?                                               │
│    → Reuse as-is with correct @Input bindings                                │
│    → Examples: app-button, app-card, app-service-offering-card               │
│                                                                              │
│ 2. CLOSE MATCH (80%+ similar)?                                               │
│    → Extend existing component with new @Input or Formly props               │
│    → Document new API in rules.md                                            │
│    → Example: Add 'compact' variant to app-card                              │
│                                                                              │
│ 3. NO MATCH but can be generalized?                                          │
│    → Extend existing component to support the new use case                   │
│    → Ensure backward compatibility                                           │
│                                                                              │
│ 4. TRULY NEW and reusable by 2+ screens?                                     │
│    → Create new reusable component in src/app/shared/components/             │
│    → Must be standalone: true                                                │
│    → Must have app- prefix selector                                          │
│    → Document fully in rules.md §2                                           │
│    → JUSTIFY why no existing component could work                            │
│                                                                              │
│ 5. Page-specific ONLY (not reusable)?                                        │
│    → Create in the page folder, NOT in shared/                               │
│    → Keep minimal; extract to shared/ if second use appears                  │
└──────────────────────────────────────────────────────────────────────────────┘

EXISTING COMPONENT CHECKLIST (verify each against your design):
□ app-header (layouts/header/) — logoSrc, navLinks
□ app-footer (layouts/footer/) — logoSrc, menuLinks, contactInfo, socialLinks, legalLinks
□ app-global-loader (shared/components/loader.type.ts)
□ app-card (shared/components/card.component.ts) — title, subtitle, imageSrc, customClass
□ app-map (shared/components/maps.type.ts)
□ app-button (shared/components/button.component.ts) — variants: login-primary, login-outline, action-primary, action-outline, otp-verify, service-apply
□ app-service-offering-card (shared/components/service-offering-card/) — titleKey, descriptionKey, imageSrc, imageAltKey, actionLabelKey
□ app-otp-modal (shared/components/otp-model/) — maskedMobileNumber, otpLength
□ app-success-alert-modal (shared/components/success-alert/)
□ app-media-center-section (shared/components/media-center-section/)
□ app-faq-section (shared/components/faq-section/)
□ app-regulations-section (shared/components/regulations-section/)
□ app-service-about-section (shared/components/service-about-section/) — embedded, rootClass

FORM FIELD CHECKLIST:
□ custom-input (shared/formly/custom-components/custom-input.type.ts)
□ custom-dropdown (shared/formly/custom-components/drop-down/custom-dropdown.types.ts)
□ custom-calendar (shared/formly/custom-components/custom-calendar.types.ts)
□ custom-multiselect (shared/formly/custom-components/custom-multiselect.types.ts)
□ searchable-select (shared/formly/custom-components/custom-searchable-select.types.ts)
□ file (shared/formly/custom-components/custom-file.types.ts)

════════════════════════════════════════════════════════════════════════════════
STEP 3: DESIGN TOKEN MAPPING — ZERO HARDCODED VALUES
════════════════════════════════════════════════════════════════════════════════

Map EVERY visual value to CSS variables. The token catalog is in rules.md §1.

MANDATORY VARIABLES (never hardcode these hex values):
┌─────────────────────────────┬──────────────────────────────┬───────────────┐
│ Visual Purpose              │ CSS Variable                 │ Light Value   │
├─────────────────────────────┼──────────────────────────────┼───────────────┤
│ Primary teal/blue           │ --color-teal                 │ #008c98       │
│ Primary blue (kicker)       │ --color-primary-blue         │ #0076bf       │
│ Dark teal                   │ --color-teal-dark            │ #00788b       │
│ Orange                      │ --color-orange               │ #e8a712       │
│ Dark blue                   │ --color-dark-blue            │ #083a81       │
│ Body text (black)           │ --color-body-text            │ #2b2b2b       │
│ Neutral text                │ --color-text-neutral         │ #4a4a4a       │
│ Strong text                 │ --color-text-strong          │ #0d121c       │
│ Gray                        │ --color-gray                 │ #959ca2       │
│ Light green                 │ --color-light-green          │ #5db4bb       │
│ OTP border                  │ --color-otp-border           │ #b3dde0       │
│ Modal bg (invariant)        │ --color-modal-bg             │ #ffffff       │
│ Modal input bg (invariant)  │ --color-modal-input-bg       │ #ffffff       │
│ Input border                │ --color-input-border         │ #e0e0e0       │
│ Orange hover                │ --color-orange-hover         │ #cf9210       │
│ Danger/alert                │ --color-alert-danger         │ #ff0000       │
│ Auth card shadow            │ --color-auth-card-shadow     │ #c9e7e9       │
│ Soft surface                │ --color-surface-soft         │ #fafafa       │
│ Skip link bg                │ --color-skip-link-bg         │ #005fcc       │
│ Page backdrop               │ --color-page-backdrop        │ #001a3f       │
│ Section soft bg             │ --color-section-soft-bg      │ #ebf6f7       │
└─────────────────────────────┴──────────────────────────────┴───────────────┘

RULE: If Figma shows a color NOT in this table, you MUST:
1. Add it to _light-theme.scss, _dark-theme.scss, AND _green-theme.scss
2. Add it to the rules.md §1 token table
3. Only then use var(--color-your-new-token)

════════════════════════════════════════════════════════════════════════════════
STEP 4: IMPLEMENTATION RULES — APPLY THESE STRICTLY
════════════════════════════════════════════════════════════════════════════════

┌─ COMPONENTS ─────────────────────────────────────────────────────────────────┐
│ • standalone: true ONLY — no NgModules for new code                          │
│ • Selector prefix: app-                                                      │
│ • Prefer input()/output() signal API for new components                      │
│ • Avoid template logic beyond simple bindings                                │
│ • Push business logic to component class or services                         │
│ • Extend existing components via @Input before creating new ones             │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ FORMS (JSON-DRIVEN — MANDATORY) ────────────────────────────────────────────┐
│ • NEVER declare FormlyFieldConfig[] inline in .ts files                      │
│ • ALWAYS create co-located form.json in the page folder                      │
│ • Import: import formConfig from './form.json';                              │
│ • Cast: fields: FormlyFieldConfig[] = formConfig as unknown as FormlyFieldConfig[]; │
│ • Use ONLY registered types: custom-input, custom-dropdown, custom-calendar, │
│   custom-multiselect, searchable-select, file                                │
│ • Use dropdown path: custom-components/drop-down/ (NOT the duplicate)        │
│ • Labels/placeholders in form.json are TRANSLATION KEYS, not literal text    │
│ • Reuse validators: emailPattern, numbersOnly, fullNamePattern,              │
│   mobileNumberLength from formly.validators.ts                               │
│ • Runtime values (dropdown options) → set via FormlyService.setDropdownValue()│
│ • Reference: src/app/public/login/form.json, src/app/public/create-account/form.json │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ STYLING (SCSS) ─────────────────────────────────────────────────────────────┐
│ • NEVER inline hex, rgba, or theme-sensitive values                          │
│ • ALWAYS use var(--color-*) for colors                                       │
│ • Component styles → component .scss file (Angular view encapsulation)       │
│ • Global styles → src/styles/global.theme.scss ONLY                          │
│ • RTL support: use logical properties                                        │
│   → margin-inline-start (NOT margin-left)                                    │
│   → padding-inline-end (NOT padding-right)                                   │
│   → inset-inline-start (NOT left)                                            │
│ • Motion: define in global.theme.scss, reuse in components                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ MOTION & ACCESSIBILITY ─────────────────────────────────────────────────────┐
│ • Every routed page: subtle enter transition for primary content container   │
│ • Use opacity + transform ONLY (avoid width, height, top, left animations)   │
│ • Keep durations short: 200-300ms for UI, 400ms max for page transitions     │
│ • Consistent easing across all animations                                    │
│ • MUST include:                                                              │
│   @media (prefers-reduced-motion: reduce) {                                  │
│     * { animation: none !important; transition: none !important; }           │
│   }                                                                          │
│ • Reuse motion utilities from global.theme.scss                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ HTTP & SERVICES ────────────────────────────────────────────────────────────┐
│ • NEVER call HttpClient directly from components                             │
│ • ALWAYS use BaseCrudService or dedicated feature service                    │
│ • Endpoints: import keys from src/app/constants.ts                           │
│ • Add new endpoints to constants.ts, NEVER inline URLs                       │
│ • Auth state: read from AuthService, don't parse tokens locally              │
│ • Loading: automatic via LoaderService + loaderInterceptor                   │
│ • SEO: use SeoService for page titles/meta                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ ROUTING ────────────────────────────────────────────────────────────────────┐
│ • ALL routes language-prefixed: /:lang/...                                   │
│ • Use LanguageService for navigation that needs current lang                 │
│ • Protect authenticated routes with AuthGuard                                │
│ • New page routes → add to src/app/app.routes.ts                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ i18n & TRANSLATIONS ────────────────────────────────────────────────────────┐
│ • ZERO hardcoded user-visible strings in templates or TS                     │
│ • Use: {{ 'KEY' | translate }} or translate.instant('KEY')                   │
│ • EVERY key must exist in BOTH en.json AND ar.json                           │
│ • IDENTICAL nested structure in both files                                   │
│ • Naming: SCREAMING_SNAKE with dot separators                                │
│   → FEATURE.SECTION.ELEMENT                                                  │
│   → Examples: AUTH.LOGIN.TITLE, HOME.HERO.SUBTITLE, COMMON.BUTTONS.SUBMIT   │
│ • Generic words under COMMON.* and reuse across features                     │
│ • RTL: Arabic strings render right-to-left                                   │
│   → Avoid embedding Latin punctuation/numbers that break RTL flow            │
│ • Formly labels/placeholders are KEYS — add to both JSON files               │
└──────────────────────────────────────────────────────────────────────────────┘

┌─ ASSETS ─────────────────────────────────────────────────────────────────────┐
│ • If Figma MCP returns localhost image sources → USE DIRECTLY                │
│ • Do NOT import new icon packages (FontAwesome, Material Icons, etc.)        │
│ • Do NOT create placeholder images if real source is provided                │
│ • Use existing SVG assets from src/assets/images/                            │
└──────────────────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════
STEP 5: OUTPUT FORMAT — RESPOND WITH THIS STRUCTURE
════════════════════════════════════════════════════════════════════════════════

## 1. Design Analysis Summary
- Page/screen name and purpose
- Sections identified (with Figma frame names)
- Layout approach (flex/grid, responsive strategy)
- Color palette used (mapped to CSS variables)
- Typography scale
- Spacing system
- Interactive states documented
- Motion/animation specs

## 2. Reuse Audit Results
### Reused Components (list each):
- Component name | File path | How used | @Inputs bound

### Extended Components (list each):
- Component name | New @Input/prop | Justification | Backward compatible?

### New Components (list each):
- Component name | File path | JUSTIFICATION for creation | Reusability plan

### Reused Services:
- Service name | Purpose in this implementation

## 3. File Structure
```
src/app/public/[page-name]/
├── [page-name].component.ts
├── [page-name].component.html
├── [page-name].component.scss
├── form.json                    (if form present)
├── index.ts                     (if barrel export needed)
```
New shared components (if any):
```
src/app/shared/components/[component-name]/
├── [component-name].component.ts
├── [component-name].component.html
├── [component-name].component.scss
```

## 4. Route Configuration
```typescript
// Add to src/app/app.routes.ts
{
  path: ':lang/[page-name]',
  loadComponent: () => import('./public/[page-name]/[page-name].component').then(m => m.[PageName]Component),
  // guards if needed
}
```

## 5. Translation Keys Added
### en.json:
```json
{
  "FEATURE": {
    "SECTION": {
      "TITLE": "English Title",
      "DESCRIPTION": "English description"
    }
  }
}
```

### ar.json:
```json
{
  "FEATURE": {
    "SECTION": {
      "TITLE": "العنوان بالعربية",
      "DESCRIPTION": "الوصف بالعربية"
    }
  }
}
```

## 6. form.json Structure (if form present)
```json
[
  {
    "key": "fieldName",
    "type": "custom-input",
    "props": {
      "label": "FEATURE.FORM.FIELD_LABEL",
      "placeholder": "FEATURE.FORM.FIELD_PLACEHOLDER",
      "required": true
    }
  }
]
```

## 7. CSS Variables Used
List all var(--color-*) and other CSS variables referenced.

## 8. Motion/Animation Specs
- Page enter: [duration] [easing] [properties]
- Hover states: [duration] [easing] [properties]
- Reduced motion fallback: [description]

## 9. Rules.md Update Confirmation
- [ ] New components added to §2 inventory
- [ ] New @Inputs documented
- [ ] New CSS variables added to §1 table
- [ ] New Formly types documented (if applicable)
- [ ] Deprecated patterns marked (if applicable)

## 10. Verification Checklist
Before finishing, confirm ALL of these:
- [ ] No hardcoded hex/rgba values in any .scss file (grep for # and rgb)
- [ ] i18n parity: en.json and ar.json have identical key structures
- [ ] All components are standalone: true
- [ ] Form uses form.json (if applicable)
- [ ] No direct HttpClient in components
- [ ] Endpoints imported from constants.ts (if API calls)
- [ ] Routes use /:lang/ prefix
- [ ] Motion includes prefers-reduced-motion fallback
- [ ] RTL-safe logical properties used (no left/right)
- [ ] rules.md updated with new reusable patterns
- [ ] Build passes: npm run build
- [ ] Tests pass: npm test

════════════════════════════════════════════════════════════════════════════════
CRITICAL REMINDERS
════════════════════════════════════════════════════════════════════════════════

1. NEVER skip the pre-read step. Read rules.md FIRST.
2. NEVER hardcode colors. Always var(--color-*).
3. NEVER inline Formly configs. Always form.json.
4. NEVER forget ar.json when adding en.json keys.
5. NEVER create a component without checking reuse inventory first.
6. NEVER finish without updating rules.md.
7. HOME PAGE IS LOCKED: src/app/public/home/ — DO NOT EDIT unless explicitly instructed.
8. When in doubt, extend existing; don't create new.

════════════════════════════════════════════════════════════════════════════════
FINAL INSTRUCTION
════════════════════════════════════════════════════════════════════════════════

Do NOT write any implementation code until I approve your Design Analysis and 
Reuse Audit. Present those two sections first, wait for my confirmation, then 
proceed with implementation.
