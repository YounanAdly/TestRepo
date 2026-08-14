import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FieldType } from '@ngx-formly/core';
import { MessageService } from 'primeng/api';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { LoaderService } from '../../services/loader.service';
import { BaseCrudService } from '../../services/base-crud.service';

interface UploadedFile {
    name: string;
    url?: string;
    progress?: number;
    uploaded?: boolean;
}

@Component({
    selector: 'formly-field-file-upload',
    standalone: true,
    imports: [CommonModule, FormsModule, FileUploadModule],
    providers: [MessageService],
    template: `
    <div class="form-field">
      <p-fileUpload
       #fileUpload
        mode="basic"
        chooseLabel="Choose"
        [name]="id"
        [multiple]="props['multiple'] ?? false"
        [accept]="props['accept'] || '*'"
        [maxFileSize]="props['maxFileSize'] || 5000000"
        [auto]="true"
        customUpload
        (uploadHandler)="onSelect($event)"
      ></p-fileUpload>
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
                    ❌
                    </button>
                }
                </div>
                }
            </div>
         }
    </div>
    
  `,
    styles: [
        `
      .uploaded-files {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .file-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .delete-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: red;
      }
    `,
    ],
})
export class FormlyFileUploadType extends FieldType {
    private loader = inject(LoaderService)
    private baseCrudService = inject(BaseCrudService)
    private messageService = inject(MessageService);

    files = signal<UploadedFile[]>([]);
    @ViewChild('fileUpload', { static: false }) fileUpload!: FileUpload

    /** Triggered when a file is selected */
    onSelect(event: any) {
        const selectedFiles: File[] = event.files || [];

        selectedFiles.forEach((file) => {
            const fileObj: UploadedFile = { name: file.name, progress: 0, uploaded: false };
            if (!this.props['multiple']) {
                this.files.set([]);
            }
            const exists = this.files().some(f => f.name === file.name);
            if (!exists) {
                this.files.update((prev) => [...prev, fileObj]);
                this.uploadFile(file, fileObj);
            }
        });
        this.fileUpload.clear();
    }

    /** Upload file directly to backend */
    uploadFile(file: File, fileObj: UploadedFile) {
        const uploadUrl = this.props['uploadUrl'] || '/api/upload'; // <-- configurable endpoint
        const formData = new FormData();
        formData.append('file', file);

        this.baseCrudService
            .create(uploadUrl, formData)
            .subscribe({
                next: (event) => {
                    if (event.type === HttpEventType.UploadProgress && event.total) {
                        const progress = Math.round((100 * event.loaded) / event.total);
                        this.updateFileProgress(fileObj.name, progress);
                    } else if (event.type === HttpEventType.Response) {
                        const uploadedFile: UploadedFile = {
                            name: fileObj.name,
                            progress: 100,
                            uploaded: true,
                        };
                        this.replaceFile(fileObj.name, uploadedFile);
                        this.updateFormValue();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Uploaded',
                            detail: `${fileObj.name} uploaded successfully`,
                        });
                    }
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Upload failed',
                        detail: `${fileObj.name} could not be uploaded.`,
                    });
                    // this.removeFile(fileObj.name);
                },
            });
    }

    /** Delete file from API */
    deleteFile(file: UploadedFile, index: number) {
        const deleteUrl = this.props['deleteUrl'] || '/api/delete'; // <-- configurable endpoint

        this.baseCrudService.delete(deleteUrl, index).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Deleted',
                    detail: `${file.name} deleted.`,
                });
                this.files.update((prev) => prev.filter((_, i) => i !== index));
                this.updateFormValue();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Could not delete ${file.name}.`,
                });
            },
        });
    }

    /** Update file upload progress */
    private updateFileProgress(name: string, progress: number) {
        this.files.update((prev) =>
            prev.map((f) => (f.name === name ? { ...f, progress } : f)),
        );
    }

    /** Replace a file in the list */
    private replaceFile(name: string, newFile: UploadedFile) {
        this.files.update((prev) =>
            prev.map((f) => (f.name === name ? newFile : f)),
        );
    }

    /** Remove a file from the list */
    private removeFile(name: string) {
        this.files.update((prev) => prev.filter((f) => f.name !== name));
        this.updateFormValue();
    }

    /** Sync files with Formly form value */
    private updateFormValue() {
        const uploadedFiles = this.files().filter((f) => f.uploaded);
        this.formControl.setValue(
            this.props['multiple'] ? uploadedFiles : uploadedFiles[0] || [],
        );
    }
}
