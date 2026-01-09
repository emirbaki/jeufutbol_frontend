import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SubscriptionService } from '../../services/subscription.service';

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
  private subscriptionService = inject(SubscriptionService);

  billingCycle = signal<'monthly' | 'yearly'>('monthly');
  isCheckoutLoading = signal(false);

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

  /**
   * Initiate checkout for Pro plan
   * If user is not logged in, redirect to signup first
   */
  initiateCheckout(): void {
    const plan = this.billingCycle() === 'monthly' ? 'pro_monthly' : 'pro_yearly';

    // Check if user is logged in by checking for auth token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // Store intended plan and redirect to signup (new users start trial)
      localStorage.setItem('pending_checkout_plan', plan);
      this.router.navigate(['/auth/register'], {
        queryParams: { redirect: 'checkout' }
      });
      return;
    }

    this.isCheckoutLoading.set(true);
    this.subscriptionService.createCheckout(plan).subscribe({
      next: (checkoutUrl) => {
        window.location.href = checkoutUrl;
      },
      error: (err) => {
        console.error('Checkout error:', err);
        this.isCheckoutLoading.set(false);
        alert('Failed to start checkout. Please try again.');
      }
    });
  }

  /**
   * Open contact form for Enterprise plan
   */
  contactSales(): void {
    window.location.href = 'mailto:jeufutbol@gmail.com?subject=Enterprise%20Plan%20Inquiry';
  }
}
