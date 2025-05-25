import { isUserLoggedIn, debugLog } from '../utils';

class RegisterPresenter {
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

  validatePassword(password, passwordConfirm) {
    if (password !== passwordConfirm) {
      return 'Password dan konfirmasi password tidak sama';
    }
    
    if (password.length < 8) {
      return 'Password harus minimal 8 karakter';
    }
    
    return null;
  }

  async register({ name, email, password, passwordConfirm }) {
    try {
      this._view.showLoading();
      
      const passwordError = this.validatePassword(password, passwordConfirm);
      if (passwordError) {
        throw new Error(passwordError);
      }
      
      const response = await this._model.register({ name, email, password });
      
      this._view.showSuccessMessage('Registrasi berhasil. Silakan login.');
      
      setTimeout(() => {
        this._view.redirectToLogin();
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Register error:', error);
      this._view.showErrorMessage(error.message || 'Terjadi kesalahan saat pendaftaran');
      
      return false;
    } finally {
      this._view.hideLoading();
    }
  }
}

export default RegisterPresenter;