import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RATING_CATEGORIES, RatingCategory } from '../rating-category';

@Component({
  selector: 'app-rating-chips',
  templateUrl: './rating-chips.html',
  styleUrl: './rating-chips.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingChips {
  readonly selected = input.required<RatingCategory>();
  readonly selectedChange = output<RatingCategory>();

  protected readonly categories = RATING_CATEGORIES;
}
