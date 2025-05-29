import { debugLog } from "../utils";

export default class BookmarkPresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  async loadBookmarks() {
    try {
      this._view.showLoading();
      
      debugLog("Loading bookmarks from IndexedDB");
      const response = await this._model.getAllBookmarks();
      
      this._view.hideLoading();
      
      if (response.error) {
        debugLog("Error loading bookmarks:", response.message);
        this._view.showErrorMessage(response.message);
        return;
      }
      
      debugLog("Bookmarks loaded successfully:", response.listStory?.length || 0);
      this._view.renderBookmarks(response);
      
    } catch (error) {
      debugLog("Error in loadBookmarks presenter:", error);
      this._view.hideLoading();
      this._view.showErrorMessage("Terjadi kesalahan saat memuat bookmark");
    }
  }

  async addBookmark(story) {
    try {
      debugLog("Adding bookmark:", story.id);
      const result = await this._model.addBookmark(story);
      
      if (result.error) {
        debugLog("Error adding bookmark:", result.message);
        return result;
      }
      
      debugLog("Bookmark added successfully");
      return result;
      
    } catch (error) {
      debugLog("Error in addBookmark presenter:", error);
      return {
        error: true,
        message: "Terjadi kesalahan saat menambahkan bookmark"
      };
    }
  }

  async removeBookmark(storyId) {
    try {
      debugLog("Removing bookmark:", storyId);
      const result = await this._model.deleteBookmark(storyId);
      
      if (result.error) {
        debugLog("Error removing bookmark:", result.message);
        return result;
      }
      
      debugLog("Bookmark removed successfully");
      return result;
      
    } catch (error) {
      debugLog("Error in removeBookmark presenter:", error);
      return {
        error: true,
        message: "Terjadi kesalahan saat menghapus bookmark"
      };
    }
  }

  async isBookmarked(storyId) {
    try {
      debugLog("Checking bookmark status:", storyId);
      const isBookmarked = await this._model.isBookmarked(storyId);
      debugLog("Bookmark status:", isBookmarked);
      return isBookmarked;
      
    } catch (error) {
      debugLog("Error checking bookmark status:", error);
      return false;
    }
  }

  async getBookmarkCount() {
    try {
      const count = await this._model.getBookmarkCount();
      debugLog("Bookmark count:", count);
      return count;
      
    } catch (error) {
      debugLog("Error getting bookmark count:", error);
      return 0;
    }
  }
}