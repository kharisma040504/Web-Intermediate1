import {
  isUserLoggedIn,
  saveUserData,
  debugLog,
  showNotification,
  requestNotificationPermission,
  subscribeUserToPush,
} from "../utils";
import { subscribeNotification } from "../data/api";

class LoginPresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  checkLoginStatus() {
    if (isUserLoggedIn()) {
      this._view.redirectToHome();
      return true;
    }
    return false;
  }

  async login({ email, password, rememberMe }) {
    try {
      this._view.showLoading();

      const response = await this._model.login({ email, password });

      if (!response.loginResult || !response.loginResult.token) {
        throw new Error("Token tidak ditemukan dalam respons login");
      }

      saveUserData(response.loginResult, rememberMe);

      await this.initializePushNotificationAfterLogin();

      this._view.showSuccessMessage("Login berhasil. Mengalihkan...");
      showNotification("Berhasil", "Login berhasil", "success");

      setTimeout(() => {
        this._view.redirectToHome();
      }, 1500);

      return true;
    } catch (error) {
      console.error("Login error:", error);
      this._view.showErrorMessage(
        error.message || "Terjadi kesalahan saat login"
      );
      showNotification(
        "Error",
        error.message || "Terjadi kesalahan saat login",
        "error"
      );

      return false;
    } finally {
      this._view.hideLoading();
    }
  }

  async initializePushNotificationAfterLogin() {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.log("Izin notifikasi ditolak");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (!existingSubscription) {
        const subscription = await subscribeUserToPush(registration);

        const subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(
              String.fromCharCode.apply(
                null,
                new Uint8Array(subscription.getKey("p256dh"))
              )
            ),
            auth: btoa(
              String.fromCharCode.apply(
                null,
                new Uint8Array(subscription.getKey("auth"))
              )
            ),
          },
        };

        const response = await subscribeNotification(subscriptionData);
        if (!response.error) {
          console.log("Berhasil berlangganan push notification setelah login");
        }
      }
    } catch (error) {
      console.error("Gagal setup push notification setelah login:", error);
    }
  }
}

export default LoginPresenter;
