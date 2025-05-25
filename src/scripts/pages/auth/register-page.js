import AuthModel from "../../data/auth-model.js";
import RegisterPresenter from "../../presenter/register-presenter.js";
import { debugLog } from "../../utils";

export default class RegisterPage {
  constructor() {
    this._authModel = new AuthModel();
    this._presenter = new RegisterPresenter({
      view: this,
      model: this._authModel,
    });
  }

  async render() {
    return `
      <section id="content" class="container" tabindex="-1">
        <h1 class="page-title">Daftar Akun</h1>
        
        <div class="form-container">
          <div id="register-alert" class="alert" style="display: none;"></div>
          
          <form id="register-form">
            <div class="form-group">
              <label for="name" class="form-label">Nama</label>
              <input 
                type="text" 
                id="name" 
                class="form-input" 
                placeholder="Masukkan nama" 
                required
              >
            </div>
            
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
                placeholder="Minimal 8 karakter" 
                minlength="8"
                required
              >
            </div>
            
            <div class="form-group">
              <label for="password-confirm" class="form-label">Konfirmasi Password</label>
              <input 
                type="password" 
                id="password-confirm" 
                class="form-input" 
                placeholder="Konfirmasi password" 
                minlength="8"
                required
              >
            </div>
            
            <button type="submit" class="btn btn-block" id="register-button">
              Daftar
            </button>
          </form>
          
          <p style="margin-top: 20px; text-align: center;">
            Sudah punya akun? <a href="#/login">Login</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    if (this._presenter.checkLoginStatus()) {
      return;
    }

    const registerForm = document.getElementById("register-form");
    const password = document.getElementById("password");
    const passwordConfirm = document.getElementById("password-confirm");

    document.getElementById("name").focus();

    function validatePassword() {
      if (password.value !== passwordConfirm.value) {
        passwordConfirm.setCustomValidity(
          "Password dan konfirmasi password tidak sama"
        );
      } else {
        passwordConfirm.setCustomValidity("");
      }
    }

    password.addEventListener("change", validatePassword);
    passwordConfirm.addEventListener("keyup", validatePassword);

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("password-confirm").value;

      debugLog("Register attempt", { name, email });

      await this._presenter.register({
        name,
        email,
        password,
        passwordConfirm,
      });
    });
  }

  showLoading() {
    const registerButton = document.getElementById("register-button");
    const originalButtonText = registerButton.textContent;
    registerButton.textContent = "Loading...";
    registerButton.disabled = true;
    registerButton._originalText = originalButtonText;
  }

  hideLoading() {
    const registerButton = document.getElementById("register-button");

    if (registerButton && registerButton._originalText) {
      registerButton.textContent = registerButton._originalText;
      registerButton.disabled = false;
    }
  }

  showSuccessMessage(message) {
    const registerAlert = document.getElementById("register-alert");

    if (registerAlert) {
      registerAlert.className = "alert alert-success";
      registerAlert.textContent = message;
      registerAlert.style.display = "block";
    }
  }

  showErrorMessage(message) {
    const registerAlert = document.getElementById("register-alert");

    if (registerAlert) {
      registerAlert.className = "alert alert-error";
      registerAlert.textContent = message;
      registerAlert.style.display = "block";

      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  redirectToHome() {
    window.location.hash = "#/";
  }

  redirectToLogin() {
    window.location.hash = "#/login";
  }
}
