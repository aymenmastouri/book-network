import { Component, input, model } from '@angular/core';

/**
 * Five stars. Read-only by default; with `interactive` it becomes a rating
 * input driven by the `value` model.
 */
@Component({
  selector: 'pt-star-rating',
  template: `
    <span class="inline-flex items-center gap-0.5" role="img" [attr.aria-label]="value() + ' / 5'">
      @for (star of stars; track star) {
        <button type="button"
                class="text-base leading-none"
                [class.cursor-default]="!interactive()"
                [class.text-brand]="star <= Math.round(value())"
                [class.text-shelf]="star > Math.round(value())"
                [disabled]="!interactive()"
                (click)="interactive() && value.set(star)">★</button>
      }
    </span>
  `,
})
export class StarRatingComponent {
  protected readonly Math = Math;
  protected readonly stars = [1, 2, 3, 4, 5];

  readonly value = model(0);
  readonly interactive = input(false);
}
