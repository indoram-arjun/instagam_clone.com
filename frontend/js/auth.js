document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const message = document.getElementById('authMessage');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      IG.setMessage(message, 'Logging in...');

      const formData = new FormData(loginForm);

      try {
        const data = await IG.request('/api/auth/login', {
          method: 'POST',
          auth: false,
          body: {
            email: formData.get('email'),
            password: formData.get('password')
          }
        });

        IG.saveSession(data.token, data.user);
        window.location.href = 'index.html';
      } catch (error) {
        IG.setMessage(message, error.message, 'error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      IG.setMessage(message, 'Creating account...');

      const formData = new FormData(registerForm);

      try {
        await IG.request('/api/auth/register', {
          method: 'POST',
          auth: false,
          body: {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
          }
        });

        IG.setMessage(message, 'Account created. Redirecting to login...', 'success');
        window.setTimeout(() => {
          window.location.href = 'login.html';
        }, 800);
      } catch (error) {
        IG.setMessage(message, error.message, 'error');
      }
    });
  }
});
