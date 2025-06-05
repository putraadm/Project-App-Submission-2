import LikedPresenter from './liked-presenter';

export default class LikedPage {
  constructor() {
    this.presenter = new LikedPresenter({ view: this });
  }

  async render() {
    return `
      <section class="container">
        <h1>Halaman Data yang Disukai</h1>
        <div id="liked-story-list" style="display: flex; flex-wrap: wrap; gap: 1rem;"></div>
      </section>
    `;
  }

  async afterRender() {
    this.likedStoryList = document.getElementById('liked-story-list');
    await this.presenter.init();

    this.likedStoryList.addEventListener('click', async (event) => {
      if (event.target.classList.contains('delete-liked-button')) {
        const storyId = event.target.dataset.id;
        if (storyId) {
          await this.presenter.deleteLikedStory(storyId);
        }
      }
    });
  }

  showLikedStories(stories) {
    if (stories.length === 0) {
      this.likedStoryList.innerHTML = '<p>Tidak ada data yang disukai.</p>';
      return;
    }

    this.likedStoryList.innerHTML = stories.map(story => `
      <div class="story-item" style="flex: 1 1 300px; border: 1px solid #ccc; padding: 1rem; border-radius: 8px;">
        <img src="${story.photoUrl}" alt="${story.description || 'Story image'}" style="width: 100%; height: auto; border-radius: 4px;" />
        <p><strong>Description:</strong> ${story.description || '-'}</p>
        <p><strong>Created At:</strong> ${new Date(story.createdAt).toLocaleString()}</p>
        <button class="delete-liked-button" data-id="${story.id}" style="background-color: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Hapus</button>
      </div>
    `).join('');
  }

  showError(message) {
    this.likedStoryList.innerHTML = `<p>${message}</p>`;
  }
}
