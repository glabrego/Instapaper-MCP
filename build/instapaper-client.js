import fetch from 'node-fetch';
export class InstapaperClient {
    accessToken;
    baseUrl = 'https://www.instapaper.com/api/2';
    constructor(credentials) {
        this.accessToken = credentials.accessToken;
    }
    /**
     * Check the access token by fetching the connected account
     */
    async authenticate() {
        await this.request('GET', '/me');
    }
    /**
     * Verify credentials are valid
     */
    async verifyCredentials() {
        try {
            await this.authenticate();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * List bookmarks with optional filters.
     * folder: "unread" (home), "archive", "starred" (liked), or a numeric folder_id
     */
    async listBookmarks(options = {}) {
        const query = {};
        const folder = options.folder;
        if (!folder || folder === 'unread' || folder === 'home') {
            query.section = 'home';
        }
        else if (folder === 'archive') {
            query.section = 'archive';
        }
        else if (folder === 'starred' || folder === 'liked') {
            query.section = 'liked';
        }
        else {
            query.section = 'folder';
            query.folder_id = folder;
        }
        query.limit = Math.min(Math.max(options.limit ?? 25, 1), 500).toString();
        const response = await this.request('GET', '/bookmarks', undefined, query);
        return response.bookmarks.map(toBookmark);
    }
    /**
     * Get the parsed article HTML
     */
    async getArticleText(bookmarkId) {
        const response = await this.request('GET', `/bookmarks/${bookmarkId}/parse`);
        return response.content?.body ?? '';
    }
    /**
     * Add a new bookmark (public or private)
     * For private sources: leave url empty and provide content instead
     */
    async addBookmark(url, options = {}) {
        const body = {};
        if (options.is_private_from_source) {
            if (!options.content) {
                throw new Error('content parameter is required for private bookmarks');
            }
            body.private_source = options.is_private_from_source;
            body.content = options.content;
        }
        else {
            body.url = url;
            if (options.resolve_final_url !== undefined)
                body.canonicalize = options.resolve_final_url;
        }
        if (options.title)
            body.title = options.title;
        if (options.description)
            body.description = options.description;
        if (options.folder_id)
            body.folder_id = options.folder_id;
        return toBookmark(await this.request('POST', '/bookmarks', body));
    }
    /**
     * Delete a bookmark
     */
    async deleteBookmark(bookmarkId) {
        await this.request('DELETE', `/bookmarks/${bookmarkId}`);
    }
    /**
     * Star (like) a bookmark
     */
    async starBookmark(bookmarkId) {
        return toBookmark(await this.request('POST', `/bookmarks/${bookmarkId}/like`));
    }
    /**
     * Unstar (unlike) a bookmark
     */
    async unstarBookmark(bookmarkId) {
        return toBookmark(await this.request('DELETE', `/bookmarks/${bookmarkId}/like`));
    }
    /**
     * Archive a bookmark
     */
    async archiveBookmark(bookmarkId) {
        return this.moveToSection(bookmarkId, 'archive');
    }
    /**
     * Unarchive a bookmark
     */
    async unarchiveBookmark(bookmarkId) {
        return this.moveToSection(bookmarkId, 'home');
    }
    /**
     * Move bookmark to a folder
     */
    async moveBookmark(bookmarkId, folderId) {
        return this.moveToSection(bookmarkId, folderId.toString());
    }
    /**
     * Update reading progress
     */
    async updateReadProgress(bookmarkId, progress, timestamp) {
        const body = {
            progress: {
                percentage: progress,
                timestamp: timestamp || Math.floor(Date.now() / 1000),
            },
        };
        return toBookmark(await this.request('POST', `/bookmarks/${bookmarkId}`, body));
    }
    /**
     * Add a private bookmark from HTML content
     * Use this for content that doesn't have a URL (emails, notebooks, etc)
     */
    async addPrivateBookmark(content, options) {
        return this.addBookmark('', {
            ...options,
            content,
            is_private_from_source: options.source_label,
        });
    }
    /**
     * List all folders
     */
    async listFolders() {
        const response = await this.request('GET', '/folders');
        return response.folders.map(toFolder);
    }
    /**
     * Add a new folder
     */
    async addFolder(title) {
        return toFolder(await this.request('POST', '/folders', { title }));
    }
    /**
     * Delete a folder
     */
    async deleteFolder(folderId) {
        await this.request('DELETE', `/folders/${folderId}`);
    }
    /**
     * Reorder folders
     */
    async reorderFolders(order) {
        const response = await this.request('POST', '/folders/reorder', { order });
        return response.folders.map(toFolder);
    }
    /**
     * List highlights for a bookmark
     */
    async listHighlights(bookmarkId) {
        const response = await this.request('GET', `/bookmarks/${bookmarkId}/highlights`);
        return response.highlights.map(toHighlight);
    }
    /**
     * Add a highlight
     */
    async addHighlight(bookmarkId, text, position) {
        const response = await this.request('POST', `/bookmarks/${bookmarkId}/highlights`, { text, position });
        return toHighlight(response);
    }
    /**
     * Delete a highlight
     */
    async deleteHighlight(highlightId) {
        await this.request('DELETE', `/highlights/${highlightId}`);
    }
    async moveToSection(bookmarkId, section) {
        return toBookmark(await this.request('POST', `/bookmarks/${bookmarkId}/move`, { section }));
    }
    /**
     * Make an authenticated request to the Instapaper API
     */
    async request(method, endpoint, body, query) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (query) {
            for (const [key, value] of Object.entries(query))
                url.searchParams.set(key, value);
        }
        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
        };
        if (body)
            headers['Content-Type'] = 'application/json';
        const response = await fetch(url.toString(), {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        const text = await response.text();
        if (!response.ok) {
            let message = text || response.statusText;
            try {
                message = JSON.parse(text).error?.message ?? message;
            }
            catch {
                // non-JSON error body
            }
            throw new Error(`Instapaper API error ${response.status}: ${message}`);
        }
        return text ? JSON.parse(text) : null;
    }
}
function toBookmark(b) {
    return {
        bookmark_id: b.id,
        url: b.url ?? '',
        title: b.title ?? '',
        description: b.description ?? '',
        time: b.time,
        starred: b.liked ? '1' : '0',
        archived: b.archived,
        folder_id: b.folder_id ?? null,
        tags: (b.tags ?? []).map((t) => t.name),
        author: b.author ?? null,
        progress: b.progress?.percentage ?? 0,
        progress_timestamp: b.progress?.timestamp ?? 0,
        private_source: b.private_source ?? '',
    };
}
function toFolder(f) {
    return {
        folder_id: f.id,
        title: f.title,
        position: f.position,
        count: f.count,
    };
}
function toHighlight(h) {
    return {
        highlight_id: h.id,
        bookmark_id: h.bookmark_id,
        text: h.text,
        note: h.note ?? null,
        position: h.position,
        time: h.time,
    };
}
//# sourceMappingURL=instapaper-client.js.map