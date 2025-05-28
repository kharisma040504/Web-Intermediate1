import CONFIG from "../config";
import { getAuthorizationHeader, getUserData } from "../utils";

export const login = async (loginData) => {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    console.error("Error pada login:", error);
    return {
      error: true,
      message:
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
    };
  }
};

export const register = async (registerData) => {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });

    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    console.error("Error pada register:", error);
    return {
      error: true,
      message:
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
    };
  }
};

export const getAllStories = async ({
  page = 1,
  size = 10,
  location = 0,
} = {}) => {
  try {
    let url = `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}`;

    if (location) {
      url += "&location=1";
    }

    const headers = getAuthorizationHeader();

    const response = await fetch(url, {
      headers,
    });

    const responseJson = await response.json();

    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  } catch (error) {
    console.error("Error mendapatkan cerita:", error);

    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      console.log("Offline mode: Loading cached stories");

      if ("caches" in window) {
        try {
          const cache = await caches.open("stories-cache");
          const keys = await cache.keys();

          for (const request of keys) {
            if (request.url.includes("/stories")) {
              const response = await cache.match(request);
              if (response) {
                const data = await response.json();
                console.log("Loaded stories from cache");
                return data;
              }
            }
          }
        } catch (cacheError) {
          console.log("Cache error:", cacheError);
        }
      }

      return {
        error: false,
        message: "success",
        listStory: [
          {
            id: "offline-1",
            name: "Story Offline",
            description:
              "Ini adalah story yang tersedia secara offline. Anda dapat melihat story yang telah di-cache saat offline.",
            photoUrl: "/favicon-192.png",
            createdAt: new Date().toISOString(),
            lat: -6.2088,
            lon: 106.8456,
          },
          {
            id: "offline-2",
            name: "Story Demo",
            description:
              "Story demo untuk mode offline. Semua fitur aplikasi tetap berfungsi.",
            photoUrl: "/favicon-512.png",
            createdAt: new Date().toISOString(),
            lat: -6.1751,
            lon: 106.865,
          },
          {
            id: "offline-3",
            name: "Offline Content",
            description:
              "Konten offline tersedia untuk memastikan aplikasi tetap berfungsi tanpa koneksi internet.",
            photoUrl: "/favicon.png",
            createdAt: new Date().toISOString(),
            lat: -6.2615,
            lon: 106.781,
          },
        ],
      };
    }

    return {
      error: true,
      message:
        error.message ||
        "Terjadi kesalahan saat memuat cerita. Periksa koneksi internet Anda.",
    };
  }
};

export const getStoryDetail = async (id) => {
  try {
    const headers = getAuthorizationHeader();

    const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
      headers,
    });

    const responseJson = await response.json();
    return responseJson;
  } catch (error) {
    console.error("Error mendapatkan detail cerita:", error);

    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      console.log("Offline mode: Loading cached story detail");

      if ("caches" in window) {
        try {
          const cache = await caches.open("story-details-cache");
          const response = await cache.match(
            `${CONFIG.BASE_URL}/stories/${id}`
          );
          if (response) {
            const data = await response.json();
            console.log("Loaded story detail from cache");
            return data;
          }
        } catch (cacheError) {
          console.log("Cache error:", cacheError);
        }
      }

      const offlineStories = {
        "offline-1": {
          id: "offline-1",
          name: "Story Offline",
          description:
            "Detail story ini tersedia secara offline. Semua fitur aplikasi tetap berfungsi dalam mode offline. Anda dapat tetap menjelajahi aplikasi dan melihat konten yang telah di-cache sebelumnya.",
          photoUrl: "/favicon-192.png",
          createdAt: new Date().toISOString(),
          lat: -6.2088,
          lon: 106.8456,
        },
        "offline-2": {
          id: "offline-2",
          name: "Story Demo",
          description:
            "Story demo yang menunjukkan bagaimana aplikasi tetap berfungsi saat offline. Progressive Web App memungkinkan pengalaman yang seamless bahkan tanpa koneksi internet.",
          photoUrl: "/favicon-512.png",
          createdAt: new Date().toISOString(),
          lat: -6.1751,
          lon: 106.865,
        },
        "offline-3": {
          id: "offline-3",
          name: "Offline Content",
          description:
            "Konten offline yang tersedia untuk memastikan aplikasi tetap berfungsi. Service Worker dan caching memungkinkan akses ke konten bahkan saat tidak ada koneksi internet.",
          photoUrl: "/favicon.png",
          createdAt: new Date().toISOString(),
          lat: -6.2615,
          lon: 106.781,
        },
      };

      return {
        error: false,
        message: "success",
        story: offlineStories[id] || offlineStories["offline-1"],
      };
    }

    return {
      error: true,
      message: "Terjadi kesalahan saat memuat detail cerita.",
    };
  }
};

export const addStory = async (formData) => {
  try {
    const userData = getUserData();

    if (!userData || !userData.token) {
      throw new Error("Token tidak tersedia. Silakan login terlebih dahulu.");
    }

    console.log("Mengirim cerita dengan data:");
    console.log("- Description tersedia:", formData.has("description"));
    console.log("- Photo tersedia:", formData.has("photo"));
    console.log(
      "- Lokasi tersedia:",
      formData.has("lat") && formData.has("lon")
    );

    const headers = {
      Authorization: `Bearer ${userData.token}`,
    };

    if (!formData.has("description")) {
      throw new Error("Deskripsi cerita tidak boleh kosong");
    }

    if (!formData.has("photo")) {
      throw new Error("Foto tidak boleh kosong");
    }

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Sesi telah berakhir. Silakan login kembali.");
      } else if (response.status === 413) {
        throw new Error("Ukuran foto terlalu besar. Maksimal 1MB.");
      } else if (response.status === 400) {
        throw new Error(
          "Data yang dikirim tidak valid. Pastikan format data sudah benar."
        );
      } else if (response.status === 500) {
        throw new Error(
          "Terjadi kesalahan pada server. Silakan coba lagi nanti."
        );
      }
    }

    const responseJson = await response.json();

    console.log("Response dari API addStory:", responseJson);

    if (responseJson.error) {
      console.error("Error saat menambahkan cerita:", responseJson.message);
      throw new Error(responseJson.message || "Gagal menambahkan cerita.");
    }

    return responseJson;
  } catch (error) {
    console.log("Offline mode: Storing story for later sync");

    if (window.offlineManager) {
      const formDataObj = {};
      for (let [key, value] of formData.entries()) {
        formDataObj[key] = value;
      }
      const userData = getUserData();
      if (userData && userData.token) {
        formDataObj.token = userData.token;
      }

      await window.offlineManager.handleOfflineForm(formDataObj);
    }

    return {
      error: false,
      message: "Story disimpan offline dan akan dikirim saat online kembali",
      offline: true,
    };
  }
};

export const subscribeNotification = async (subscription) => {
  try {
    const userData = getUserData();

    if (!userData || !userData.token) {
      throw new Error("Token tidak tersedia. Silakan login terlebih dahulu.");
    }

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData.token}`,
      },
      body: JSON.stringify(subscription),
    });

    const responseJson = await response.json();

    if (!response.ok || responseJson.error) {
      throw new Error(responseJson.message || "Gagal berlangganan notifikasi");
    }

    return responseJson;
  } catch (error) {
    console.error("Error subscribe notification:", error);
    return {
      error: true,
      message: error.message || "Gagal berlangganan notifikasi",
    };
  }
};

export const unsubscribeNotification = async (endpoint) => {
  try {
    const userData = getUserData();

    if (!userData || !userData.token) {
      throw new Error("Token tidak tersedia. Silakan login terlebih dahulu.");
    }

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData.token}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    const responseJson = await response.json();

    if (!response.ok || responseJson.error) {
      throw new Error(
        responseJson.message || "Gagal berhenti berlangganan notifikasi"
      );
    }

    return responseJson;
  } catch (error) {
    console.error("Error unsubscribe notification:", error);
    return {
      error: true,
      message: error.message || "Gagal berhenti berlangganan notifikasi",
    };
  }
};
