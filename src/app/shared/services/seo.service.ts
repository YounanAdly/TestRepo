import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

export interface SeoData {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    author?: string;
    type?: string; // e.g. 'website' or 'article'
}

@Injectable({ providedIn: 'root' })
export class SeoService {
    private title = inject(Title);
    private meta = inject(Meta);

    /**
     * Update SEO tags dynamically
     */
    update(seo: SeoData): void {
        const {
            title,
            description,
            keywords,
            image,
            url,
            author,
            type = 'website',
        } = seo;

        if (title) this.title.setTitle(title);

        if (description) {
            this.meta.updateTag({ name: 'description', content: description });
            this.meta.updateTag({ property: 'og:description', content: description });
            this.meta.updateTag({ name: 'twitter:description', content: description });
        }

        if (keywords) this.meta.updateTag({ name: 'keywords', content: keywords });
        if (author) this.meta.updateTag({ name: 'author', content: author });
        if (url) this.meta.updateTag({ property: 'og:url', content: url });
        if (image) {
            this.meta.updateTag({ property: 'og:image', content: image });
            this.meta.updateTag({ name: 'twitter:image', content: image });
        }

        if (title) {
            this.meta.updateTag({ property: 'og:title', content: title });
            this.meta.updateTag({ name: 'twitter:title', content: title });
        }

        this.meta.updateTag({ property: 'og:type', content: type });
    }

    /**
     * Clear all SEO-related meta tags (optional helper)
     */
    clear(): void {
        [
            'description',
            'keywords',
            'author',
            'og:title',
            'og:description',
            'og:image',
            'og:url',
            'twitter:title',
            'twitter:description',
            'twitter:image',
        ].forEach((name) => this.meta.removeTag(`name='${name}'`));
    }
}
