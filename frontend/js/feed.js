document.addEventListener('DOMContentLoaded', () => {
  if (!IG.requireAuth()) {
    return;
  }

  const postsContainer = document.getElementById('postsContainer');
  const feedStatus = document.getElementById('feedStatus');

  function renderPost(post) {
    const username = IG.escapeHTML(post.username);
    const caption = IG.escapeHTML(post.caption || '');

    return `
      <article class="post-card" data-post-id="${post.id}">
        <header class="post-header">
          <span class="avatar">${IG.avatarLetter(post.username)}</span>
          <a href="profile.html?user=${encodeURIComponent(post.username)}"><strong>@${username}</strong></a>
        </header>
        <img class="post-image" src="${IG.imageUrl(post.image_url)}" alt="Post by ${username}">
        <div class="post-body">
          <div class="post-actions">
            <button class="icon-button like-button ${post.is_liked ? 'is-liked' : ''}" type="button" data-id="${post.id}" aria-label="Toggle like">&#9829;</button>
            <strong><span class="like-count">${post.like_count}</span> likes</strong>
          </div>
          <p class="caption"><a href="profile.html?user=${encodeURIComponent(post.username)}">@${username}</a> ${caption}</p>
          <button class="comments-toggle" type="button" data-id="${post.id}">View comments (<span class="comment-count">${post.comment_count}</span>)</button>
          <div class="comments-list" data-comments-for="${post.id}" hidden></div>
          <form class="comment-form" data-id="${post.id}">
            <input name="text" type="text" placeholder="Add a comment..." autocomplete="off" required>
            <button class="secondary-button" type="submit">Post</button>
          </form>
        </div>
      </article>
    `;
  }

  function renderPosts(posts) {
    if (!posts.length) {
      postsContainer.innerHTML = '<div class="empty-state">No posts yet. Follow users or upload your first post.</div>';
      IG.setMessage(feedStatus, '');
      return;
    }

    postsContainer.innerHTML = posts.map(renderPost).join('');
    IG.setMessage(feedStatus, '');
  }

  async function loadFeed() {
    try {
      IG.setMessage(feedStatus, 'Loading posts...');
      const data = await IG.request('/api/posts/feed');
      renderPosts(data.posts || []);
    } catch (error) {
      IG.setMessage(feedStatus, error.message, 'error');
    }
  }

  async function loadComments(postId) {
    const list = document.querySelector(`[data-comments-for="${postId}"]`);

    if (!list) {
      return;
    }

    list.hidden = false;
    list.innerHTML = '<p class="muted">Loading comments...</p>';

    try {
      const data = await IG.request(`/api/interactions/comments/${postId}`, { auth: false });
      const comments = data.comments || [];

      if (!comments.length) {
        list.innerHTML = '<p class="muted">No comments yet.</p>';
        return;
      }

      list.innerHTML = comments.map((comment) => `
        <div class="comment-row">
          <strong>@${IG.escapeHTML(comment.username)}</strong>
          <p>${IG.escapeHTML(comment.text)}</p>
        </div>
      `).join('');
    } catch (error) {
      list.innerHTML = `<p class="form-message error">${IG.escapeHTML(error.message)}</p>`;
    }
  }

  postsContainer.addEventListener('click', async (event) => {
    const likeButton = event.target.closest('.like-button');
    const commentsButton = event.target.closest('.comments-toggle');

    if (likeButton) {
      const postId = likeButton.dataset.id;
      const card = likeButton.closest('.post-card');

      try {
        const data = await IG.request(`/api/interactions/like/${postId}`, { method: 'POST' });
        likeButton.classList.toggle('is-liked', data.liked);
        card.querySelector('.like-count').textContent = data.like_count;
      } catch (error) {
        IG.setMessage(feedStatus, error.message, 'error');
      }
    }

    if (commentsButton) {
      const postId = commentsButton.dataset.id;
      await loadComments(postId);
    }
  });

  postsContainer.addEventListener('submit', async (event) => {
    const form = event.target.closest('.comment-form');

    if (!form) {
      return;
    }

    event.preventDefault();
    const postId = form.dataset.id;
    const input = form.elements.text;
    const text = input.value.trim();

    if (!text) {
      return;
    }

    try {
      await IG.request(`/api/interactions/comment/${postId}`, {
        method: 'POST',
        body: { text }
      });

      input.value = '';
      const card = form.closest('.post-card');
      const count = card.querySelector('.comment-count');
      count.textContent = Number(count.textContent) + 1;
      await loadComments(postId);
    } catch (error) {
      IG.setMessage(feedStatus, error.message, 'error');
    }
  });

  loadFeed();
});
