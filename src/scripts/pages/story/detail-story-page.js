import StoryModel from "../../data/story-model.js";
import BookmarkModel from "../../data/bookmark-model.js";
import DetailStoryPresenter from "../../presenter/detail-story-presenter.js";
import BookmarkPresenter from "../../presenter/bookmark-presenter.js";
import { parseActivePathname } from "../../routes/url-parser";
import {
  showFormattedDate,
  loadMapScript,
  isUserLoggedIn,
  debugLog,
} from "../../utils";

export default class DetailStoryPage {
  constructor() {
    this._storyModel = new StoryModel();
    this._bookmarkModel = new BookmarkModel();
    const { id } = parseActivePathname();

    this._presenter = new DetailStoryPresenter({
      view: this,
      model: this._storyModel,
      storyId: id,
    });

    this._bookmarkPresenter = new BookmarkPresenter({
      view: this,
      model: this._bookmarkModel,
    });

    this._map = null;
    this._mapError = false;
    this._story = null;
    this._isBookmarked = false;
  }

  async render() {
    return `
      <section id="content" class="container" tabindex="-1">
        <div id="story-detail-container">
          <div class="loading">
            <div class="loading-spinner"></div>
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

    await this._presenter.loadStoryDetail();
  }

  showLoading() {
    const container = document.getElementById("story-detail-container");
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
        </div>
      `;
    }
  }

  hideLoading() {
    debugLog("Loading hidden");
  }

  async renderStoryDetail(story) {
    this._story = story;
    this._isBookmarked = await this._bookmarkPresenter.isBookmarked(story.id);

    const container = document.getElementById("story-detail-container");
    if (!container) return;

    try {
      container.innerHTML = `
        <div class="story-detail">
          <div class="story-detail-header">
            <img 
              src="${story.photoUrl}" 
              alt="Cerita dari ${story.name}" 
              class="story-detail-image"
              onerror="this.onerror=null; this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';"
            >
            
            <div class="story-detail-overlay">
              <button 
                id="bookmark-toggle-btn" 
                class="btn btn-icon bookmark-btn ${
                  this._isBookmarked ? "bookmarked" : ""
                }"
                title="${
                  this._isBookmarked
                    ? "Hapus dari bookmark"
                    : "Tambah ke bookmark"
                }"
              >
                <i class="fas fa-bookmark"></i>
              </button>
            </div>
          </div>
          
          <div class="story-detail-content">
            <h1 class="story-detail-title">Cerita dari ${story.name}</h1>
            
            <div class="story-detail-meta">
              <span class="story-date">
                <i class="far fa-calendar-alt"></i>
                ${showFormattedDate(story.createdAt)}
              </span>
              
              ${
                story.lat && story.lon
                  ? `
                <span class="story-location">
                  <i class="fas fa-map-marker-alt"></i>
                  ${
                    this._mapError
                      ? `Lokasi: ${story.lat.toFixed(6)}, ${story.lon.toFixed(
                          6
                        )}`
                      : "Lokasi tersedia"
                  }
                </span>
              `
                  : ""
              }
            </div>
            
            <p class="story-detail-description">${
              story.description || "Tidak ada deskripsi"
            }</p>
            
            ${
              story.lat && story.lon
                ? `
              <div id="story-detail-map" class="story-detail-map"></div>
            `
                : ""
            }
            
            <div class="story-detail-actions">
              <a href="#/" class="btn btn-primary">
                <i class="fas fa-arrow-left"></i> Kembali ke Beranda
              </a>
              
              <button 
                id="bookmark-text-btn" 
                class="btn ${
                  this._isBookmarked ? "btn-secondary" : "btn-outline"
                }"
              >
                <i class="fas fa-bookmark"></i>
                ${this._isBookmarked ? "Hapus Bookmark" : "Tambah Bookmark"}
              </button>
              
              <a href="#bookmarks" class="btn btn-outline">
                <i class="fas fa-bookmark"></i> Lihat Bookmark
              </a>
            </div>
          </div>
        </div>
      `;

      this._attachBookmarkEventListeners();

      if (story.lat && story.lon) {
        await this._waitForMapContainer();
      }
    } catch (error) {
      debugLog("Error rendering story detail:", error);
      this.showErrorMessage(error.message);
    }
  }

  async _waitForMapContainer() {
    return new Promise((resolve) => {
      const checkContainer = () => {
        const mapContainer = document.getElementById("story-detail-map");
        if (mapContainer && mapContainer.offsetParent !== null) {
          resolve();
        } else {
          setTimeout(checkContainer, 50);
        }
      };
      checkContainer();
    });
  }

  _attachBookmarkEventListeners() {
    const bookmarkToggleBtn = document.getElementById("bookmark-toggle-btn");
    const bookmarkTextBtn = document.getElementById("bookmark-text-btn");

    if (bookmarkToggleBtn) {
      bookmarkToggleBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await this._handleBookmarkToggle();
      });
    }

    if (bookmarkTextBtn) {
      bookmarkTextBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await this._handleBookmarkToggle();
      });
    }
  }

  async _handleBookmarkToggle() {
    if (!this._story) {
      this._showNotification("Data cerita tidak tersedia", "error");
      return;
    }

    try {
      this._setBookmarkButtonsLoading(true);

      let result;
      if (this._isBookmarked) {
        result = await this._bookmarkPresenter.removeBookmark(this._story.id);

        if (!result.error) {
          this._isBookmarked = false;
          this._updateBookmarkButtons();
          this._showNotification("Cerita dihapus dari bookmark", "success");
        }
      } else {
        result = await this._bookmarkPresenter.addBookmark(this._story);

        if (!result.error) {
          this._isBookmarked = true;
          this._updateBookmarkButtons();
          this._showNotification("Cerita ditambahkan ke bookmark", "success");
        }
      }

      if (result.error) {
        this._showNotification(result.message || "Terjadi kesalahan", "error");
      }
    } catch (error) {
      debugLog("Error toggling bookmark:", error);
      this._showNotification(
        "Terjadi kesalahan saat mengubah bookmark",
        "error"
      );
    } finally {
      this._setBookmarkButtonsLoading(false);
    }
  }

  _setBookmarkButtonsLoading(isLoading) {
    const bookmarkToggleBtn = document.getElementById("bookmark-toggle-btn");
    const bookmarkTextBtn = document.getElementById("bookmark-text-btn");

    if (bookmarkToggleBtn) {
      bookmarkToggleBtn.disabled = isLoading;
      if (isLoading) {
        bookmarkToggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      } else {
        bookmarkToggleBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
      }
    }

    if (bookmarkTextBtn) {
      bookmarkTextBtn.disabled = isLoading;
      if (isLoading) {
        bookmarkTextBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Memproses...';
      }
    }
  }

  _updateBookmarkButtons() {
    const bookmarkToggleBtn = document.getElementById("bookmark-toggle-btn");
    const bookmarkTextBtn = document.getElementById("bookmark-text-btn");

    if (bookmarkToggleBtn) {
      bookmarkToggleBtn.className = `btn btn-icon bookmark-btn ${
        this._isBookmarked ? "bookmarked" : ""
      }`;
      bookmarkToggleBtn.title = this._isBookmarked
        ? "Hapus dari bookmark"
        : "Tambah ke bookmark";
      bookmarkToggleBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
    }

    if (bookmarkTextBtn) {
      bookmarkTextBtn.className = `btn ${
        this._isBookmarked ? "btn-secondary" : "btn-outline"
      }`;
      bookmarkTextBtn.innerHTML = `
        <i class="fas fa-bookmark"></i>
        ${this._isBookmarked ? "Hapus Bookmark" : "Tambah Bookmark"}
      `;
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

  showErrorMessage(message) {
    const container = document.getElementById("story-detail-container");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-error">
          <p><i class="fas fa-exclamation-triangle"></i> Terjadi kesalahan saat memuat detail cerita.</p>
          <p>${message || "Kesalahan tidak diketahui"}</p>
          <p><a href="#/" class="btn btn-primary"><i class="fas fa-home"></i> Kembali ke beranda</a></p>
        </div>
      `;
    }
  }

  async initMap(lat, lon, story) {
    try {
      const mapContainer = document.getElementById("story-detail-map");
      if (!mapContainer) {
        throw new Error("Map container not found");
      }

      const L = await loadMapScript();
      if (!L) {
        this.handleMapError(new Error("Map tidak tersedia dalam mode offline"));
        return;
      }

      if (this._map) {
        this._map.remove();
        this._map = null;
      }

      this._map = L.map("story-detail-map").setView([lat, lon], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this._map);

      const marker = L.marker([lat, lon]).addTo(this._map);

      marker
        .bindPopup(
          `
        <div>
          <h3>${story.name}</h3>
          <p>${story.description?.substring(0, 50)}${
            story.description?.length > 50 ? "..." : ""
          }</p>
        </div>
      `
        )
        .openPopup();

      setTimeout(() => {
        if (this._map) {
          this._map.invalidateSize();
        }
      }, 100);
    } catch (error) {
      this.handleMapError(error);
    }
  }

  handleMapError(error) {
    debugLog("Error initializing map:", error);
    this._mapError = true;

    const mapContainer = document.getElementById("story-detail-map");
    if (mapContainer && this._story) {
      mapContainer.innerHTML = `
        <div class="alert alert-info" style="padding: 20px; text-align: center; background: #f0f8ff; border: 1px solid #add8e6; border-radius: 5px;">
          <i class="fas fa-info-circle"></i>
          <p><strong>Mode Offline</strong></p>
          <p>Peta tidak tersedia saat offline.</p>
          <p>Koordinat lokasi: <strong>${this._story.lat?.toFixed(
            6
          )}, ${this._story.lon?.toFixed(6)}</strong></p>
        </div>
      `;
    }
  }
}
