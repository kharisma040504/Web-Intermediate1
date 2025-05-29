import { debugLog } from "../utils";

class BookmarkModel {
  constructor() {
    this.DB_NAME = "StoryBookmarksDB";
    this.DB_VERSION = 1;
    this.STORE_NAME = "bookmarks";
    this.db = null;
  }

  async _initDB() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        debugLog("Error opening IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        debugLog("IndexedDB opened successfully");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Hapus store lama jika ada
        if (db.objectStoreNames.contains(this.STORE_NAME)) {
          db.deleteObjectStore(this.STORE_NAME);
        }

        // Buat store baru
        const store = db.createObjectStore(this.STORE_NAME, {
          keyPath: "id"
        });

        // Buat index untuk pencarian
        store.createIndex("name", "name", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("bookmarkedAt", "bookmarkedAt", { unique: false });

        debugLog("IndexedDB store created successfully");
      };
    });
  }

  async addBookmark(story) {
    try {
      await this._initDB();

      const bookmarkData = {
        id: story.id,
        name: story.name,
        description: story.description,
        photoUrl: story.photoUrl,
        createdAt: story.createdAt,
        lat: story.lat,
        lon: story.lon,
        bookmarkedAt: new Date().toISOString()
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(bookmarkData);

        request.onsuccess = () => {
          debugLog("Story bookmarked successfully:", story.id);
          resolve({
            error: false,
            message: "Story berhasil ditambahkan ke bookmark"
          });
        };

        request.onerror = () => {
          debugLog("Error adding bookmark:", request.error);
          reject({
            error: true,
            message: "Gagal menambahkan bookmark"
          });
        };
      });
    } catch (error) {
      debugLog("Error in addBookmark:", error);
      return {
        error: true,
        message: "Terjadi kesalahan saat menambahkan bookmark"
      };
    }
  }

  async getAllBookmarks() {
    try {
      await this._initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], "readonly");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const bookmarks = request.result;
          // Urutkan berdasarkan waktu bookmark (terbaru dulu)
          bookmarks.sort((a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt));
          
          debugLog("Retrieved bookmarks:", bookmarks.length);
          resolve({
            error: false,
            message: "success",
            listStory: bookmarks
          });
        };

        request.onerror = () => {
          debugLog("Error getting bookmarks:", request.error);
          reject({
            error: true,
            message: "Gagal mengambil data bookmark"
          });
        };
      });
    } catch (error) {
      debugLog("Error in getAllBookmarks:", error);
      return {
        error: true,
        message: "Terjadi kesalahan saat mengambil bookmark",
        listStory: []
      };
    }
  }

  async deleteBookmark(storyId) {
    try {
      await this._initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(storyId);

        request.onsuccess = () => {
          debugLog("Bookmark deleted successfully:", storyId);
          resolve({
            error: false,
            message: "Bookmark berhasil dihapus"
          });
        };

        request.onerror = () => {
          debugLog("Error deleting bookmark:", request.error);
          reject({
            error: true,
            message: "Gagal menghapus bookmark"
          });
        };
      });
    } catch (error) {
      debugLog("Error in deleteBookmark:", error);
      return {
        error: true,
        message: "Terjadi kesalahan saat menghapus bookmark"
      };
    }
  }

  async isBookmarked(storyId) {
    try {
      await this._initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], "readonly");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(storyId);

        request.onsuccess = () => {
          const exists = !!request.result;
          debugLog("Bookmark check for", storyId, ":", exists);
          resolve(exists);
        };

        request.onerror = () => {
          debugLog("Error checking bookmark:", request.error);
          resolve(false);
        };
      });
    } catch (error) {
      debugLog("Error in isBookmarked:", error);
      return false;
    }
  }

  async getBookmarkCount() {
    try {
      await this._initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], "readonly");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.count();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          debugLog("Error getting bookmark count:", request.error);
          resolve(0);
        };
      });
    } catch (error) {
      debugLog("Error in getBookmarkCount:", error);
      return 0;
    }
  }
}

export default BookmarkModel;