export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.showOnlineNotification();
      this.syncOfflineData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.showOfflineNotification();
    });
  }

  showOfflineNotification() {
    const notification = document.createElement("div");
    notification.id = "offline-notification";
    notification.className = "offline-notification";
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-wifi-slash"></i>
        <span>Mode Offline - Fitur terbatas tersedia</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    const existingNotification = document.getElementById(
      "offline-notification"
    );
    if (existingNotification) {
      existingNotification.remove();
    }

    document.body.appendChild(notification);

    // Auto hide after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  showOnlineNotification() {
    const notification = document.createElement("div");
    notification.className = "online-notification";
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-wifi"></i>
        <span>Kembali Online - Menyinkronkan data...</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }

  async handleOfflineForm(formData) {
    if (this.isOnline) {
      return this.submitForm(formData);
    }

    this.offlineQueue.push({
      type: "form",
      data: formData,
      timestamp: Date.now(),
    });

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active.postMessage({
        type: "STORE_OFFLINE_FORM",
        payload: formData,
      });
    }

    this.showOfflineFormNotification();
    return { success: true, offline: true };
  }

  showOfflineFormNotification() {
    const notification = document.createElement("div");
    notification.className = "offline-form-notification";
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-cloud-upload-alt"></i>
        <span>Data disimpan offline - akan dikirim saat online</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 4000);
  }

  async syncOfflineData() {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    const itemsToSync = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of itemsToSync) {
      try {
        await this.submitForm(item.data);
        console.log("Synced offline item:", item.data);
      } catch (error) {
        console.error("Failed to sync offline item:", error);
        this.offlineQueue.push(item);
      }
    }
  }

  async submitForm(formData) {
    const response = await fetch("/api/stories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${formData.token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  getOfflineStories() {
    return [
      {
        id: "offline-1",
        name: "Offline Story",
        description:
          "This story is available offline. You can view cached stories when offline.",
        photoUrl: "/favicon-192.png",
        createdAt: new Date().toISOString(),
        lat: null,
        lon: null,
      },
    ];
  }

  isOffline() {
    return !this.isOnline;
  }
}

export function injectOfflineCSS() {
  const style = document.createElement("style");
  style.textContent = `
    .offline-notification,
    .online-notification,
    .offline-form-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #333;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 350px;
      animation: slideIn 0.3s ease-out;
    }

    .offline-notification {
      background: #f44336;
    }

    .online-notification {
      background: #4caf50;
    }

    .offline-form-notification {
      background: #ff9800;
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .notification-content i {
      font-size: 18px;
    }

    .notification-content button {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      margin-left: auto;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;

  document.head.appendChild(style);
}

export function initOfflineManager() {
  injectOfflineCSS();
  return new OfflineManager();
}
