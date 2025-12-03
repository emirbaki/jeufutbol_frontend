import { Component, effect, signal, computed, OnInit, AfterViewInit, Inject, PLATFORM_ID, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { InsightsService } from '../../../services/insights.service';
import { Insight, InsightType } from '../../../models/insight.model';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matAutoAwesomeRound, matSortRound, matLightbulbRound,
  matBarChartRound, matDoneAllRound, matNotificationsActiveRound,
  matManageSearchRound, matMenuBookRound, matDataThresholdingRound,
  matTimerRound, matInterestsRound, matVisibilityRound,
  matPersonRound, matDateRangeRound
} from '@ng-icons/material-icons/round';
import { matLocalFireDepartmentOutline } from '@ng-icons/material-icons/outline';
@Component({
  selector: 'app-insights-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  templateUrl: './insights-dashboard.html',
  providers: [provideIcons({
    matAutoAwesomeRound, matSortRound, matLightbulbRound,
    matBarChartRound, matDoneAllRound, matNotificationsActiveRound,
    matManageSearchRound, matMenuBookRound, matLocalFireDepartmentOutline,
    matDataThresholdingRound, matTimerRound, matInterestsRound, matVisibilityRound,
    matPersonRound, matDateRangeRound
  })],
})
export class InsightsDashboardComponent implements OnInit, AfterViewInit {
  // --- Signals ---
  insights = signal<Insight[]>([]);
  loading = signal(false);
  generatingInsights = signal(false);
  selectedType = signal<InsightType | 'all'>('all');
  selectedReadStatus = signal<'all' | 'read' | 'unread'>('all');
  selectedSortOrder = signal<'newest' | 'oldest' | 'relevance'>('newest');
  insightTypes = Object.values(InsightType);

  @ViewChildren('insightCard') insightCards!: QueryList<ElementRef>;

  // --- Derived Computed Signal ---
  filteredInsights = computed(() => {
    const selected = this.selectedType();
    const readStatus = this.selectedReadStatus();
    const sortOrder = this.selectedSortOrder();
    let filtered = this.insights();

    // Filter by type
    if (selected !== 'all') {
      filtered = filtered.filter(i => i.type === selected);
    }

    // Filter by read status
    if (readStatus === 'read') {
      filtered = filtered.filter(i => i.isRead);
    } else if (readStatus === 'unread') {
      filtered = filtered.filter(i => !i.isRead);
    }

    // Sort by selected order
    const sorted = [...filtered];
    if (sortOrder === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortOrder === 'relevance') {
      sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return sorted;
  });

  unreadCount = computed(() => {
    return this.insights().filter(i => !i.isRead).length;
  });

  constructor(
    private insightsService: InsightsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Animate insights when they change
    effect(() => {
      const insights = this.filteredInsights();
      if (insights.length > 0) {
        this.animateInsights();
      }
    });
  }

  ngOnInit(): void {
    this.loadInsights();
  }

  ngAfterViewInit() {
    // Initial animation for the main container
    if (isPlatformBrowser(this.platformId)) {
      gsap.from('.insights-container', {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }

  private animateInsights() {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      const elements = gsap.utils.toArray('.insight-card') as HTMLElement[];
      const newElements = elements.filter(el => !el.classList.contains('has-animated'));

      if (newElements.length === 0) {
        ScrollTrigger.refresh();
        return;
      }

      // Set initial state - make them visible but slightly offset
      gsap.set(newElements, { opacity: 1, y: 0 });

      // Only apply animation if the container is scrollable
      const mainContainer = document.querySelector('.main-scroll-container');
      if (mainContainer && mainContainer.scrollHeight > mainContainer.clientHeight) {
        // Apply scroll-triggered animation for scrollable content
        gsap.set(newElements, { opacity: 0, y: 20 });

        ScrollTrigger.batch(newElements, {
          onEnter: (batch) => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              stagger: 0.08,
              overwrite: true,
              duration: 0.5,
              ease: 'power2.out',
              onComplete: () => {
                batch.forEach((el) => (el as HTMLElement).classList.add('has-animated'));
              }
            });
          },
          start: 'top 90%',
          once: true,
          scroller: '.main-scroll-container'
        });
      } else {
        // If not scrollable, just animate them in sequence without scroll trigger
        gsap.fromTo(newElements,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              newElements.forEach((el) => (el as HTMLElement).classList.add('has-animated'));
            }
          }
        );
      }

      ScrollTrigger.refresh();
    }, 100);
  }

  loadInsights(): void {
    if (this.loading()) return;
    this.loading.set(true);

    // Subscribe to watchInsights to get continuous updates
    this.insightsService.watchInsights().subscribe({
      next: (data) => {
        this.insights.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading insights:', error);
        this.loading.set(false);
      }
    });
  }

  async generateNewInsights(): Promise<void> {
    this.generatingInsights.set(true);
    try {
      await this.insightsService.generateInsights();
      // Manually refetch to ensure watchQuery updates
      await this.insightsService.refetchInsights();
      console.log('Insights generated and refetched successfully');
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      this.generatingInsights.set(false);
    }
  }

  async markAsRead(insight: Insight): Promise<void> {
    try {
      await this.insightsService.markAsRead(insight.id);
      this.insights.update(list =>
        list.map(i => (i.id === insight.id ? { ...i, isRead: true } : i)),
      );
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  }

  getInsightIcon(type: InsightType): string {
    const icons = {
      [InsightType.TRENDING_TOPIC]: 'matLocalFireDepartmentOutline',
      [InsightType.CONTENT_SUGGESTION]: 'matLightbulbRound',
      [InsightType.ENGAGEMENT_PATTERN]: 'matDataThresholdingRound',
      [InsightType.OPTIMAL_POSTING_TIME]: 'matTimerRound',
      [InsightType.AUDIENCE_INTEREST]: 'matInterestsRound',
    };
    return icons[type] || '📌';
  }

  getInsightColor(type: InsightType): string {
    const colors = {
      [InsightType.TRENDING_TOPIC]: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      [InsightType.CONTENT_SUGGESTION]: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      [InsightType.ENGAGEMENT_PATTERN]: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      [InsightType.OPTIMAL_POSTING_TIME]: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      [InsightType.AUDIENCE_INTEREST]: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    };
    return colors[type] || 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800';
  }

  getInsightColorForIcons(type: InsightType): string {
    const colors = {
      [InsightType.TRENDING_TOPIC]: 'text-red-700! dark:text-red-300!',
      [InsightType.CONTENT_SUGGESTION]: 'text-yellow-500! dark:text-yellow-300!',
      [InsightType.ENGAGEMENT_PATTERN]: 'text-blue-700! dark:text-blue-300!',
      [InsightType.OPTIMAL_POSTING_TIME]: 'text-purple-700! dark:text-purple-300!',
      [InsightType.AUDIENCE_INTEREST]: 'text-green-700! dark:text-green-300!',
    };
    return colors[type] || 'text-gray-700! dark:text-gray-300!';
  }
  getRelevanceBarWidth(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  getInsightCountByType(type: InsightType): number {
    return this.insights().filter(i => i.type === type).length;
  }

  getRelevanceColor(score: number): string {
    if (score >= 0.8) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (score >= 0.6) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (score >= 0.4) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  }
}
