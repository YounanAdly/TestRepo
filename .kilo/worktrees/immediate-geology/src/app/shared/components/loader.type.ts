import { Component, effect } from '@angular/core';
import { LoaderService } from '../services/loader.service';
import { AsyncPipe } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
    selector: 'app-global-loader',
    imports: [ProgressSpinnerModule],
    template: `
    @if(isLoading()){
        <div class="global-loader-container">
         <p-progress-spinner ariaLabel="loading" />
        </div>
    }
  `,
    styles: [`
    .global-loader-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        right: 0;
        bottom: 0;
        background-color: var(--bg-color);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
    }
  `],
})
export class GlobalLoaderComponent {
    readonly isLoading;

    constructor(private loader: LoaderService) {
        this.isLoading = this.loader.isLoading;
        // Optional: observe loading changes
        effect(() => {
            if (this.loader.isLoading()) {
                document.body.classList.add('loading');
            } else {
                document.body.classList.remove('loading');
            }
        });
    }
}
