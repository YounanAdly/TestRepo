
import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, HostListener, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface FilterOption {
  labelKey: string;
  value: string;
}

/** Visual variants for the shared filter dropdown pill. */
export type FilterDropdownVariant = 'orange' | 'light';

export const MONTH_OPTIONS: FilterOption[] = [
  { labelKey: 'filterDropdown.months.january',   value: '1'  },
  { labelKey: 'filterDropdown.months.february',  value: '2'  },
  { labelKey: 'filterDropdown.months.march',     value: '3'  },
  { labelKey: 'filterDropdown.months.april',     value: '4'  },
  { labelKey: 'filterDropdown.months.may',       value: '5'  },
  { labelKey: 'filterDropdown.months.june',      value: '6'  },
  { labelKey: 'filterDropdown.months.july',      value: '7'  },
  { labelKey: 'filterDropdown.months.august',    value: '8'  },
  { labelKey: 'filterDropdown.months.september', value: '9'  },
  { labelKey: 'filterDropdown.months.october',   value: '10' },
  { labelKey: 'filterDropdown.months.november',  value: '11' },
  { labelKey: 'filterDropdown.months.december',  value: '12' },
];

export const YEAR_OPTIONS: FilterOption[] = [
  { labelKey: 'filterDropdown.years.y2024', value: '2024' },
  { labelKey: 'filterDropdown.years.y2025', value: '2025' },
  { labelKey: 'filterDropdown.years.y2026', value: '2026' },
  { labelKey: 'filterDropdown.years.y2027', value: '2027' },
];

@Component({
  selector: 'app-filter-dropdown',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './filter-dropdown.component.html',
  styleUrl: './filter-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDropdownComponent implements OnInit {
  private readonly el = inject(ElementRef);

  readonly options = input<FilterOption[]>([]);
  readonly selectedValue = input<string>('');
  /**
   * Optional translation key shown as the trigger label when no option has
   * been selected yet. Falls back to the first option's label when not set
   * (existing behaviour).
   */
  readonly placeholderKey = input<string>('');
  /**
   * Visual variant of the pill. `'orange'` (default) matches the original
   * orange-outlined filter used across notifications/complaints. `'light'`
   * renders a neutral white pill with a subtle border — used by pages like
   * View Bills whose filter row sits inside a card.
   */
  readonly variant = input<FilterDropdownVariant>('orange');
  /**
   * When `true` the trigger is dimmed, keyboard/click interaction is blocked,
   * and the panel cannot be opened. Used when a selection is fixed by the
   * caller (e.g. billing account driven by the URL query param).
   */
  readonly disabled = input<boolean>(false);
  readonly selectionChange = output<FilterOption>();

  readonly currentLabelKey = signal('');
  /** True while the trigger is showing the placeholder (no selection yet). */
  readonly isPlaceholder = computed(() =>
    !!this.placeholderKey() && this.currentLabelKey() === this.placeholderKey(),
  );
  isOpen = false;

  @HostBinding('attr.data-variant') get variantAttr(): FilterDropdownVariant {
    return this.variant();
  }

  @HostBinding('attr.data-disabled') get disabledAttr(): string | null {
    return this.disabled() ? 'true' : null;
  }

  constructor() {
    effect(() => {
      const incoming = this.selectedValue();
      if (incoming) {
        this.currentLabelKey.set(incoming);
        return;
      }
      // No explicit selection — fall back to the placeholder when one is
      // supplied. Consumers can therefore drive reset flows purely by
      // clearing `selectedValue`.
      const placeholder = this.placeholderKey();
      if (placeholder) {
        this.currentLabelKey.set(placeholder);
      }
    });
  }

  ngOnInit(): void {
    if (this.currentLabelKey()) {
      return;
    }
    const placeholder = this.placeholderKey();
    if (placeholder) {
      this.currentLabelKey.set(placeholder);
      return;
    }
    const options = this.options();
    if (options.length) {
      this.currentLabelKey.set(options[0].labelKey);
    }
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.isOpen = !this.isOpen;
  }

  select(option: FilterOption, event: MouseEvent): void {
    event.stopPropagation();
    this.currentLabelKey.set(option.labelKey);
    this.selectionChange.emit(option);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
