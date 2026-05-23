document.addEventListener('DOMContentLoaded', () => {
  if (!IG.requireAuth()) {
    return;
  }

  const profileHeader = document.getElementById('profileHeader');
  const profilePosts = document.getElementById('profilePosts');
  const profileStatus = document.getElementById('profileStatus');
  const params = new URLSearchParams(window.location.search);
  const currentUser = IG.getUser();
  const username = params.get('user') || (currentUser && currentUser.username);

  if (!username) {
    window.location.href = 'login.html';
    return;
  }

  function renderHeader(user) {
    profileHeader.innerHTML = `
      <span class="avatar large">${IG.avatarLetter(user.username)}</span>
      <div>
        <h1>@${IG.escapeHTML(user.username)}</h1>
        <p class="muted">${IG.escapeHTML(user.bio || 'No bio added yet.')}</p>
        <div class="profile-meta">
          <span><strong>${user.post_count}</strong> posts</span>
          <span><strong id="followersCount">${user.followers_count}</strong> followers</span>
          <span><strong>${user.following_count}</strong> following</span>
        </div>
        ${user.is_own_profile ? '' : `<button id="followButton" class="primary-button compact" type="button" data-id="${user.id}" data-following="${user.is_following}">${user.is_following ? 'Unfollow' : 'Follow'}</button>`}
      </div>
    `;
  }

  function renderPosts(posts) {
    if (!posts.length) {
      profilePosts.innerHTML = '<div class="empty-state">No posts to show.</div>';
      return;
    }

    profilePosts.innerHTML = posts.map((post) => `
      <a class="profile-post" href="index.html" title="${IG.escapeHTML(post.caption || 'Post')}">
        <img src="${IG.imageUrl(post.image_url)}" alt="Post by ${IG.escapeHTML(post.username)}">
        <span>${post.like_count} likes</span>
      </a>
    `).join('');
  }

  async function loadProfile() {
    try {
      const profileData = await IG.request(`/api/users/${encodeURIComponent(username)}`);
      renderHeader(profileData.user);

      const postsData = await IG.request(`/api/users/${encodeURIComponent(username)}/posts`);
      renderPosts(postsData.posts || []);
      IG.setMessage(profileStatus, '');
    } catch (error) {
      profileHeader.innerHTML = `<p class="page-message error">${IG.escapeHTML(error.message)}</p>`;
      profilePosts.innerHTML = '';
    }
  }

  profileHeader.addEventListener('click', async (event) => {
    const button = event.target.closest('#followButton');

    if (!button) {
      return;
    }

    const targetId = button.dataset.id;
    const isFollowing = button.dataset.following === 'true';
    const endpoint = isFollowing ? 'unfollow' : 'follow';

    try {
      button.disabled = true;
      const data = await IG.request(`/api/users/${endpoint}/${targetId}`, { method: 'POST' });
      button.dataset.following = String(data.is_following);
      button.textContent = data.is_following ? 'Unfollow' : 'Follow';
      document.getElementById('followersCount').textContent = data.followers_count;
    } catch (error) {
      IG.setMessage(profileStatus, error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });

  loadProfile();
});
