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
        this._view.showSuccessMessage("Cerita berhasil ditambahkan");

        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("Story berhasil dibuat", {
              body: `Anda telah membuat story baru dengan deskripsi: ${description}`,
              icon: "./favicon.png",
              badge: "./favicon.png",
              tag: "story-created",
              requireInteraction: true,
              data: {
                url: "#/",
              },
            });
          } catch (notifError) {
            console.error("Gagal menampilkan notifikasi:", notifError);
          }
        }

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
