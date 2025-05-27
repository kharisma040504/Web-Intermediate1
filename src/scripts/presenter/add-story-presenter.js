import { debugLog, showNotification } from "../utils";

class AddStoryPresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  async addStory(formData) {
    try {
      this._view.showLoading();

      let description, photo;

      if (formData instanceof FormData) {
        description = formData.get("description");
        photo = formData.get("photo");
      } else {
        description = formData.description;
        photo = formData.photo;
      }

      if (
        !description ||
        (typeof description === "string" && description.trim() === "")
      ) {
        throw new Error("Deskripsi cerita tidak boleh kosong");
      }

      if (!photo) {
        throw new Error("Silakan ambil atau pilih foto terlebih dahulu");
      }

      debugLog("Mengirim data cerita dengan valid data");

      const response = await this._model.addStory(formData);

      if (!response.error) {
        await this._sendPushNotification(description);
        return true;
      } else {
        throw new Error(response.message || "Gagal menambahkan cerita");
      }
    } catch (error) {
      debugLog("Error adding story:", error);
      this._view.showErrorMessage(error.message);
      showNotification("Error", error.message, "error");
      return false;
    } finally {
      this._view.hideLoading();
    }
  }

  async _sendPushNotification(description) {
    try {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          const notificationData = {
            title: "Story berhasil dibuat",
            options: {
              body: `Anda telah membuat story baru dengan deskripsi: ${description.substring(
                0,
                100
              )}${description.length > 100 ? "..." : ""}`,
              icon: "./favicon.png",
              badge: "./favicon.png",
              tag: "story-created",
              requireInteraction: false,
              silent: false,
              data: {
                url: "#/",
              },
            },
          };

          if (registration.active) {
            registration.active.postMessage({
              type: "SHOW_NOTIFICATION",
              payload: notificationData,
            });
          }
          debugLog("Push notification sent successfully");
        } else {
          debugLog("User not subscribed to push notifications");
        }
      } else {
        debugLog("Push notifications not supported");
      }
    } catch (error) {
      debugLog("Error sending push notification:", error);
    }
  }

  async initMap() {
    try {
      await this._view.initMap();
    } catch (error) {
      debugLog("Map initialization error:", error);
      this._view.handleMapError(error);
    }
  }

  updateMarker(lat, lng) {
    this._view.updateMarker(lat, lng);
  }

  getCurrentLocation() {
    this._view.getCurrentLocation();
  }

  resetMapMarker() {
    this._view.resetMapMarker();
  }
}

export default AddStoryPresenter;
