/**
 * Instapaper API v2 client (OAuth 2 bearer token).
 *
 * Get a personal access token on your application's page at
 * https://www.instapaper.com/developers/applications. Responses are mapped
 * back to the v1-style shapes (bookmark_id, starred, folder_id, highlight_id)
 * that the MCP tools in index.ts expect.
 */
interface InstapaperCredentials {
    accessToken: string;
}
interface Bookmark {
    bookmark_id: number;
    url: string;
    title: string;
    description: string;
    time: number;
    starred: string;
    archived: boolean;
    folder_id: number | null;
    tags: string[];
    author: string | null;
    progress: number;
    progress_timestamp: number;
    private_source?: string;
}
interface Folder {
    folder_id: number;
    title: string;
    position: number;
    count: number;
}
interface Highlight {
    highlight_id: number;
    bookmark_id: number;
    text: string;
    note: string | null;
    position: number;
    time: number;
}
export declare class InstapaperClient {
    private accessToken;
    private baseUrl;
    constructor(credentials: InstapaperCredentials);
    /**
     * Check the access token by fetching the connected account
     */
    authenticate(): Promise<void>;
    /**
     * Verify credentials are valid
     */
    verifyCredentials(): Promise<boolean>;
    /**
     * List bookmarks with optional filters.
     * folder: "unread" (home), "archive", "starred" (liked), or a numeric folder_id
     */
    listBookmarks(options?: {
        folder?: string;
        limit?: number;
        have?: string;
    }): Promise<Bookmark[]>;
    /**
     * Get the parsed article HTML
     */
    getArticleText(bookmarkId: number): Promise<string>;
    /**
     * Add a new bookmark (public or private)
     * For private sources: leave url empty and provide content instead
     */
    addBookmark(url: string, options?: {
        title?: string;
        description?: string;
        folder_id?: number;
        resolve_final_url?: boolean;
        content?: string;
        is_private_from_source?: string;
    }): Promise<Bookmark>;
    /**
     * Delete a bookmark
     */
    deleteBookmark(bookmarkId: number): Promise<void>;
    /**
     * Star (like) a bookmark
     */
    starBookmark(bookmarkId: number): Promise<Bookmark>;
    /**
     * Unstar (unlike) a bookmark
     */
    unstarBookmark(bookmarkId: number): Promise<Bookmark>;
    /**
     * Archive a bookmark
     */
    archiveBookmark(bookmarkId: number): Promise<Bookmark>;
    /**
     * Unarchive a bookmark
     */
    unarchiveBookmark(bookmarkId: number): Promise<Bookmark>;
    /**
     * Move bookmark to a folder
     */
    moveBookmark(bookmarkId: number, folderId: number): Promise<Bookmark>;
    /**
     * Update reading progress
     */
    updateReadProgress(bookmarkId: number, progress: number, timestamp?: number): Promise<Bookmark>;
    /**
     * Add a private bookmark from HTML content
     * Use this for content that doesn't have a URL (emails, notebooks, etc)
     */
    addPrivateBookmark(content: string, options: {
        title?: string;
        description?: string;
        folder_id?: number;
        source_label: string;
    }): Promise<Bookmark>;
    /**
     * List all folders
     */
    listFolders(): Promise<Folder[]>;
    /**
     * Add a new folder
     */
    addFolder(title: string): Promise<Folder>;
    /**
     * Delete a folder
     */
    deleteFolder(folderId: number): Promise<void>;
    /**
     * Reorder folders
     */
    reorderFolders(order: Array<{
        folder_id: number;
        position: number;
    }>): Promise<Folder[]>;
    /**
     * List highlights for a bookmark
     */
    listHighlights(bookmarkId: number): Promise<Highlight[]>;
    /**
     * Add a highlight
     */
    addHighlight(bookmarkId: number, text: string, position: number): Promise<Highlight>;
    /**
     * Delete a highlight
     */
    deleteHighlight(highlightId: number): Promise<void>;
    private moveToSection;
    /**
     * Make an authenticated request to the Instapaper API
     */
    private request;
}
export {};
//# sourceMappingURL=instapaper-client.d.ts.map