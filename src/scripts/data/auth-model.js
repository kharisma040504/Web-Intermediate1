import { login, register } from './api';
import { debugLog } from '../utils';

class AuthModel {
  async login(credentials) {
    try {
      const response = await login(credentials);
      if (response.error) {
        throw new Error(response.message || 'Login gagal');
      }
      return response;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await register(userData);
      if (response.error) {
        throw new Error(response.message || 'Registrasi gagal');
      }
      return response;
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }
}

export default AuthModel;