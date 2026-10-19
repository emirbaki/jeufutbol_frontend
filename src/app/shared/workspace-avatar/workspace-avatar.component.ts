import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Colors that read well with white text in light and dark mode.
const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#db2777', '#ea580c', '#0891b2', '#4f46e5', '#ca8a04'];

/** A workspace or user image. Without an image it shows the first letter on a fixed color. */
@Component({
  selector: 'app-workspace-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center justify-center overflow-hidden flex-none font-bold text-white select-none"
      [class.rounded-full]="shape() === 'circle'"
      [class.rounded-xl]="shape() === 'square'"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.fontSize.px]="size() * 0.42"
      [style.background]="imageUrl() ? 'transparent' : color()"
      [attr.title]="name()"
    >
      @if (imageUrl()) {
        <img [src]="imageUrl()" [alt]="name()" class="w-full h-full object-cover" />
      } @else {
        {{ letter() }}
      }
    </span>
  `,
})
export class WorkspaceAvatarComponent {
  name = input<string>('');
  imageUrl = input<string | null | undefined>(null);
  /** Any stable value, for example the workspace ID. It picks the color. */
  seed = input<string>('');
  size = input<number>(40);
  shape = input<'square' | 'circle'>('square');

  letter = computed(() => (this.name().trim()[0] ?? '?').toUpperCase());
  color = computed(() => {
    let hash = 0;
    for (const ch of this.seed() || this.name()) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return COLORS[Math.abs(hash) % COLORS.length];
  });
}
