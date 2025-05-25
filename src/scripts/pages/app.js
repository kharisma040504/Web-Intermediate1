import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import {
  isUserLoggedIn,
  clearUserData,
  checkBrowserSupport,
  debugLog,
} from "../utils";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #authMenu = null;
  currentPage = null;

  constructor({ navigationDrawer, drawerButton, content, authMenu }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#authMenu = authMenu;
    this._checkBrowserCompatibility();
    this._setupDrawer();
    this._updateAuthMenu();
    this._registerServiceWorker();
    this._initSkipToContent();
  }

  _checkBrowserCompatibility() {
    const supportInfo = checkBrowserSupport();
    debugLog("Browser support check:", supportInfo);

    if (!supportInfo.fullSupport) {
      console.warn("Browser tidak mendukung fitur:", supportInfo.unsupported);

      if (
        supportInfo.unsupported.includes("camera") ||
        supportInfo.unsupported.includes("localStorage")
      ) {
        const warningMessage = `
          <div class="alert alert-warning" style="position: fixed; top: 0; left: 0; right: 0; z-index: 10000; text-align: center; padding: 10px;">
            Browser Anda tidak mendukung fitur: ${supportInfo.unsupported.join(
              ", "
            )}.
            Beberapa fitur aplikasi mungkin tidak berfungsi dengan baik.
            <button id="dismiss-warning" style="margin-left: 10px; padding: 2px 8px;">Tutup</button>
          </div>
        `;

        const warningElement = document.createElement("div");
        warningElement.innerHTML = warningMessage;
        document.body.insertBefore(warningElement, document.body.firstChild);

        document
          .getElementById("dismiss-warning")
          ?.addEventListener("click", () => {
            warningElement.remove();
          });
      }
    }
  }

  _setupDrawer() {
    try {
      this.#drawerButton.addEventListener("click", () => {
        this.#navigationDrawer.classList.toggle("open");
      });

      document.body.addEventListener("click", (event) => {
        if (
          !this.#navigationDrawer.contains(event.target) &&
          !this.#drawerButton.contains(event.target)
        ) {
          this.#navigationDrawer.classList.remove("open");
        }

        this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
          if (link.contains(event.target)) {
            this.#navigationDrawer.classList.remove("open");
          }
        });
      });
    } catch (error) {
      debugLog("Error setting up drawer:", error);
    }
  }

  _updateAuthMenu() {
    try {
      if (isUserLoggedIn()) {
        this.#authMenu.innerHTML = `
          <a href="#" id="logout-button">Logout</a>
        `;

        const logoutButton = document.getElementById("logout-button");
        if (logoutButton) {
          logoutButton.addEventListener("click", (event) => {
            event.preventDefault();

            alert("Anda berhasil logout");
            clearUserData();
            window.location = "#/login";

            setTimeout(() => {
              window.location.reload(true);
            }, 100);
          });
        }
      } else {
        this.#authMenu.innerHTML = '<a href="#/login">Login</a>';

        const currentPath = window.location.hash.replace("#", "");
        const restrictedPaths = ["/", "/add", "/story"];

        const isRestricted = restrictedPaths.some(
          (path) => currentPath === path || currentPath.startsWith(path + "/")
        );

        if (isRestricted) {
          window.location = "#/login";
        }
      }
    } catch (error) {
      console.error("Error updating auth menu:", error);
      this.#authMenu.innerHTML = '<a href="#/login">Login</a>';
    }
  }

  _initSkipToContent() {
    try {
      const skipLink = document.querySelector(".skip-link");

      if (skipLink) {
        skipLink.addEventListener("click", (event) => {
          event.preventDefault();

          const mainContent = document.querySelector("#content");

          if (mainContent) {
            mainContent.setAttribute("tabindex", "-1");
            mainContent.focus();
            mainContent.scrollIntoView();
          }
        });
      }
    } catch (error) {
      console.error("Error initializing skip to content:", error);
    }
  }

  async renderPage() {
    try {
      if (document.startViewTransition) {
        await document.startViewTransition(async () => {
          await this._renderContent();
        }).finished;
      } else {
        await this._renderContent();
      }

      this._updateAuthMenu();

      this._initSkipToContent();
    } catch (error) {
      debugLog("Error during page rendering:", error);
      this.#content.innerHTML = `
        <div class="container">
          <h2 class="page-title">Terjadi Kesalahan</h2>
          <p>Maaf, terjadi kesalahan saat memuat halaman.</p>
          <p>${error.message || "Kesalahan tidak diketahui"}</p>
          <p><a href="#/">Kembali ke beranda</a></p>
        </div>
      `;
    }
  }

  async _renderContent() {
    try {
      const url = getActiveRoute();
      const PageClass = routes[url];

      if (!PageClass) {
        this.#content.innerHTML = `
          <div id="content" class="container" tabindex="-1">
            <h2 class="page-title">Halaman Tidak Ditemukan</h2>
            <p>Halaman yang Anda cari tidak tersedia.</p>
            <p><a href="#/">Kembali ke beranda</a></p>
          </div>
        `;
        return;
      }

      this.#content.innerHTML = `
        <div class="container">
          <div class="loading">
            <div class="loading-spinner"></div>
          </div>
        </div>
      `;

      if (this.currentPage && typeof this.currentPage.cleanup === "function") {
        try {
          this.currentPage.cleanup();
        } catch (cleanupError) {
          console.error("Error cleaning up previous page:", cleanupError);
        }
      }

      this.currentPage = new PageClass();
      const content = await this.currentPage.render();

      if (content.includes('id="content"')) {
        this.#content.innerHTML = content;
      } else {
        this.#content.innerHTML = content.replace(
          '<section class="container"',
          '<section id="content" class="container" tabindex="-1"'
        );
      }

      await this.currentPage.afterRender();
    } catch (error) {
      debugLog("Error in _renderContent:", error);
      throw error;
    }
  }

  _registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log(
              "Service Worker berhasil didaftarkan:",
              registration.scope
            );
          })
          .catch((error) => {
            console.error("Pendaftaran Service Worker gagal:", error);
          });
      });
    } else {
      console.log("Browser tidak mendukung Service Worker");
    }
  }

  cleanup() {
    if (this.currentPage && typeof this.currentPage.cleanup === "function") {
      try {
        this.currentPage.cleanup();
        this.currentPage = null;
      } catch (error) {
        console.error("Error during app cleanup:", error);
      }
    }

    console.log("App resources cleaned up");
  }
}

export default App;
