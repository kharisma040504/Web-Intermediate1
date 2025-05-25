import CONFIG from "../config";
import { logger } from "./logger";

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

export function showFormattedDate(
  date,
  locale = CONFIG.DEFAULT_LANGUAGE,
  options = {}
) {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function getUserData() {
  try {
    const userData = JSON.parse(localStorage.getItem("userData") || "null");

    if (userData && userData.expiry && userData.expiry < Date.now()) {
      clearUserData();
      return null;
    }

    return userData;
  } catch (error) {
    debugLog("Error parsing user data from localStorage:", error);
    return null;
  }
}

export function isUserLoggedIn() {
  const userData = getUserData();
  return userData !== null && userData.token !== undefined;
}

export function saveUserData(userData, remember = false) {
  try {
    if (remember) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const dataWithExpiry = {
        ...userData,
        expiry: expiryDate.getTime(),
      };

      localStorage.setItem("userData", JSON.stringify(dataWithExpiry));
    } else {
      localStorage.setItem("userData", JSON.stringify(userData));
    }
  } catch (error) {
    debugLog("Error saving user data to localStorage:", error);
  }
}

export function clearUserData() {
  try {
    localStorage.removeItem("userData");
    window.location.hash = "#/login";
  } catch (error) {
    debugLog("Error clearing user data from localStorage:", error);
  }
}

export function handleLogout() {
  clearUserData();

  showNotification("Berhasil", "Anda telah keluar dari sistem", "success");
}

export function loadMapScript() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }

    fetch("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-cache",
    })
      .then(() => {
        const leafletCSS = document.createElement("link");
        leafletCSS.rel = "stylesheet";
        leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(leafletCSS);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

        script.onload = () => {
          debugLog("Leaflet script loaded successfully");
          resolve(window.L);
        };

        script.onerror = (error) => {
          debugLog("Failed to load Leaflet script:", error);
          reject(
            new Error(
              "Failed to load map library. Please check your internet connection."
            )
          );
        };

        document.head.appendChild(script);
      })
      .catch((error) => {
        debugLog("Failed to fetch Leaflet CSS:", error);
        reject(
          new Error(
            "Failed to load map resources. Please check your internet connection."
          )
        );
      });
  });
}

export function initCamera(videoElement) {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      reject(
        new Error(
          "Browser Anda tidak mendukung penggunaan kamera. Coba gunakan browser modern seperti Chrome, Firefox, atau Edge terbaru."
        )
      );
      return;
    }

    const constraints = {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: "environment",
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement
            .play()
            .then(() => {
              resolve(stream);
            })
            .catch((error) => {
              debugLog("Error playing video:", error);
              reject(new Error("Gagal memulai kamera: " + error.message));
            });
        };

        videoElement.onerror = (error) => {
          debugLog("Video element error:", error);
          reject(
            new Error("Terjadi kesalahan pada elemen video: " + error.message)
          );
        };
      })
      .catch((error) => {
        debugLog("getUserMedia error:", error);

        let errorMessage = "Gagal mengakses kamera: ";

        switch (error.name) {
          case "NotAllowedError":
            errorMessage +=
              "Izin kamera ditolak. Harap berikan izin kamera di pengaturan browser Anda.";
            break;
          case "NotFoundError":
            errorMessage +=
              "Tidak ada kamera yang ditemukan pada perangkat Anda.";
            break;
          case "NotReadableError":
            errorMessage += "Kamera sedang digunakan oleh aplikasi lain.";
            break;
          case "OverconstrainedError":
            errorMessage += "Kamera tidak mendukung kualitas yang diminta.";
            break;
          case "AbortError":
            errorMessage += "Akses kamera dibatalkan.";
            break;
          default:
            errorMessage += error.message || "Error tidak diketahui.";
        }

        reject(new Error(errorMessage));
      });
  });
}

export function captureImage(videoElement, canvasElement) {
  const canvas = canvasElement;
  const context = canvas.getContext("2d");

  try {
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Gagal mengambil gambar. Silakan coba lagi."));
          }
        },
        "image/jpeg",
        0.8
      );
    });
  } catch (error) {
    debugLog("Error capturing image:", error);
    return Promise.reject(
      new Error("Gagal mengambil gambar: " + error.message)
    );
  }
}

export function stopCamera(stream) {
  if (stream) {
    try {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      debugLog("Camera stopped successfully");
    } catch (error) {
      debugLog("Error stopping camera:", error);
    }
  }
}

export function checkBrowserSupport() {
  const support = {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    geolocation: !!navigator.geolocation,
    localStorage: !!window.localStorage,
    viewTransition: !!document.startViewTransition,
  };

  const unsupported = Object.entries(support)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);

  return {
    fullSupport: unsupported.length === 0,
    support,
    unsupported,
  };
}

export function debugLog(...args) {
  if (CONFIG.DEBUG_MODE) {
    console.log("[DEBUG]", ...args);
  }
}

export function showNotification(title, message, type = "success") {
  alert(`${title}: ${message}`);
}

export function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.match("image.*")) {
      reject(new Error("File harus berupa gambar (jpg, png, gif, dll)"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 1600;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          } else {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              blob.name = file.name || "photo.jpg";
              resolve(blob);
            } else {
              reject(new Error("Gagal memproses gambar"));
            }
          },
          "image/jpeg",
          0.85
        );
      };

      img.onerror = () => {
        reject(new Error("Gagal memuat gambar"));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file gambar"));
    };

    reader.readAsDataURL(file);
  });
}

export function handleGalleryFile(fileInputElement, previewImageElement) {
  return new Promise((resolve, reject) => {
    try {
      if (
        !fileInputElement ||
        !fileInputElement.files ||
        fileInputElement.files.length === 0
      ) {
        reject(new Error("Tidak ada file yang dipilih"));
        return;
      }

      const file = fileInputElement.files[0];

      if (!file.type.match("image.*")) {
        reject(new Error("File harus berupa gambar (jpg, png, gif, dll)"));
        return;
      }

      processImageFile(file)
        .then((blob) => {
          if (previewImageElement) {
            const imageUrl = URL.createObjectURL(blob);
            previewImageElement.src = imageUrl;
            previewImageElement.style.display = "block";
            previewImageElement.onload = () => {
              URL.revokeObjectURL(imageUrl);
            };
          }

          resolve(blob);
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(new Error(`Gagal memproses file dari galeri: ${error.message}`));
    }
  });
}

export function getAuthorizationHeader() {
  try {
    const userData = getUserData();

    if (!userData || !userData.token) {
      throw new Error("Token tidak tersedia");
    }

    return {
      Authorization: `Bearer ${userData.token}`,
    };
  } catch (error) {
    debugLog("Error mendapatkan header otorisasi:", error);
    throw error;
  }
}

export function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Browser tidak mendukung notifikasi');
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function subscribeUserToPush(registration) {
  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
  };

  const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
  return pushSubscription;
}

export async function checkSubscriptionStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

export function createNotificationButton() {
  const existingButton = document.getElementById('notification-toggle-btn');
  if (existingButton) {
    existingButton.remove();
  }

  const button = document.createElement('button');
  button.id = 'notification-toggle-btn';
  button.className = 'notification-toggle-btn';
  button.setAttribute('aria-label', 'Toggle Push Notifications');
  
  updateNotificationButtonState(button);
  
  button.addEventListener('click', handleNotificationToggle);
  
  const header = document.querySelector('header .main-header');
  if (header) {
    header.appendChild(button);
  }
  
  return button;
}

async function updateNotificationButtonState(button) {
  try {
    const isSubscribed = await checkSubscriptionStatus();
    const userData = getUserData();
    
    if (!userData || !userData.token) {
      button.style.display = 'none';
      return;
    }
    
    button.style.display = 'block';
    
    if (isSubscribed) {
      button.innerHTML = '<i class="fas fa-bell-slash"></i> Matikan Notifikasi';
      button.className = 'notification-toggle-btn subscribed';
      button.title = 'Klik untuk mematikan notifikasi';
    } else {
      button.innerHTML = '<i class="fas fa-bell"></i> Aktifkan Notifikasi';
      button.className = 'notification-toggle-btn unsubscribed';
      button.title = 'Klik untuk mengaktifkan notifikasi';
    }
  } catch (error) {
    console.error('Error updating button state:', error);
  }
}

async function handleNotificationToggle(event) {
  event.preventDefault();
  const button = event.target.closest('button');
  
  try {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    const isSubscribed = await checkSubscriptionStatus();
    const userData = getUserData();
    
    if (!userData || !userData.token) {
      showNotification('Error', 'Harap login terlebih dahulu', 'error');
      return;
    }
    
    if (isSubscribed) {
      await unsubscribeFromNotifications();
      showNotification('Berhasil', 'Notifikasi berhasil dimatikan', 'success');
    } else {
      await subscribeToNotifications();
      showNotification('Berhasil', 'Notifikasi berhasil diaktifkan', 'success');
    }
    
    await updateNotificationButtonState(button);
    
  } catch (error) {
    console.error('Error toggling notification:', error);
    showNotification('Error', error.message || 'Terjadi kesalahan', 'error');
    await updateNotificationButtonState(button);
  } finally {
    button.disabled = false;
  }
}

async function subscribeToNotifications() {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    throw new Error('Izin notifikasi ditolak. Harap aktifkan di pengaturan browser.');
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await subscribeUserToPush(registration);
  
  const subscriptionData = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
      auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
    }
  };

  const { subscribeNotification } = await import('../data/api');
  const response = await subscribeNotification(subscriptionData);
  
  if (response.error) {
    throw new Error(response.message || 'Gagal berlangganan notifikasi');
  }
}

async function unsubscribeFromNotifications() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    const { unsubscribeNotification } = await import('../data/api');
    const response = await unsubscribeNotification(subscription.endpoint);
    
    if (response.error) {
      throw new Error(response.message || 'Gagal berhenti berlangganan notifikasi');
    }
    
    await subscription.unsubscribe();
  }
}

export { logger };