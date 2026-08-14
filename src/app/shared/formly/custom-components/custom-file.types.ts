
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldType } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';

interface UploadedFile {
    name: string;
    url?: string;
    progress?: number;
    uploaded?: boolean;
    /** The raw browser `File` object — present for locally-selected files, absent for server-hydrated entries. */
    file?: File;
}

@Component({
    selector: 'formly-field-file-upload',
    standalone: true,
    imports: [FormsModule],
    template: `
        <div class="form-field" [class.dimmed]="isDimmed">
                <div class="file-row">
                    <span class="file-name-placeholder">{{ selectedFileName }}</span>
                    <button type="button" class="choose-btn" [disabled]="isDimmed" (click)="openFileDialog()">{{ chooseLabel }}</button>
                </div>

                <input
                    #nativeInput
                    type="file"
                    class="native-input"
                    [attr.accept]="props['accept'] || '*'"
                    [multiple]="props['multiple'] ?? false"
                    [disabled]="isDimmed"
                    (change)="onNativeSelect($event)" />

        @if(files().length > 0){
            <div class="uploaded-files" >
                @for (file of files(); track $index) {
                <div  class="file-item">
                <span>{{ file.name }}</span>

                @if(!file.uploaded){
                    <progress [value]="file.progress || 0" max="100"></progress>
            }

                @if(file.uploaded){
                    <button type="button" (click)="deleteFile(file, $index)" class="delete-btn">
                    x
                    </button>
                }
                </div>
                }
            </div>
         }
    </div>
    <div class="file-hint">{{ maxAttachmentSizeLabel }}: <strong>{{ maxSizeMb }} MB</strong></div>
    
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [
        `
            .form-field {
                width: 100%;
                border: 1px solid var(--color-input-border);
                border-radius: 8px;
                background: var(--color-modal-bg);
                padding: 0 18px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-height: 48px;
            }

            .file-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                min-height: 48px;
                width: 100%;
            }

            .choose-btn {
                border: 1px solid var(--color-orange);
                border-radius: 12px; // More rounded per Figma
                background: var(--color-modal-bg);
                color: var(--color-orange);
                font-family: 'AvantGarde Bk BT', sans-serif;
                font-weight: 400;
                font-size: 14px;
                padding: 4px 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;

                &:hover {
                    background: var(--color-orange-soft-shadow);
                }
            }

            .file-name-placeholder {
                margin: 0;
                color: var(--color-placeholder-dimmed);
                font-family: 'AvantGarde Bk BT', sans-serif;
                font-size: 14px;
                line-height: 1.2;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex: 1;
                min-width: 0;
            }

            .native-input {
                display: none;
            }

            .uploaded-files {
                margin-top: 4px;
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding-bottom: 8px;
            }
            .file-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: var(--color-body-text);
                font-size: 14px;
                border-top: 1px solid var(--color-input-border);
                padding: 6px 0;
            }
            .delete-btn {
                background: none;
                border: none;
                cursor: pointer;
                color: var(--color-alert-danger);
                font-size: 14px;
                line-height: 1;
            }
            .file-hint {
                margin-top: 12px;
                color: var(--color-body-text);
                font-family: 'AvantGarde Bk BT', sans-serif;
                font-size: 14px;
                line-height: 1.4;
                display: flex;
                align-items: center;
                gap: 8px;

                &::before {
                    content: 'i';
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--color-body-text);
                    border-radius: 50%;
                    font-size: 12px;
                    font-weight: 700;
                    line-height: 1;
                    flex-shrink: 0;
                    color: var(--color-body-text);
                }

                strong {
                    font-weight: 700;
                    color: var(--color-body-text);
                    margin-left: 4px;
                }
            }
            .dimmed {
                opacity: 0.9;
            }
    `,
    ],
})
export class FormlyFileUploadType extends FieldType {
    private readonly translate = inject(TranslateService);

    files = signal<UploadedFile[]>([]);
    readonly nativeInput = viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');

    get isDimmed(): boolean {
        return !!this.props['dimmed'];
    }

    get chooseLabel(): string {
        const keyOrText = (this.props['chooseLabel'] as string) || 'serviceRequestPage.form.documents.chooseFile';
        return this.translate.instant(keyOrText);
    }

    get maxAttachmentSizeLabel(): string {
        const keyOrText = (this.props['maxAttachmentSizeLabel'] as string) || 'serviceRequestPage.form.documents.maxAttachmentSize';
        return this.translate.instant(keyOrText);
    }

    get noFileSelectedLabel(): string {
        const keyOrText = (this.props['noFileSelectedLabel'] as string) || 'serviceRequestPage.form.documents.noFileSelected';
        return this.translate.instant(keyOrText);
    }

    get selectedFileName(): string {
        return this.files().at(0)?.name || this.noFileSelectedLabel;
    }

    get maxSizeMb(): number {
        const maxFileSize = Number(this.props['maxFileSize'] || 5000000);
        return Math.max(1, Math.round(maxFileSize / (1024 * 1024)));
    }

    openFileDialog(): void {
        this.nativeInput()?.nativeElement.click();
    }

    onNativeSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        const selectedFiles: File[] = Array.from(input.files || []);

        selectedFiles.forEach((file) => {
            const fileObj: UploadedFile = { name: file.name, progress: 100, uploaded: true, file };
            if (!this.props['multiple']) {
                this.files.set([]);
            }
            const exists = this.files().some(f => f.name === file.name);
            if (!exists) {
                this.files.update((prev) => [...prev, fileObj]);
            }
        });
        this.updateFormValue();
        input.value = '';
    }

    deleteFile(file: UploadedFile, index: number) {
        this.files.update((prev) => prev.filter((_, i) => i !== index));
        this.updateFormValue();
    }

    /** Sync files with Formly form value — stores the raw `File` object when available so consumers can send binary data. */
    private updateFormValue() {
        const uploadedFiles = this.files().filter((f) => f.uploaded);
        if (this.props['multiple']) {
            this.formControl.setValue(uploadedFiles.map(f => f.file ?? f));
        } else {
            const first = uploadedFiles[0];
            this.formControl.setValue(first ? (first.file ?? first) : null);
        }
    }
}
