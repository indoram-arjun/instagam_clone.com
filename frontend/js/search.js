document.addEventListener('DOMContentLoaded', () => {
  if (!IG.requireAuth()) {
    return;
  }

  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  const status = document.getElementById('searchStatus');
  let timer = null;

  function renderUsers(users) {
    if (!users.length) {
      results.innerHTML = '<div class="empty-state">No users found.</div>';
      return;
    }

    results.innerHTML = users.map((user) => `
      <article class="user-card">
        <span class="avatar">${IG.avatarLetter(user.username)}</span>
        <div>
          <a href="profile.html?user=${encodeURIComponent(user.username)}">@${IG.escapeHTML(user.username)}</a>
          <p class="muted">${IG.escapeHTML(user.bio || 'No bio added yet.')}</p>
        </div>
      </article>
    `).join('');
  }

  async function searchUsers() {
    const query = input.value.trim();

    if (!query) {
      results.innerHTML = '<div class="empty-state">Type a username to search.</div>';
      IG.setMessage(status, '');
      return;
    }

    try {
      IG.setMessage(status, 'Searching...');
      const data = await IG.request(`/api/users/search?q=${encodeURIComponent(query)}`, { auth: false });
      renderUsers(data.users || []);
      IG.setMessage(status, '');
    } catch (error) {
      IG.setMessage(status, error.message, 'error');
    }
  }

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(searchUsers, 250);
  });

  results.innerHTML = '<div class="empty-state">Type a username to search.</div>';
});
