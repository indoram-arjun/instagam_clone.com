document.addEventListener('DOMContentLoaded', () => {
  if (!IG.requireAuth()) {
    return;
  }

  const uploadForm = document.getElementById('uploadForm');
  const imageInput = document.getElementById('image');
  const preview = document.getElementById('imagePreview');
  const message = document.getElementById('uploadMessage');

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];

    if (!file) {
      preview.classList.remove('has-image');
      preview.innerHTML = '';
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      preview.classList.add('has-image');
      preview.innerHTML = `<img src="${reader.result}" alt="Selected upload preview">`;
    });
    reader.readAsDataURL(file);
  });

  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    IG.setMessage(message, 'Uploading post...');

    const formData = new FormData(uploadForm);

    try {
      await IG.request('/api/posts/upload', {
        method: 'POST',
        body: formData
      });

      IG.setMessage(message, 'Post uploaded. Redirecting...', 'success');
      window.setTimeout(() => {
        window.location.href = 'index.html';
      }, 700);
    } catch (error) {
      IG.setMessage(message, error.message, 'error');
    }
  });
});
