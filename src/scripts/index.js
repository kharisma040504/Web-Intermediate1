import "../styles/styles.css";
import App from "./pages/app";
import { getUserData, createNotificationButton } from "./utils";
import { initOfflineManager } from "./utils/offline-utils";

let appInstance = null;
let offlineManager = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.startViewTransition) {
    console.warn(
      "Browser Anda tidak mendukung View Transitions API. Transisi halaman mungkin kurang smooth."
    );
  }

  if (appInstance) {
    appInstance.cleanup();
    appInstance = null;
  }

  appInstance = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
    authMenu: document.querySelector("#auth-menu"),
  });

  if (!appInstance.cleanup) {
    appInstance.cleanup = function () {
      if (this.currentPage && typeof this.currentPage.cleanup === "function") {
        this.currentPage.cleanup();
      }
      console.log("App instance cleaned up");
    };
  }

  await appInstance.renderPage();

  if (window._hashChangeHandler) {
    window.removeEventListener("hashchange", window._hashChangeHandler);
  }

  window._hashChangeHandler = async () => {
    if (appInstance._isRendering) {
      console.log("Render sedang berjalan, abaikan hashchange event");
      return;
    }

    appInstance._isRendering = true;

    try {
      await appInstance.renderPage();
      updateNotificationButtonVisibility();
    } catch (error) {
      console.error("Error rendering page:", error);
    } finally {
      appInstance._isRendering = false;
    }
  };

  window.addEventListener("hashchange", window._hashChangeHandler);

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker-enhanced.js",
        {
          scope: "/",
          updateViaCache: "none",
        }
      );

      console.log(
        "Enhanced service worker registered successfully with scope:",
        registration.scope
      );

      registration.update();

      setInterval(() => {
        registration.update();
        console.log("Checking for service worker updates...");
      }, 60 * 60 * 1000);

      setupNotificationButton();
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  }

  offlineManager = initOfflineManager();
  window.offlineManager = offlineManager;
  console.log("✅ Offline Manager initialized");

  window.addEventListener("beforeunload", () => {
    if (appInstance) {
      appInstance.cleanup();
    }
  });
});

function setupNotificationButton() {
  createNotificationButton();
  updateNotificationButtonVisibility();

  window.addEventListener("hashchange", updateNotificationButtonVisibility);

  setInterval(updateNotificationButtonVisibility, 1000);
}

function updateNotificationButtonVisibility() {
  const button = document.getElementById("notification-toggle-btn");
  const userData = getUserData();

  if (button) {
    if (userData && userData.token) {
      button.style.display = "block";
    } else {
      button.style.display = "none";
    }
  }
}

export class FloatingButton {
  constructor(options = {}) {
    this.options = {
      text: options.text || "Tambah",
      href: options.href || "#/add",
      icon: options.icon || "+",
      position: options.position || "bottom-right",
      tooltip: options.tooltip || "Tambah Cerita Baru",
      onClick: options.onClick || null,
      color: options.color || "var(--tosca-primary)",
      ...options,
    };

    this.element = null;
    this._hashChangeHandler = null;
    this.create();
  }

  create() {
    this.remove();

    this.element = document.createElement("div");
    this.element.className = `floating-button floating-button-${this.options.position}`;

    if (this.options.href) {
      this.element.innerHTML = `
        <a href="${this.options.href}" class="floating-button-link" aria-label="${this.options.tooltip}">
          ${this.options.icon}
        </a>
      `;
    } else {
      this.element.innerHTML = `
        <button class="floating-button-btn" aria-label="${this.options.tooltip}">
          ${this.options.icon}
        </button>
      `;
    }

    if (this.options.tooltip) {
      const tooltip = document.createElement("span");
      tooltip.className = "floating-button-tooltip";
      tooltip.textContent = this.options.tooltip;
      this.element.appendChild(tooltip);

      this.element.addEventListener("mouseenter", () => {
        tooltip.style.opacity = "1";
        tooltip.style.transform = "translateY(0)";
      });

      this.element.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
        tooltip.style.transform = "translateY(10px)";
      });
    }

    const buttonElement = this.element.querySelector(
      ".floating-button-link, .floating-button-btn"
    );
    if (buttonElement) {
      buttonElement.style.backgroundColor = this.options.color;
    }

    if (this.options.onClick) {
      this.element
        .querySelector(".floating-button-link, .floating-button-btn")
        .addEventListener("click", this.options.onClick);
    }

    document.body.appendChild(this.element);

    this._hashChangeHandler = () => this.remove();

    window.addEventListener("hashchange", this._hashChangeHandler);
  }

  remove() {
    if (this.element && document.body.contains(this.element)) {
      document.body.removeChild(this.element);
    }

    if (this._hashChangeHandler) {
      window.removeEventListener("hashchange", this._hashChangeHandler);
      this._hashChangeHandler = null;
    }
  }
}
