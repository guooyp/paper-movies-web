import { TestBed } from '@angular/core/testing';
import { RATING_CATEGORIES } from '../rating-category';
import { RatingChips } from './rating-chips';

function render(selected = RATING_CATEGORIES[0]) {
  const fixture = TestBed.createComponent(RatingChips);
  fixture.componentRef.setInput('selected', selected);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const chips = () => [...el.querySelectorAll<HTMLButtonElement>('button')];
  return { fixture, el, chips };
}

describe('RatingChips', () => {
  it('shows a chip for every category, in order', () => {
    const { chips } = render();

    expect(chips().map((chip) => chip.textContent?.trim())).toEqual([
      'All',
      'Bad',
      'Good',
      'Great',
      'Recommend',
    ]);
  });

  it('marks only the selected chip as pressed', () => {
    const { chips } = render(RATING_CATEGORIES[2]);

    expect(chips().map((chip) => chip.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
      'false',
      'false',
    ]);
  });

  it('follows the selection when it changes', () => {
    const { fixture, chips } = render();

    fixture.componentRef.setInput('selected', RATING_CATEGORIES[3]);
    fixture.detectChanges();

    expect(chips()[0].getAttribute('aria-pressed')).toBe('false');
    expect(chips()[3].getAttribute('aria-pressed')).toBe('true');
  });

  it('emits the category that was clicked', () => {
    const { fixture, chips } = render();
    const emitted: unknown[] = [];
    fixture.componentInstance.selectedChange.subscribe((c) => emitted.push(c));

    chips()[4].click();
    chips()[1].click();

    expect(emitted).toEqual([RATING_CATEGORIES[4], RATING_CATEGORIES[1]]);
  });

  it('is a labelled group for screen readers', () => {
    const { el } = render();

    expect(el.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Filter by rating');
  });

  it('uses real buttons that do not submit forms', () => {
    const { chips } = render();

    expect(chips().every((chip) => chip.type === 'button')).toBe(true);
  });
});
