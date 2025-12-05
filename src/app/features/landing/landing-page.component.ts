import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink],
  templateUrl: './landing-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroSection') heroSection!: ElementRef;
  @ViewChild('dashboardMockup') dashboardMockup!: ElementRef;
  @ViewChild('featuresSection') featuresSection!: ElementRef;

  private ctx: gsap.Context | undefined; // GSAP context for easy cleanup

  billingCycle = signal<'monthly' | 'yearly'>('monthly');

  constructor(
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Register ScrollTrigger only if we are in the browser
    if (isPlatformBrowser(this.platformId)) {
      gsap.registerPlugin(ScrollTrigger);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Use a GSAP context to scope all animations to this component
      this.ctx = gsap.context(() => {
        this.initHeroAnimations();
        this.initFeatureAnimations();
      });
    }
  }

  ngOnDestroy() {
    // Clean up all GSAP animations/triggers when component is destroyed
    if (this.ctx) {
      this.ctx.revert();
    }
  }

  private initHeroAnimations() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.hero-text-element', {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.2
    })
      .from(this.dashboardMockup.nativeElement, {
        y: 100,
        opacity: 0,
        rotationX: 15,
        duration: 1.2,
        ease: 'power2.out'
      }, '-=0.5');

    // Parallax effect for the dashboard mockup
    gsap.to(this.dashboardMockup.nativeElement, {
      scrollTrigger: {
        trigger: this.heroSection.nativeElement,
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: 150,
      rotationX: 0
    });
  }

  private initFeatureAnimations() {
    // Animate feature cards on scroll
    const cards = gsap.utils.toArray('.feature-card');
    cards.forEach((card: any, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.1
      });
    });

    // Animate section titles
    const titles = gsap.utils.toArray('.section-title');
    titles.forEach((title: any) => {
      gsap.from(title, {
        scrollTrigger: {
          trigger: title,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: 30,
        opacity: 0,
        duration: 0.8
      });
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}