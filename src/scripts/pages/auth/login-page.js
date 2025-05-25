import AuthModel from "../../data/auth-model.js";
import LoginPresenter from "../../presenter/login-presenter.js";
import { debugLog } from "../../utils";

export default class LoginPage {
  constructor() {
    this._authModel = new AuthModel();
    this._presenter = new LoginPresenter({
      view: this,
      model: this._authModel,
    });
  }

  async render() {
    return `
      <section id="content" class="container" tabindex="-1">
        <h1 class="page-title">Login</h1>
        
        <div class="form-container">
          <div id="login-alert" class="alert" style="display: none;"></div>
          
          <form id="login-form">
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input 
                type="email" 
                id="email" 
                class="form-input" 
                placeholder="Masukkan email" 
                required
              >
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input 
                type="password" 
                id="password" 
                class="form-input" 
                placeholder="Masukkan password" 
                required
              >
            </div>
            
            <div class="form-check" style="margin-bottom: 15px;">
              <input type="checkbox" id="remember-me" class="form-check-input">
              <label for="remember-me" class="form-check-label">Ingat saya</label>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" id="login-button">
              Login
            </button>
          </form>
          
          <p style="margin-top: 20px; text-align: center;">
            Belum punya akun? <a href="#/register">Daftar sekarang</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (this._presenter.checkLoginStatus()) {
      return;
    }

    const loginForm = document.getElementById("login-form");

    document.getElementById("email").focus();

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const rememberMe = document.getElementById("remember-me").checked;

      debugLog("Login attempt", { email, rememberMe });

      await this._presenter.login({
        email,
        password,
        rememberMe,
      });
    });
  }

  showLoading() {
    const loginButton = document.getElementById("login-button");
    loginButton._originalText = loginButton.textContent;
    loginButton.textContent = "Loading...";
    loginButton.disabled = true;
  }

  hideLoading() {
    const loginButton = document.getElementById("login-button");

    if (loginButton && loginButton._originalText) {
      loginButton.textContent = loginButton._originalText;
      loginButton.disabled = false;
    }
  }

  showSuccessMessage(message) {
    const loginAlert = document.getElementById("login-alert");

    if (loginAlert) {
      loginAlert.className = "alert alert-success";
      loginAlert.textContent = message;
      loginAlert.style.display = "block";
    }
  }

  showErrorMessage(message) {
    const loginAlert = document.getElementById("login-alert");

    if (loginAlert) {
      loginAlert.className = "alert alert-error";
      loginAlert.textContent = message;
      loginAlert.style.display = "block";
    }
  }

  redirectToHome() {
    window.location.hash = "#/";
  }
}
