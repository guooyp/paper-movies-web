import { Component } from '@angular/core';
import { MoviesPage } from './movies/movies-page/movies-page';

@Component({
  selector: 'app-root',
  imports: [MoviesPage],
  template: '<app-movies-page />',
})
export class App {}
