import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostsService, Post } from '../../../services/posts.service';
import { NgIcon, provideIcons } from '@ng-icons/core'
import { matAdd } from '@ng-icons/material-icons/baseline'

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: any[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, NgOptimizedImage],
  providers: [provideIcons({ matAdd })],
  templateUrl: './calendar-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarViewComponent implements OnInit {
  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  scheduledPosts = signal<any[]>([]);

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  calendarDays = computed(() => {
    const current = this.currentDate();
    const posts = this.scheduledPosts();
    const year = current.getFullYear();
    const month = current.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayIndex = firstDay.getDay();
    const lastDayDate = lastDay.getDate();
    const prevLastDayDate = prevLastDay.getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevLastDayDate - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        posts: this.getPostsForDate(date, posts)
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayDate; i++) {
      const date = new Date(year, month, i);
      const today = new Date();
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        posts: this.getPostsForDate(date, posts)
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        posts: this.getPostsForDate(date, posts)
      });
    }
    return days;
  });

  monthYear = computed(() => {
    return this.currentDate().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  });

  sidebarTitle = computed(() => {
    const selected = this.selectedDate();
    if (!selected) return 'Upcoming Posts';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selected);
    selectedDay.setHours(0, 0, 0, 0);

    return selectedDay < today ? 'Published Posts' : 'Upcoming Posts';
  });

  sidebarPosts = computed(() => {
    const selected = this.selectedDate();
    const posts = this.scheduledPosts();

    if (!selected) {
      // Show only future posts if no date selected
      const today = new Date();
      return posts.filter(post => new Date(post.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return this.getPostsForDate(selected, posts)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  constructor(private postsService: PostsService) { }

  ngOnInit() {
    this.loadPosts();
  }

  async loadPosts() {
    try {
      const posts = await this.postsService.getUserPosts(100);
      this.scheduledPosts.set(posts.map(post => ({
        id: post.id,
        date: post.scheduledFor ? new Date(post.scheduledFor) : new Date(post.createdAt),
        content: post.content,
        platforms: post.targetPlatforms,
        status: post.status.toLowerCase(),
        user: post.user,
      })));
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }

  getPostsForDate(date: Date, posts: any[]): any[] {
    return posts.filter(post =>
      post.date.toDateString() === date.toDateString()
    );
  }

  previousMonth() {
    this.currentDate.update(date => new Date(
      date.getFullYear(),
      date.getMonth() - 1
    ));
  }

  nextMonth() {
    this.currentDate.update(date => new Date(
      date.getFullYear(),
      date.getMonth() + 1
    ));
  }

  selectDate(day: CalendarDay) {
    this.selectedDate.set(day.date);
  }

  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      x: 'assets/icons/Twitter.png',
      instagram: 'assets/icons/Instagram.png',
      facebook: 'assets/icons/facebook.png',
      tiktok: 'assets/icons/tiktok.png',
      youtube: 'assets/icons/youtube.png'
    };
    return icons[platform] || '📱';
  }
}
