import { Injectable, signal } from '@angular/core';
import { ToastService } from './toast';

@Injectable({ providedIn: 'root' })
export class ProfilePictureService {
  private readonly storageKey = 'pfm_profile_picture';
  readonly picture = signal<string | null>(localStorage.getItem(this.storageKey));

  constructor(private readonly toast: ToastService) {}

  select(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.show('Please choose an image file.');
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toast.show('Profile picture must be smaller than 2 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const picture = typeof reader.result === 'string' ? reader.result : null;
      if (!picture) return;

      localStorage.setItem(this.storageKey, picture);
      this.picture.set(picture);
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  remove(): void {
    localStorage.removeItem(this.storageKey);
    this.picture.set(null);
  }
}
