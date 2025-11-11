import { CommonModule } from '@angular/common';
import { Component, NgModule, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { GraphQLModule } from './app/graphql.module';




@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, GraphQLModule],
  standalone: true,
  template: `<router-outlet></router-outlet>`,
  // templateUrl: './app.html',
  // styleUrl: './app.css'
})

export class App {
  protected readonly title = signal('Jeuhub');
}
