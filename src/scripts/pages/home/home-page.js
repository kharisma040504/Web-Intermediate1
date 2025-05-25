import StoryModel from "../../data/story-model.js";
import HomePresenter from "../../presenter/home-presenter.js";
import {
  showFormattedDate,
  loadMapScript,
  isUserLoggedIn,
  debugLog,
  showNotification,
} from "../../utils";

export default class HomePage {
  constructor() {
    this._storyModel = new StoryModel();
    this._presenter = new HomePresenter({
      view: this,
      model: this._storyModel,
    });

    this._map = null;
    this._markers = [];
    this._mapError = false;
    this._scrollHandler = null;
  }

  async render() {
    return `
    <section id="content" class="container" tabindex="-1">
      <h1 class="page-title"><i class="fas fa-book-reader"></i> Cerita Terbaru</h1>
      
      <div class="map-container" id="stories-map"></div>
      
      <div id="stories-container" class="stories-container">
        <div class="loading">
          <div class="loading-spinner"></div>
        </div>
      </div>
      
      <div id="load-more-container" style="text-align: center; margin-top: 20px; display: none;">
        <button id="load-more-button" class="btn btn-primary">
          <i class="fas fa-sync"></i> Muat Lebih Banyak
        </button>
      </div>
    </section>
  `;
  }

  async afterRender() {
    const storiesContainer = document.getElementById("stories-container");
    const mapContainer = document.getElementById("stories-map");
    const loadMoreContainer = document.getElementById("load-more-container");
    const loadMoreButton = document.getElementById("load-more-button");

    try {
      if (!isUserLoggedIn()) {
        if (storiesContainer) {
          storiesContainer.innerHTML = `
            <div class="alert alert-error">
              <p>Anda perlu <a href="#/login">login</a> untuk melihat cerita.</p>
              <p>Belum punya akun? <a href="#/register">Daftar sekarang</a>.</p>
            </div>
          `;
        }
        if (mapContainer) {
          mapContainer.style.display = "none";
        }
        return;
      }

      if (loadMoreButton) {
        loadMoreButton.addEventListener("click", () => {
          this._presenter.loadMoreStories();
        });
      }

      this._presenter.setupInfiniteScroll();

      try {
        debugLog("Initializing map before loading stories");
        await this.initMap();
      } catch (mapError) {
        debugLog("Map initialization error:", mapError);
        this.handleMapError(mapError);
      }

      await this._presenter.loadStories();
    } catch (error) {
      debugLog("Error in home page:", error);
      this.showErrorMessage(error.message);
    }
  }

  showLoading(isFirstPage) {
    const storiesContainer = document.getElementById("stories-container");
    const loadMoreContainer = document.getElementById("load-more-container");

    if (isFirstPage && storiesContainer) {
      storiesContainer.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
        </div>
      `;
    } else if (loadMoreContainer) {
      const loadingIndicator = document.createElement("div");
      loadingIndicator.className = "loading";
      loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
      loadingIndicator.id = "load-more-spinner";
      loadMoreContainer.appendChild(loadingIndicator);
    }
  }

  hideLoadingIndicator() {
    const spinner = document.getElementById("load-more-spinner");
    if (spinner && spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
    }
  }

  renderStories(append = false, newStories = []) {
    const storiesContainer = document.getElementById("stories-container");

    if (!storiesContainer) {
      console.warn("Stories container tidak ditemukan");
      return;
    }

    if (newStories.length > 0) {
      this._stories = append ? [...this._stories, ...newStories] : newStories;
    }

    try {
      const storiesToRender = newStories;
      const uniqueStoryIds = new Set();
      const uniqueStories = [];

      storiesToRender.forEach((story) => {
        if (story && story.id && !uniqueStoryIds.has(story.id)) {
          uniqueStoryIds.add(story.id);
          uniqueStories.push(story);
        }
      });

      const storiesHTML = uniqueStories
        .map((story) => {
          if (!story || !story.name || !story.photoUrl) {
            console.log("Story data is incomplete:", story);
            return "";
          }

          return `
        <article class="story-card" data-id="${story.id}">
          <div class="story-image-container">
            <img 
            src="${story.photoUrl}" 
            alt="Cerita dari ${story.name}" 
            class="story-image"
            onerror="this.onerror=null; this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6CAYAAAAbbXrzAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAADhBJREFUeNrs3V9u20YWwGGoaU+R7d7guS9gFYj7CHkDyFIXSHuDBK4vkPgGbW6QODdI4voDbeUuEHWBokBgdxcoshsULtolxk2mZWpKIiUNyRnO9wGC7cSSbXKo+XHOP8bGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANiWzfQ46fzZWvvMh91/tHt3/2f6mP7oP8pXCRQNVhVIVcc2TI836WP6PE46/99x+l8nyVcKbFukDsfTx/up1AvGKJ1E2lkQrEDUxnQSpD/uV1BLh+lkmqW/8pgfIFhBaVR10r8vGnUCJU+Pp+lkmqU/L8UJBCvQcOVBl4aqb2npMk1jT0QKBCtEaTQNVV9/pV36VDODYIWsDtVJA0sXRdJBEIIVuqJ89GkANwGgWSFYwbWqomk0oFBd1bSqnhUkWEEYSqiuqqpZRQJMsELx2pZVgbgWvlCwQgpVOGUhJFiBhCqUQcuhSbCCMJxLSx6VK4QrtMrLgUmwQiOFVRUXwoWCNeTLSyHLWwmCNYQplrJFkCBYgy2s2ArWCRCsoy6s2AusDM0SrEMurChwbR/B2vPYwh7xYKRLXyZYh1pYcXtF9rMlWANytLfz8SWu7SNYe1JYBG3XZbX0ZYJ1SIUVGdqmG9cmWNtmaMZQuRRFsPaEsWMsYfNz5jqFYO2jsCqWMIzCK1x9mWDtubCYnEMRFpexBGvPhbVUWAyjuPJq14K1VWrGiGtUIVj7Lazc0IyxBFYtBGufhUVZxVJYlYK1x8Jy1xvWgrt9Eax9FlZUTLHFNSzBOkACGNesqMQJ1j4LK1JWxMIZ1pYLKyqm2MKKYQnWIRRWVEyxhRXDEqwDJYSCigRr34UVFVNsZUUMRbD2XFhRMcUWVnxIsPZcWEWZUIirYBGsfRZWVEyxhfXegiVY+y6sqJhiCyu2QbAOoLCMHceKbRCsAzVjLDBiyLZhA8Laknw95n4bxldxWcbH/d4bCWGtprDaW2ikOUu0jR0fJ19tPf0sptfbjz8tQ9tQTbCG0YyxpNh+f0gDmjv9LB+/v/C5O8nnTYK1hxlWcQVkZ4HK32Oefv3+2B5fOolmAQ9KsHbQjFFGsZnfzaXfpY9fP/31t9Px9LcfPvzTaWoKrdsqWFsprMpY5rdx/K+pZ33/13+cpHY5NQuoYG2rsIzNGJr59Xf65aeXv/2QJbP/dB+rYG2psIwdMnv744//1JlPnU4Z6qThzgjWdpoxlBVbb2Nzty/6c/ooVJ8K1r4KKyqqKB+nv/vSn6dA5cUXJYZg7bkZY4sxq3LPnTzOnj1/+zY7fu/9+QqGYO25sAphdVr/vf80P+OL/M9ffPnV0fHJV30+bC5YWy+s6mbRKPpcQPr75fPnvy9HNz4OlR/vHhcZg9LfXz57drm8Yf1VG7Tn6XH/2vd68vrRu18+f/66Bf+uLFiFwRnWLaQN/Xp6lN2OoeXuFzEpuGq/TZPPn7+etCRQM0+v7FY7TQO1/ymuR90MK2PG1V5r/Pbbdp0V3fljh3t8/D7EvtcjWAcvKtlXbLvmDyxYglUxn1F/m2INUG4RKNcj+5Fh/VN+vBsrOArW3qXfS2d8JFj7LqtuPSo8zVeI1sAYlGAJFoI1OLlgIS2CVVQCEaxDLqtuPSo8zVeI1sAYlGAJl2INUG4RKNcj+5Fh/VN+vBsrOArW3qXfS2d8JFj7LqtuPSo8zVeI1sAYlGAJFoI1OLlgIS2CVVQCEaxDLqtuPSo8zVeI1sAlBYIlWjKuFJDqPI/HN/y9GSpan7zdjb71WP8Z5j/3P3SStP9bdH3+NRVl/fpylXPPnz/N+9hjvXl1s4L9j38w4fXZYvv9bTDO9v79/4ecSLMH6Qbpw93OfNnfOe8dP19+XLx6JjWD9QPZ+/vSb7H28X/fPGIgTrCE1X9XVk1eVXF97vrT+U7AEK3CvZ8f7vXty9nyRHZ8/1r9dTFoI1oGIQdHf+9m7p2+f3hQXwYvJC1mWYB1Mc9VvY/qzp2/evi0ej68vcbVkX1bB2vv88rvnJHnvUc9hy7JutWbTb7x+V1nCdcjBKndd8l6cX2S56K90LVg/iDAMvj+LFn2W9a7+vS/XL0Ue7L0QrAOdb95b07maTHRZgiVYgwzW68ePpSvBGuTYMa5U9DsSFl2WYAlWYMx6TLAMXsMKVuGGJdOCJVoUxqg6LMGqm2N1ntvZj/WLbEGwBOvQG6z7G9GCJViDuIY1VL+OvvTXNSxcwxrwaFVu4tTjXAQLwaqbZem+EEbB+lEsQ8Gq22aZ9dh4JFi4hNVV//5ZvbosORYs0aqnVdjnzQQEq2HGXjdCLiksK6pCaAWrkRsXl6ZNyK0Q0WrbIrwW0pXPJViHbNXrtYP/OtGxbREeekDvvXNuixAswtb1R2+z0WORYcGCDPu97iq0WoJ1yOF6ONXl8MeBjY+CJW0H3miZZQnWvsyjCDc+3YmV4dIgWA0VQ9kxnHJl8VGwGi0G6aYbzaoFC7JkUB4EyxgWgvVXxrUQrOY2bwHLCuGSJVhQEqnwKlBZwWo88cK29kKwDJOGWVUqKcFqg/jkh4y9LMFqSwiGPLQc7tBBsJo+JKTbNmEsWK3SbMl2SVWw2i6CiqdcU26C1TYtXXGP32zBOih9L/3pdwkXwTqkPKsXt+zyFywonbPQ8uFQsA7dTcbqdFaCRdXlXStGVgSrLTfYwk6bLMMSrLbdnNzPgmC1SXmcRbYFq4XCYhQVwTr4aFEu12ZagtXmaOF+FgQL09wFq+XLv1h1mfQQLLqilRe/zKsQLMoiVnNBWpAJFmVX5YsRKcGiQrRkSrAQKMHiR42WjzUUrAGS+wXrUBus4g3u5V2wDJMQLLYcrfLdESpiFtFhPtbQb3XuOx3aqMq8CsE65Gb20HvZQGEo/bNgQSFeZlgEq1WxMqtCsJouhmZZFCxDRgjWHlk9qx9DwBYsy7AIViPDFcJdj1pNXUOwDr2Y2tTAOfoQLEp6WZUHIMyjQLA6BdQSWZRgIViCBYIlViBYgiVYgCGcYIEgCZZoCZZgQeOYuBcsNlJwzStvIFiCQCBYggUgWNAZEjMtBAvBEiwQLMHCDAvBAjRYIFiwHSoogiVY/ZU3pVOwcA1LsIggCJZgQXDtlGCBYLmERbAEi+E2WIKFa1jtCJZRlmi5S4NgESeXsAQLBBnBEiy2JYAXVWFPrGDBjsSl+a/S/TgRLHzQnWCBYE2LrDkWLHaQrrIbf8uyYInWvjtZJV0u9QmWaLVLlT6WbIHgfT7yLFpH2WsWGY6yUEf5bwsJ2mZq95F3hHw6yv/KIjwZFa89SqN1nMX4ZPQvAubaDbuwV4uKj9mkx2TUI+STkTADALAnbm/g/Vwua88Ea1+OP+lx3OOl10fZ4+S7FxKsBnxy0jPIk+PsMs9pz0t3k+6f/WX24DT7uZO9vvzhXg0WoIFLYZNeEZ30upQ16REd0RKs1oeqzxLWJA/s6Xf8OykDJFitn4pxKaz/a55015l/SqB9GYJnDZbwHuWh7tHfmubN1VEesm8veU8F67CSNRat1XBdXroa/fdLZb/WEa+JcB1OwL69RNWxxmoy/e/LX10+OwXrQC9rXf5Zt9/rd5nrslH79qXLZqdgHWi0TqYlq/3y3NnFdVnnptcTrMNN12lus9fV/p6L91me6WTHm77/sFPBOliX9/2JL5fBzrN0na8Gp5tEX/w6jdMU9NnwHgfugOZinO+rSX667+jHvp3wPT3ZcPR/KlgHvY7rZDrd/3Q6nR7tI1b58+Tpy0fOk+F8UoUJ7+m+J7j3mf6QXYo7n+blgqfTSE273fd0h5+1YB3cJbDp9K/7e1/1Xe/Vw0RYFmVYgyBYggUgWKCnRbAABIsWzwUELHEVLNEaKpO8BMuEMQRLsASL7nUswcLMf0QL17AQLMECBEuwQJewBEuwAMESTFzDQrBwoiZagmUvYRAsAQTXsATLPsIgWIIIRgjBMlAEBEsBmTpwhQnBEsb/EXDAJSzBwnVtdQMEy9VtQJYFC1xwQbAEDBAswQIQrFaHa0ix/nZhv2DBOky9crmOtb7PF/YLFglXKK+LWPn9gkXCFcoVhcqLvOwZxHi+vx2OBQs23uO4zTEfC5bJD8gwggWCJVggWIIFCBYIlmABggWCZUdnwRIsECzBAsECwTKGJViCBYIlWCBYggWCBYIlWCBYIFiCBYIFgiVYIFggWIIFCBYIliBqUWrBEiyAHiYmjbPHD9nj+fTXj81VAmLWRxGwj2TdLO2ZTR+v089f94pifn7mz1fTX9+lP7/JXz+CRcj6KK0pXJfZ47309x9l4TIQ7O9e+vMb089Bve9Lgcu8i4sPp9OfX08DdZr/+Wz6+9kUsDPX/MBYCwB2KO/zrmbTn0/TMF4J11H26wvxAg6k0Zpm65V4AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwLb8T4ABAFyGt6FLqJ4OAAAAAElFTkSuQmCC';"
            loading="lazy"
          >
        </div>
        <div class="story-content">
          <h2 class="story-title">${story.name}</h2>
          <p class="story-meta"><i class="far fa-calendar-alt"></i> ${showFormattedDate(
            story.createdAt
          )}</p>
          <p class="story-description">${
            story.description
              ? story.description.length > 100
                ? story.description.substring(0, 100) + "..."
                : story.description
              : "Tidak ada deskripsi"
          }</p>
          ${
            story.lat && story.lon
              ? `
            <div class="story-location">
              <i class="fas fa-map-marker-alt"></i>
              ${
                this._mapError
                  ? `Lokasi: ${parseFloat(story.lat).toFixed(6)}, ${parseFloat(
                      story.lon
                    ).toFixed(6)}`
                  : "Lokasi tersedia"
              }
            </div>
        `
              : ""
          } 
          <div class="story-more">
            <a href="#/story/${story.id}" class="btn btn-primary">
              <i class="fas fa-book-open"></i> Lihat Detail
            </a>
          </div>
        </div>
      </article>
    `;
        })
        .join("");

      if (append) {
        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = storiesHTML;

        Array.from(tempContainer.children).forEach((child) => {
          child.style.opacity = "0";
          child.style.transform = "translateY(20px)";
          storiesContainer.appendChild(child);

          setTimeout(() => {
            child.style.transition = "opacity 0.5s, transform 0.5s";
            child.style.opacity = "1";
            child.style.transform = "translateY(0)";
          }, 10);
        });
      } else {
        storiesContainer.innerHTML = storiesHTML;
      }
    } catch (error) {
      console.error("Error rendering stories:", error);
      this.showErrorMessage(error.message);
    }
  }

  toggleLoadMoreButton(show) {
    const loadMoreContainer = document.getElementById("load-more-container");
    if (loadMoreContainer) {
      loadMoreContainer.style.display = show ? "block" : "none";
    }
  }

  showEmptyStoriesMessage() {
    const storiesContainer = document.getElementById("stories-container");
    const loadMoreContainer = document.getElementById("load-more-container");

    if (storiesContainer) {
      storiesContainer.innerHTML = `
        <div class="alert alert-info">
          <p>Belum ada cerita yang tersedia.</p>
          <p>Jadilah yang pertama <a href="#/add">berbagi cerita</a>!</p>
        </div>
      `;
    }

    if (loadMoreContainer) {
      loadMoreContainer.style.display = "none";
    }
  }

  showErrorMessage(message) {
    const storiesContainer = document.getElementById("stories-container");
    const mapContainer = document.getElementById("stories-map");

    if (storiesContainer) {
      storiesContainer.innerHTML = `
        <div class="alert alert-error">
          <p>Terjadi kesalahan saat memuat cerita.</p>
          <p>${message || "Kesalahan tidak diketahui"}</p>
          <button onclick="window.location.reload()" class="btn btn-small">Coba Lagi</button>
        </div>
      `;
    }

    if (mapContainer) {
      mapContainer.style.display = "none";
    }
  }

  setupInfiniteScroll(callback) {
    let isThrottled = false;

    const scrollHandler = () => {
      if (isThrottled) return;

      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, 300);

      const loadMoreButton = document.getElementById("load-more-button");
      const storiesContainer = document.getElementById("stories-container");

      if (!loadMoreButton || !storiesContainer) {
        window.removeEventListener("scroll", this._scrollHandler);
        return;
      }

      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollY + windowHeight >= documentHeight - 300) {
        callback();
      }
    };

    this._scrollHandler = scrollHandler;
    window.addEventListener("scroll", this._scrollHandler);
  }

  async initMap() {
    try {
      const mapContainer = document.getElementById("stories-map");

      if (!mapContainer) {
        debugLog("Map container tidak ditemukan");
        return;
      }

      debugLog("Initializing map in View...");

      if (mapContainer.clientHeight === 0) {
        mapContainer.style.height = "400px";
      }

      if (this._map) {
        debugLog("Map already exists, invalidating size");
        this._map.invalidateSize();
        return;
      }

      const L = await loadMapScript();
      window.L = L;
      debugLog("Leaflet script loaded successfully");

      await new Promise((resolve) => setTimeout(resolve, 300));

      debugLog("Creating map instance");
      this._map = L.map(mapContainer, {
        center: [-2.5489, 118.0149],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this._map);

      window.addEventListener("resize", () => {
        if (this._map) {
          this._map.invalidateSize();
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this._map) {
          setTimeout(() => this._map.invalidateSize(), 200);
        }
      });

      debugLog("Map initialization complete");

      if (this._stories && this._stories.length > 0) {
        debugLog(
          `Updating markers on map init with ${this._stories.length} existing stories`
        );
        setTimeout(() => {
          this.updateMapMarkers(this._stories);
        }, 500);
      }

      return this._map;
    } catch (error) {
      debugLog("Error initializing map:", error);
      this._mapError = true;
      throw error;
    }
  }

  updateMapMarkers(stories) {
    debugLog(
      `updateMapMarkers called with ${stories ? stories.length : 0} stories`
    );

    if (!this._map || this._mapError) {
      debugLog("Map not available or has error, skipping marker update");
      return;
    }

    if (this._markers && this._markers.length > 0) {
      debugLog(`Removing ${this._markers.length} existing markers`);
      this._markers.forEach((marker) => {
        if (marker && marker.remove) {
          marker.remove();
        }
      });
      this._markers = [];
    }

    if (!window.L) {
      debugLog("Leaflet not available, skipping marker update");
      return;
    }

    try {
      const customIcon = window.L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      let markersAdded = 0;
      let validStories = 0;

      const storiesWithLocation = stories.filter(
        (story) =>
          story &&
          story.lat &&
          story.lon &&
          !isNaN(parseFloat(story.lat)) &&
          !isNaN(parseFloat(story.lon))
      );

      debugLog(
        `Found ${storiesWithLocation.length} stories with valid location data`
      );

      storiesWithLocation.forEach((story) => {
        const validLat = parseFloat(story.lat);
        const validLon = parseFloat(story.lon);

        validStories++;

        try {
          const marker = window.L.marker([validLat, validLon], {
            icon: customIcon,
          });

          marker.bindPopup(`
            <div class="map-popup">
              <h3>${story.name}</h3>
              <p>${
                story.description
                  ? story.description.substring(0, 100) + "..."
                  : "Tidak ada deskripsi"
              }</p>
              <a href="#/story/${
                story.id
              }" class="btn btn-small">Lihat Detail</a>
            </div>
          `);

          marker.addTo(this._map);
          this._markers.push(marker);
          markersAdded++;
        } catch (error) {
          debugLog(`Error adding marker for story ${story.id}:`, error);
        }
      });

      debugLog(
        `Added ${markersAdded} markers to map from ${validStories} valid stories`
      );

      if (this._markers.length > 0) {
        try {
          const group = window.L.featureGroup(this._markers);
          this._map.fitBounds(group.getBounds(), { padding: [30, 30] });
          debugLog("Successfully fit bounds to markers");
        } catch (error) {
          debugLog("Error fitting bounds:", error);
        }
      } else {
        debugLog("No markers to fit bounds");
      }
    } catch (error) {
      debugLog("Error in updateMapMarkers:", error);
    }
  }

  handleMapError(error) {
    this._mapError = true;
    const mapContainer = document.getElementById("stories-map");
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="alert alert-error">
          <p>Gagal memuat peta. Mohon periksa koneksi internet Anda.</p>
          <p>Error: ${error.message || "Tidak diketahui"}</p>
        </div>
      `;
    }
    debugLog("Map error handled:", error);
  }

  isMapError() {
    return this._mapError;
  }

  cleanup() {
    debugLog("Cleaning up HomePage resources");

    if (this._scrollHandler) {
      window.removeEventListener("scroll", this._scrollHandler);
      this._scrollHandler = null;
    }

    if (this._map) {
      try {
        this._map.remove();
        debugLog("Map removed successfully");
      } catch (error) {
        debugLog("Error removing map:", error);
      }
      this._map = null;
    }

    this._markers = [];

    console.log("HomePage resources cleaned up");
  }
}
