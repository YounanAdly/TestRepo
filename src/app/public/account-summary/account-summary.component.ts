import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';

import { SeoService } from '../../shared/services/seo.service';

type StatCardKind = 'number' | 'consumption' | 'billing' | 'type';
type QuickActionKind = 'view' | 'dashboard';
type AccountStatus = 'active' | 'inactive' | 'pending';

interface StatCard {
  kind: StatCardKind;
  labelKey: string;
  value: string;
  suffix?: string;
  metaKey?: string;
  iconSrc: string;
}

interface InfoRow {
  labelKey: string;
  value: string;
  isStatus?: boolean;
  statusVariant?: AccountStatus;
}

interface QuickAction {
  kind: QuickActionKind;
  titleKey: string;
  subtitleKey: string;
  iconSrc: string;
  route: string | null;
}

interface ChartPoint {
  labelKey: string;
  value: number;
}

interface SummaryValues {
  customerName: string;
  meterNumber: string;
  zoneArea: string;
  address: string;
  billingCycleValue: string;
  linkedMeterNumber: string;
  installationDate: string;
  lastReading: string;
  chartHeadlineValue: string;
  chartHeadlineUnit: string;
  statConsumptionValue: string;
  statConsumptionUnit: string;
  statBillingValue: string;
}

/**
 * Account Summary page (`/:lang/account-summary?account=<id>`).
 *
 * Opened from the "Bill Account Number" table on `my-profile`. Renders the
 * Figma "Account Summary" layout: hero + 4 stat cards + Account Information +
 * Linked Meter + Consumption Overview (SVG line chart) + Quick Action.
 *
 * Data is currently seeded from static Figma mocks (no bill-account detail
 * endpoint yet). When the API lands, swap the mocks for an `httpResource`
 * keyed on `account()` — the template already reacts to the input signal.
 */
@Component({
  selector: 'app-account-summary',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './account-summary.component.html',
  styleUrl: './account-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSummaryComponent {
  /** Bill account id from `?account=…` — auto-bound via `withComponentInputBinding()`. */
  readonly account = input<string>('');

  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  private readonly currentLangSignal = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang),
      startWith(this.translate.currentLang || 'en'),
    ),
    { initialValue: this.translate.currentLang || 'en' },
  );

  readonly currentLang = computed(() => this.currentLangSignal() || 'en');
  readonly localizedHomeRoute = computed(() => ['/', this.currentLang(), 'home']);
  readonly localizedProfileRoute = computed(() => ['/', this.currentLang(), 'my-profile']);

  /** Account number resolved from the URL query param — falls back to Figma mock. */
  readonly accountNumber = computed(() => this.account()?.trim() || '1001');

  readonly values = computed<SummaryValues>(() => {
    this.currentLangSignal();
    return {
      customerName: this.translate.instant('accountSummary.values.customerName'),
      meterNumber: this.translate.instant('accountSummary.values.meterNumber'),
      zoneArea: this.translate.instant('accountSummary.values.zoneArea'),
      address: this.translate.instant('accountSummary.values.address'),
      billingCycleValue: this.translate.instant('accountSummary.values.billingCycleValue'),
      linkedMeterNumber: this.translate.instant('accountSummary.values.linkedMeterNumber'),
      installationDate: this.translate.instant('accountSummary.values.installationDate'),
      lastReading: this.translate.instant('accountSummary.values.lastReading'),
      chartHeadlineValue: this.translate.instant('accountSummary.values.chartHeadlineValue'),
      chartHeadlineUnit: this.translate.instant('accountSummary.values.chartHeadlineUnit'),
      statConsumptionValue: this.translate.instant('accountSummary.values.statConsumptionValue'),
      statConsumptionUnit: this.translate.instant('accountSummary.values.statConsumptionUnit'),
      statBillingValue: this.translate.instant('accountSummary.values.statBillingValue'),
    };
  });

  readonly statCards = computed<StatCard[]>(() => {
    // Depend on language so `translate.instant()` values update on switch.
    this.currentLangSignal();
    return [
      {
        kind: 'number',
        labelKey: 'accountSummary.stat.accountNumber',
        value: this.accountNumber(),
        iconSrc: 'assets/images/account-summary-number.svg',
      },
      {
        kind: 'consumption',
        labelKey: 'accountSummary.stat.currentConsumption',
        value: this.values().statConsumptionValue,
        suffix: this.values().statConsumptionUnit,
        metaKey: 'accountSummary.stat.thisMonth',
        iconSrc: 'assets/images/account-summary-consumption.svg',
      },
      {
        kind: 'billing',
        labelKey: 'accountSummary.stat.billingCycle',
        value: this.values().statBillingValue,
        metaKey: 'accountSummary.stat.everyMonth',
        iconSrc: 'assets/images/account-summary-billing.svg',
      },
      {
        kind: 'type',
        labelKey: 'accountSummary.stat.accountType',
        value: this.translate.instant('accountSummary.stat.residential'),
        iconSrc: 'assets/images/account-summary-type.svg',
      },
    ];
  });

  readonly accountInfoRows = computed<InfoRow[]>(() => {
    this.currentLangSignal();
    return [
      { labelKey: 'accountSummary.info.customerName', value: this.values().customerName },
      { labelKey: 'accountSummary.info.meterNumber', value: this.values().meterNumber },
      { labelKey: 'accountSummary.info.zoneArea', value: this.values().zoneArea },
      { labelKey: 'accountSummary.info.address', value: this.values().address },
      {
        labelKey: 'accountSummary.info.accountStatus',
        value: this.translate.instant('accountSummary.info.status.active'),
        isStatus: true,
        statusVariant: 'active',
      },
      {
        labelKey: 'accountSummary.info.billingCycle',
        value: this.values().billingCycleValue,
      },
    ];
  });

  readonly linkedMeterRows = computed<InfoRow[]>(() => {
    this.currentLangSignal();
    return [
      { labelKey: 'accountSummary.meter.meterNumber', value: this.values().linkedMeterNumber },
      {
        labelKey: 'accountSummary.meter.meterType',
        value: this.translate.instant('accountSummary.meter.waterMeter'),
      },
      { labelKey: 'accountSummary.meter.installationDate', value: this.values().installationDate },
      { labelKey: 'accountSummary.meter.lastReading', value: this.values().lastReading },
    ];
  });

  readonly quickActions: QuickAction[] = [
    {
      kind: 'view',
      titleKey: 'accountSummary.quick.view.title',
      subtitleKey: 'accountSummary.quick.view.subtitle',
      iconSrc: 'assets/images/profile-quick-history.svg',
      route: 'view-bills',
    },
    {
      kind: 'dashboard',
      titleKey: 'accountSummary.quick.dashboard.title',
      subtitleKey: 'accountSummary.quick.dashboard.subtitle',
      iconSrc: 'assets/images/profile-quick-dashboard.svg',
      route: 'dashboard',
    },
  ];

  /** Chart data (Figma mock — 6 months, values 0–30 m³). */
  readonly chartPoints: ChartPoint[] = [
    { labelKey: 'accountSummary.chart.months.dec2024', value: 5 },
    { labelKey: 'accountSummary.chart.months.jan2025', value: 10 },
    { labelKey: 'accountSummary.chart.months.feb2025', value: 9 },
    { labelKey: 'accountSummary.chart.months.mar2025', value: 14 },
    { labelKey: 'accountSummary.chart.months.apr2025', value: 19 },
    { labelKey: 'accountSummary.chart.months.may2025', value: 27 },
  ];

  /** Y-axis labels (top to bottom to match the SVG y-order). */
  readonly chartYAxis: string[] = ['30', '22.5', '15', '7.5', '0'];

  /** SVG chart viewBox — kept in one place so template + geometry math stay in sync. */
  readonly chartWidth = 604;
  readonly chartHeight = 177;
  private readonly chartMax = 30;

  /** Pre-computed SVG path `d` attribute for the line + underline gradient area. */
  readonly chartPath = computed(() => this.buildLinePath());
  readonly chartArea = computed(() => this.buildAreaPath());
  /** Data-point coordinates for optional dot markers / tooltip anchors. */
  readonly chartDots = computed(() => this.computePoints());

  private readonly seoEffect = effect(() => {
    this.currentLangSignal();
    this.setSeo();
  });

  onQuickAction(action: QuickAction): void {
    if (!action.route) {
      return;
    }
    void this.router.navigate(['/', this.currentLang(), action.route], {
      queryParams: { account: this.account() },
    });
  }

  private setSeo(): void {
    this.seo.update({
      title: this.translate.instant('accountSummary.seo.title'),
      description: this.translate.instant('accountSummary.seo.description'),
      keywords: this.translate.instant('accountSummary.seo.keywords'),
      url: this.translate.instant('accountSummary.seo.url'),
      author: this.translate.instant('accountSummary.seo.author'),
      type: 'website',
    });
  }

  private computePoints(): Array<{ x: number; y: number }> {
    const w = this.chartWidth;
    const h = this.chartHeight;
    const n = this.chartPoints.length;
    return this.chartPoints.map((point, index) => {
      const x = n <= 1 ? w / 2 : (w * index) / (n - 1);
      const clamped = Math.max(0, Math.min(this.chartMax, point.value));
      const y = h - (clamped / this.chartMax) * (h - 10) - 5;
      return { x, y };
    });
  }

  private buildLinePath(): string {
    const points = this.computePoints();
    if (points.length === 0) {
      return '';
    }
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }
    // Smooth curve using cubic Béziers with tension t = 0.25.
    const tension = 0.2;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  private buildAreaPath(): string {
    const line = this.buildLinePath();
    if (!line) {
      return '';
    }
    const points = this.computePoints();
    const last = points[points.length - 1];
    const first = points[0];
    return `${line} L ${last.x} ${this.chartHeight} L ${first.x} ${this.chartHeight} Z`;
  }
}
