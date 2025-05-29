import BookmarkModel from "../../data/bookmark-model.js";
import BookmarkPresenter from "../../presenter/bookmark-presenter.js";
import { isUserLoggedIn, debugLog } from "../../utils";

export default class BookmarkPage {
  constructor() {
    this._bookmarkModel = new BookmarkModel();
    this._presenter = new BookmarkPresenter({
      view: this,
      model: this._bookmarkModel,
    });
  }

  async render() {
    return `
      <section id="content" class="container" tabindex="-1">
        <div class="page-header">
          <h1 class="page-title">
            <i class="fas fa-bookmark"></i>
            Bookmark Saya
          </h1>
          <p class="page-subtitle">Koleksi cerita yang telah Anda simpan</p>
        </div>
        
        <div id="bookmark-container">
          <div class="loading">
            <div class="loading-spinner"></div>
            <p>Memuat bookmark...</p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (!isUserLoggedIn()) {
      window.location.hash = "#/login";
      return;
    }

    await this._presenter.loadBookmarks();
  }

  showLoading() {
    const container = document.getElementById("bookmark-container");
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <p>Memuat bookmark...</p>
        </div>
      `;
    }
  }

  hideLoading() {
    debugLog("Bookmark loading hidden");
  }

  renderBookmarks(response) {
    const container = document.getElementById("bookmark-container");
    if (!container) return;

    const bookmarks = response.listStory || [];

    if (bookmarks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="far fa-bookmark"></i>
          </div>
          <h3>Belum Ada Bookmark</h3>
          <p>Anda belum menyimpan cerita apapun ke bookmark.</p>
          <p>Mulai jelajahi cerita dan simpan yang menarik!</p>
          <a href="#/" class="btn btn-primary">
            <i class="fas fa-home"></i> Jelajahi Cerita
          </a>
        </div>
      `;
      return;
    }

    const bookmarksHTML = bookmarks
      .map(
        (story) => `
        <div class="story-card" data-story-id="${story.id}">
          <div class="story-image-container">
            <img 
              src="${story.photoUrl}" 
              alt="Cerita dari ${story.name}" 
              class="story-image"
              onerror="this.onerror=null; this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';"
            >
            <div class="story-actions">
              <button 
                class="btn btn-icon bookmark-btn bookmarked" 
                data-story-id="${story.id}"
                title="Hapus dari bookmark"
              >
                <i class="fas fa-bookmark"></i>
              </button>
            </div>
          </div>
          
          <div class="story-content">
            <h3 class="story-title">
              <a href="#/story/${story.id}">Cerita dari ${story.name}</a>
            </h3>
            
            <p class="story-description">
              ${
                story.description
                  ? story.description.length > 100
                    ? story.description.substring(0, 100) + "..."
                    : story.description
                  : "Tidak ada deskripsi"
              }
            </p>
            
            <div class="story-meta">
              <span class="story-date">
                <i class="far fa-calendar-alt"></i>
                ${this._formatDate(story.createdAt)}
              </span>
              
              ${
                story.bookmarkedAt
                  ? `
                <span class="bookmark-date">
                  <i class="fas fa-bookmark"></i>
                  Disimpan ${this._formatDate(story.bookmarkedAt)}
                </span>
              `
                  : ""
              }
              
              ${
                story.lat && story.lon
                  ? `
                <span class="story-location">
                  <i class="fas fa-map-marker-alt"></i>
                  Lokasi tersedia
                </span>
              `
                  : ""
              }
            </div>
            
            <div class="story-actions-bottom">
              <a href="#/story/${story.id}" class="btn btn-primary btn-sm">
                <i class="far fa-eye"></i> Lihat Detail
              </a>
              <button 
                class="btn btn-secondary btn-sm remove-bookmark-btn" 
                data-story-id="${story.id}"
                data-story-name="${story.name}"
              >
                <i class="fas fa-trash-alt"></i> Hapus
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join("");

    container.innerHTML = `
      <div class="bookmarks-header">
        <div class="bookmarks-count">
          <i class="fas fa-bookmark"></i>
          <span>${bookmarks.length} cerita tersimpan</span>
        </div>
        
        <div class="bookmarks-actions">
          <button id="clear-all-bookmarks" class="btn btn-outline btn-sm">
            <i class="fas fa-trash-alt"></i> Hapus Semua
          </button>
        </div>
      </div>
      
      <div class="stories-grid">
        ${bookmarksHTML}
      </div>
    `;

    this._attachEventListeners();
  }

  _attachEventListeners() {
    const removeButtons = document.querySelectorAll(".remove-bookmark-btn");
    removeButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        const storyId = button.dataset.storyId;
        const storyName = button.dataset.storyName;
        await this._handleRemoveBookmark(storyId, storyName);
      });
    });

    const bookmarkButtons = document.querySelectorAll(".bookmark-btn");
    bookmarkButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        const storyId = button.dataset.storyId;
        await this._handleRemoveBookmark(storyId);
      });
    });

    const clearAllButton = document.getElementById("clear-all-bookmarks");
    if (clearAllButton) {
      clearAllButton.addEventListener("click", async (e) => {
        e.preventDefault();
        await this._handleClearAllBookmarks();
      });
    }
  }

  async _handleRemoveBookmark(storyId, storyName = "") {
    const confirmMessage = storyName
      ? `Hapus "${storyName}" dari bookmark?`
      : "Hapus cerita ini dari bookmark?";

    if (confirm(confirmMessage)) {
      try {
        this.showLoading();
        const result = await this._bookmarkModel.deleteBookmark(storyId);

        if (!result.error) {
          await this._presenter.loadBookmarks();

          this._showNotification("Bookmark berhasil dihapus", "success");
        } else {
          this._showNotification(
            result.message || "Gagal menghapus bookmark",
            "error"
          );
        }
      } catch (error) {
        debugLog("Error removing bookmark:", error);
        this._showNotification(
          "Terjadi kesalahan saat menghapus bookmark",
          "error"
        );
      }
    }
  }

  async _handleClearAllBookmarks() {
    if (confirm("Hapus semua bookmark? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        this.showLoading();
        const bookmarks = await this._bookmarkModel.getAllBookmarks();

        if (bookmarks.listStory && bookmarks.listStory.length > 0) {
          for (const story of bookmarks.listStory) {
            await this._bookmarkModel.deleteBookmark(story.id);
          }

          await this._presenter.loadBookmarks();

          this._showNotification("Semua bookmark berhasil dihapus", "success");
        }
      } catch (error) {
        debugLog("Error clearing all bookmarks:", error);
        this._showNotification(
          "Terjadi kesalahan saat menghapus bookmark",
          "error"
        );
      }
    }
  }

  _showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  _formatDate(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return "Hari ini";
      } else if (diffDays === 2) {
        return "Kemarin";
      } else if (diffDays <= 7) {
        return `${diffDays - 1} hari lalu`;
      } else {
        return date.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch (error) {
      debugLog("Error formatting date:", error);
      return "Tanggal tidak valid";
    }
  }

  showErrorMessage(message) {
    const container = document.getElementById("bookmark-container");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-error">
          <p><i class="fas fa-exclamation-triangle"></i> Terjadi kesalahan saat memuat bookmark.</p>
          <p>${message || "Kesalahan tidak diketahui"}</p>
          <div style="margin-top: 15px;">
            <button id="retry-load-bookmarks" class="btn btn-primary btn-sm">
              <i class="fas fa-redo"></i> Coba Lagi
            </button>
            <a href="#/" class="btn btn-secondary btn-sm">
              <i class="fas fa-home"></i> Kembali ke Beranda
            </a>
          </div>
        </div>
      `;

      const retryButton = document.getElementById("retry-load-bookmarks");
      if (retryButton) {
        retryButton.addEventListener("click", async () => {
          await this._presenter.loadBookmarks();
        });
      }
    }
  }
}
