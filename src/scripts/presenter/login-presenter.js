import { isUserLoggedIn, saveUserData, debugLog, showNotification } from '../utils';

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
        throw new Error('Token tidak ditemukan dalam respons login');
      }

      saveUserData(response.loginResult, rememberMe);
      
      this._view.showSuccessMessage('Login berhasil. Mengalihkan...');
      showNotification('Berhasil', 'Login berhasil', 'success');
      
      setTimeout(() => {
        this._view.redirectToHome();
      }, 1500);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      this._view.showErrorMessage(error.message || 'Terjadi kesalahan saat login');
      showNotification('Error', error.message || 'Terjadi kesalahan saat login', 'error');
      
      return false;
    } finally {
      this._view.hideLoading();
    }
  }
}

export default LoginPresenter;