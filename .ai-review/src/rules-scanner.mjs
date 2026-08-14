// Deterministic pre-scanner.
//
// Regex-based catcher for the "black and white" rule violations that must NEVER
// slip past a review, regardless of what the AI model says. Every finding this
// module emits has severity=critical and category=<the offended rule>.
//
// This is the belt-and-suspenders layer: if the LLM misses it, the scanner
// still forces the CI check to fail.

/**
 * Rule table.
 * Each rule has:
 *   test(line, filePath) → boolean
 *   filePattern: RegExp (only run rule on matching paths)
 *   title, explanation, ruleRef, category
 *   suggestion?: (match, line) => string   // optional exact replacement text
 */
const RULES = [
  // ── SCSS / CSS: hardcoded colors ─────────────────────────
  {
    id: 'scss-hex',
    filePattern: /\.s?css$/i,
    match: (line) => {
      const trimmed = line.trim();
      if (isScssComment(trimmed)) return null;
      if (/url\s*\(\s*data:/i.test(trimmed)) return null; // SVG data URIs
      // Match hex color in a value position (after `:` on the same line)
      const m = trimmed.match(/(:\s*[^;{}\/]*?)(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?)\b/);
      if (!m) return null;
      return { hit: m[2] };
    },
    build: ({ hit }) => ({
      title: `Hardcoded color \`${hit}\` — use a \`var(--color-*)\` token`,
      category: 'scss',
      ruleRef: 'styling-themes.instructions.md · rules.md §1 Design Tokens',
      explanation:
        `**Hardcoded design values are forbidden.** The project's SCSS must reference CSS variables from \`src/styles/themes/*.scss\` so light / dark / green themes and RTL work correctly. ` +
        `Replace \`${hit}\` with the matching \`var(--color-*)\` token. If a token doesn't exist yet, add it to **all three** theme files with the correct per-theme value, then reference \`var(--color-<name>)\` here.`,
    }),
  },
  {
    id: 'scss-rgb',
    filePattern: /\.s?css$/i,
    match: (line) => {
      const trimmed = line.trim();
      if (isScssComment(trimmed)) return null;
      if (/url\s*\(\s*data:/i.test(trimmed)) return null;
      const m = trimmed.match(/(:\s*[^;{}\/]*?)(\brgba?\s*\([^)]*\))/i);
      if (!m) return null;
      return { hit: m[2] };
    },
    build: ({ hit }) => ({
      title: `Hardcoded color \`${hit}\` — use a \`var(--color-*)\` token`,
      category: 'scss',
      ruleRef: 'styling-themes.instructions.md',
      explanation:
        `Inline \`rgb()\` / \`rgba()\` values are forbidden — they bypass the theme system and break dark/green themes. ` +
        `Replace \`${hit}\` with \`var(--color-<name>)\` from \`src/styles/themes/_light-theme.scss\`. Add the token to all three theme files if it doesn't exist.`,
    }),
  },
  {
    id: 'scss-named-color',
    filePattern: /\.s?css$/i,
    match: (line) => {
      const trimmed = line.trim();
      if (isScssComment(trimmed)) return null;
      // Match named CSS colors as a value (after `:`), excluding keywords that
      // are safe / meaningless (transparent, inherit, currentColor, initial, unset, none).
      const namedColor = /(:\s*)(?:^|[^-\w])(black|white|red|green|blue|yellow|orange|purple|pink|brown|gray|grey|cyan|magenta|silver|gold|navy|teal|lime|maroon|olive|aqua|fuchsia|violet|indigo|coral|khaki|salmon|tan)\b/i;
      const m = trimmed.match(namedColor);
      if (!m) return null;
      return { hit: m[2] };
    },
    build: ({ hit }) => ({
      title: `Named color \`${hit}\` — use a \`var(--color-*)\` token`,
      category: 'scss',
      ruleRef: 'styling-themes.instructions.md',
      explanation:
        `Named colors like \`${hit}\` are hardcoded design values and break theme switching. Replace with the matching \`var(--color-*)\` token from \`src/styles/themes/\`.`,
    }),
  },

  // ── Angular 22 forbidden APIs ─────────────────────────────────────────
  {
    id: 'ng-input-decorator',
    filePattern: /\.ts$/i,
    match: (line) => (/@Input\s*\(/.test(line) ? { hit: '@Input()' } : null),
    build: () => ({
      title: '`@Input()` decorator — use `input()` signal function',
      category: 'angular22',
      ruleRef: 'rules.md §1.5 · shared-reuse.instructions.md',
      explanation:
        'New Angular 22 code must use `input()` / `input.required<T>()` — **never** the `@Input()` decorator. See `rules.md §1.5 → Component API`.',
    }),
  },
  {
    id: 'ng-output-decorator',
    filePattern: /\.ts$/i,
    match: (line) => (/@Output\s*\(/.test(line) ? { hit: '@Output()' } : null),
    build: () => ({
      title: '`@Output()` decorator — use `output<T>()` function',
      category: 'angular22',
      ruleRef: 'rules.md §1.5',
      explanation:
        'New code must use `output<T>()` — **never** `@Output()` + `EventEmitter`. See `rules.md §1.5`.',
    }),
  },
  {
    id: 'ng-viewchild-decorator',
    filePattern: /\.ts$/i,
    match: (line) => (/@ViewChild(?:ren)?\s*\(/.test(line) ? { hit: '@ViewChild()' } : null),
    build: () => ({
      title: '`@ViewChild()` decorator — use `viewChild()` signal query',
      category: 'angular22',
      ruleRef: 'rules.md §1.5',
      explanation: 'New code must use `viewChild()` / `viewChildren()` — never the decorator form.',
    }),
  },
  {
    id: 'ng-module',
    filePattern: /\.ts$/i,
    match: (line) => (/@NgModule\s*\(/.test(line) ? { hit: '@NgModule()' } : null),
    build: () => ({
      title: '`@NgModule` — project is standalone-only',
      category: 'angular22',
      ruleRef: 'rules.md §1.5 · copilot-instructions.md',
      explanation:
        'No NgModules. Every new component/directive/pipe is standalone. Root config already lives in `app.config.ts`.',
    }),
  },
  {
    id: 'ng-if-for',
    filePattern: /\.html$/i,
    match: (line) => {
      const m = line.match(/\*(ngIf|ngFor|ngSwitch|ngSwitchCase|ngSwitchDefault)\b/);
      return m ? { hit: `*${m[1]}` } : null;
    },
    build: ({ hit }) => ({
      title: `\`${hit}\` — use built-in control flow (\`@if\` / \`@for\` / \`@switch\`)`,
      category: 'angular22',
      ruleRef: 'rules.md §1.5 → Templates',
      explanation:
        'Templates must use Angular 22 built-in control flow blocks (`@if`, `@else`, `@for` with `track`, `@switch`). Structural directives like `*ngIf` / `*ngFor` are forbidden in new/edited templates.',
    }),
  },

  // ── Error handling ────────────────────────────────────────────────────
  {
    id: 'console-error',
    filePattern: /^src\/app\/.*\.ts$/i,
    match: (line) => (/\bconsole\.error\s*\(/.test(line) ? { hit: 'console.error(' } : null),
    build: () => ({
      title: '`console.error()` for user-facing failure is forbidden',
      category: 'rules',
      ruleRef: 'error-handling.instructions.md',
      explanation:
        'Route errors through `errorInterceptor` + `ToastService` — never `console.error()` for user-facing failures. See `error-handling.instructions.md`.',
    }),
  },
  {
    id: 'alert-call',
    filePattern: /^src\/app\/.*\.ts$/i,
    match: (line) => {
      if (/\.spec\.ts$/i.test('')) return null;
      const m = line.match(/(?:^|[^.\w])alert\s*\(/);
      return m ? { hit: 'alert(' } : null;
    },
    build: () => ({
      title: '`alert()` is forbidden — use `ToastService`',
      category: 'rules',
      ruleRef: 'error-handling.instructions.md',
      explanation: 'Use `ToastService.success/info/warn/error(translationKey)` — never `window.alert()`.',
    }),
  },

  // ── Direct HTTP + endpoints ───────────────────────────────────────────
  {
    id: 'httpclient-in-component',
    filePattern: /\.component\.ts$/i,
    match: (line) => (/inject\s*\(\s*HttpClient\s*\)/.test(line) ? { hit: 'inject(HttpClient)' } : null),
    build: () => ({
      title: '`HttpClient` injected in a component — use a service extending `BaseCrudService`',
      category: 'rules',
      ruleRef: 'api-calls.instructions.md · rules.md',
      explanation:
        'Components must never talk to `HttpClient` directly. Create/reuse a feature service that extends `BaseCrudService<T>` and call it from the component.',
    }),
  },
  {
    id: 'inline-endpoint',
    filePattern: /^src\/app\/.*\.ts$/i,
    match: (line) => {
      // Skip constants.ts itself and environment files
      if (line.includes('environment.') || line.includes('constants.ts')) return null;
      const m = line.match(/['"`](\/api\/[^\s'"`]+)['"`]/);
      return m ? { hit: m[1] } : null;
    },
    build: ({ hit }) => ({
      title: `Inline endpoint \`${hit}\` — move it to \`src/app/constants.ts\``,
      category: 'rules',
      ruleRef: 'copilot-instructions.md → Core Principles §7',
      explanation:
        'Endpoints must come from `src/app/constants.ts`, not inlined as string URLs. Add a named constant there and import it here.',
    }),
  },

  // ── Subscription safety ───────────────────────────────────────────────
  {
    id: 'destroy-subject',
    filePattern: /^src\/app\/.*\.ts$/i,
    match: (line) => {
      const m = line.match(/private\s+(?:readonly\s+)?destroy\$\s*=\s*new\s+Subject/);
      return m ? { hit: 'destroy$ = new Subject()' } : null;
    },
    build: () => ({
      title: 'Manual `destroy$` Subject — use `takeUntilDestroyed(inject(DestroyRef))`',
      category: 'angular22',
      ruleRef: 'rules.md §1.5 → DI & lifecycle',
      explanation:
        'Manual `destroy$: Subject<void>` teardown is forbidden. Use `takeUntilDestroyed(inject(DestroyRef))` for every `.subscribe()`.',
    }),
  },

  // ── Templates: untranslated hardcoded strings (heuristic) ─────────────
  // Very conservative — only flags text nodes that clearly should be translated.
  {
    id: 'untranslated-string',
    filePattern: /\.html$/i,
    match: (line) => {
      // Skip lines that already use translation
      if (/\|\s*translate\b/.test(line) || /translate\.instant\(/.test(line)) return null;
      // Look for text nodes with 2+ real words (letters) inside common text tags
      const m = line.match(/>\s*([A-Z][A-Za-z]{2,}(?:\s+[A-Z][A-Za-z]+){1,})\s*</);
      if (!m) return null;
      // Skip if it looks like a technical identifier (CamelCase class name etc.)
      if (/^[A-Z][a-z]+[A-Z]/.test(m[1])) return null;
      return { hit: m[1] };
    },
    build: ({ hit }) => ({
      title: `Hardcoded string "${hit}" — use ngx-translate`,
      category: 'i18n',
      ruleRef: 'i18n.instructions.md · copilot-instructions.md §4',
      explanation:
        `Wrap with the translate pipe and add the key to **both** \`en.json\` and \`ar.json\`:\n\n` +
        `\`\`\`html\n{{ 'YOUR.NAMESPACE.KEY' | translate }}\n\`\`\`\n\n` +
        `RTL must work — never inline literal English strings in templates.`,
    }),
  },
];

function isScssComment(trimmed) {
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
}

/**
 * @param {Array<{path: string, diff: string}>} files
 * @returns {Array<Finding>}
 */
export function scanDiff(files) {
  const findings = [];
  for (const f of files) {
    const added = extractAddedLines(f.diff);
    for (const { lineNumber, content } of added) {
      for (const rule of RULES) {
        if (!rule.filePattern.test(f.path)) continue;
        const match = rule.match(content, f.path);
        if (!match) continue;
        const built = rule.build(match);
        findings.push({
          file: f.path,
          line: lineNumber,
          severity: 'critical',
          source: 'scanner',
          scannerRuleId: rule.id,
          category: built.category,
          title: built.title,
          explanation: built.explanation,
          ruleRef: built.ruleRef,
        });
      }
    }
  }
  return findings;
}

/**
 * Parse a unified diff and yield each ADDED line with its 1-based line number
 * in the NEW file (right side).
 */
function extractAddedLines(diff) {
  const lines = diff.split('\n');
  const added = [];
  let newLineNo = 0;
  for (const line of lines) {
    if (line.startsWith('@@')) {
      const m = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) newLineNo = parseInt(m[1], 10) - 1;
      continue;
    }
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    if (line.startsWith('+')) {
      newLineNo++;
      added.push({ lineNumber: newLineNo, content: line.slice(1) });
    } else if (line.startsWith('-')) {
      // deleted from old — does not advance new-file line counter
    } else {
      // context line
      newLineNo++;
    }
  }
  return added;
}
