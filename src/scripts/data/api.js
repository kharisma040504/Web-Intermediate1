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
      return {
        error: true,
        message:
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
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
    if (error.name === "AbortError") {
      return {
        error: true,
        message:
          "Permintaan timeout. Mungkin ukuran foto terlalu besar atau koneksi lambat.",
      };
    } else if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      return {
        error: true,
        message:
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
      };
    }

    console.error("Error menambahkan cerita:", error);
    return {
      error: true,
      message: error.message || "Gagal menambahkan cerita. Silakan coba lagi.",
    };
  }
};
