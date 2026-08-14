import { ChangeDetectionStrategy, Component, input } from '@angular/core';


@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  template: `
    <div class="card-container" [class]="customClass()">
      @if (imageSrc()) {
        <div class="card-image">
          <img [src]="imageSrc()" [alt]="title() || 'Card Image'" />
        </div>
      }
      <div class="card-content">
        @if (title()) {
          <h3 class="card-title">{{ title() }}</h3>
        }
        @if (subtitle()) {
          <p class="card-subtitle">{{ subtitle() }}</p>
        }
        <div class="card-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
    `,
  styles: [`
    :host {
      display: block;
    }

    .card-container {
      background-color: var(--color-modal-bg);
      border-radius: var(--radius-lg, 16px);
      padding: 45px;
      box-shadow: 0px 1px 20px var(--color-card-glow);
      display: flex;
      flex-direction: column;
      gap: 20px;
      transition: transform var(--transition-base, 250ms ease),
                  box-shadow var(--transition-base, 250ms ease);
      height: 100%;
      border: 1px solid transparent;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0px 4px 25px var(--color-card-glow-hover);
      }

      &:active {
        transform: translateY(-2px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .card-container:hover,
      .card-container:active { transform: none; }
    }

    .card-image {
      width: 100%;
      height: auto;
      margin-bottom: 24px;
      
      img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        object-fit: cover;
      }
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-title {
      margin: 0;
      font-size: 2.2rem;
      font-weight: 600;
      color: var(--color-body-text);
    }

    .card-subtitle {
      margin: 0;
      font-size: 1.6rem;
      color: var(--color-text-neutral);
      line-height: 1.5;
    }

    .card-body {
      margin-top: 10px;
    }
  `]
})
export class CardComponent {
  readonly title = input<string | null>(null);
  readonly subtitle = input<string | null>(null);
  readonly imageSrc = input<string | null>(null);
  readonly customClass = input<string>('');
}
