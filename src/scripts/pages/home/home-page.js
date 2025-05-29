import HomePresenter from './home-presenter';

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter({ view: this });
  }

  async render() {
    return `
      <section class="container">
        <h1>Home Page</h1>
        <div id="story-list" style="display: flex; flex-wrap: wrap; gap: 1rem;"></div>
        <div id="map" style="height: 400px; margin-top: 1rem;"></div>
      </section>
    `;
  }

  async afterRender() {
    this.storyList = document.getElementById('story-list');
    this.mapContainer = document.getElementById('map');
    await this.presenter.init();

    this.storyList.addEventListener('click', async (event) => {
      if (event.target.classList.contains('delete-button')) {
        const storyId = event.target.dataset.id;
        if (storyId) {
          await this.presenter.deleteStory(storyId);
        }
      } else if (event.target.classList.contains('like-button')) {
        const storyId = event.target.dataset.id;
        const storyIndex = event.target.dataset.index;
        if (storyId && storyIndex !== undefined) {
          const story = this.currentStories[storyIndex];
          if (story && story.id === storyId) {
            await this.presenter.saveStoryOnUserAction(story);
            event.target.disabled = true;
            event.target.textContent = 'Liked';
          }
        }
      }
    });
  }

  showStories(stories) {
    if (stories.length === 0) {
      this.storyList.innerHTML = '<p>No stories available.</p>';
      return;
    }

    this.currentStories = stories;

    this.storyList.innerHTML = stories.map((story, index) => `
      <div class="story-item" style="flex: 1 1 300px; border: 1px solid #ccc; padding: 1rem; border-radius: 8px;">
        <img src="${story.photoUrl}" alt="${story.description || 'Story image'}" style="width: 100%; height: auto; border-radius: 4px;" />
        <p><strong>Description:</strong> ${story.description || '-'}</p>
        <p><strong>Created At:</strong> ${new Date(story.createdAt).toLocaleString()}</p>
        <button class="delete-button" data-id="${story.id}" style="background-color: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Delete</button>
        <button class="like-button" data-id="${story.id}" data-index="${index}" style="background-color: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;">Like</button>
      </div>
    `).join('');
  }

  async initMap(stories) {
    if (!window.L) {
      await this.loadLeaflet();
    }

    this.map = L.map(this.mapContainer).setView([-6.200000, 106.816666], 5); // Indonesia center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    stories.forEach(story => {
      if (typeof story.lat === 'number' && typeof story.lon === 'number' && !isNaN(story.lat) && !isNaN(story.lon)) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.map);
        marker.bindPopup(`
          <strong>${story.description || 'No description'}</strong><br/>
          Created At: ${new Date(story.createdAt).toLocaleString()}
        `);
      }
    });
  }

  loadLeaflet() {
    return new Promise((resolve) => {
      if (window.L) {
        resolve();
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  showError(message) {
    this.storyList.innerHTML = `<p>${message}</p>`;
  }
}
