import { getStories, deleteStory } from '../../utils/db';

export default class LikedPresenter {
  constructor({ view }) {
    this.view = view;
  }

  async init() {
    try {
      const likedStories = await getStories();
      this.view.showLikedStories(likedStories);
    } catch (error) {
      console.error('Failed to load liked stories:', error);
      this.view.showError('Gagal memuat data yang disukai.');
    }
  }

  async deleteLikedStory(id) {
    try {
      await deleteStory(id);
      const updatedStories = await getStories();
      this.view.showLikedStories(updatedStories);
    } catch (error) {
      console.error('Failed to delete liked story:', error);
      this.view.showError('Gagal menghapus data yang disukai.');
    }
  }
}
