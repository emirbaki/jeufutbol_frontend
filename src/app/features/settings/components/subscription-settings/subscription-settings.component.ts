import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SubscriptionService, SubscriptionData } from '../../../../services/subscription.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
    selector: 'app-subscription-settings',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './subscription-settings.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionSettingsComponent implements OnInit {
    private subscriptionService = inject(SubscriptionService);
    private toast = inject(ToastService);
    private route = inject(ActivatedRoute);

    subscription = signal<SubscriptionData | null>(null);
    loading = signal(true);
    cancelling = signal(false);
    checkoutLoading = signal(false);

    ngOnInit(): void {
        this.loadSubscription();
        this.handleQueryParams();
    }

    private handleQueryParams(): void {
        this.route.queryParams.subscribe((params) => {
            if (params['success'] === 'true') {
                this.toast.success('Subscription activated successfully!');
                this.loadSubscription(); // Refresh after successful payment
            } else if (params['cancelled'] === 'true') {
                this.toast.info('Checkout was cancelled.');
            }
        });
    }

    loadSubscription(): void {
        this.loading.set(true);
        this.subscriptionService.getMySubscription().subscribe({
            next: (sub) => {
                this.subscription.set(sub);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading subscription:', err);
                this.loading.set(false);
            },
        });
    }

    get planName(): string {
        return this.subscriptionService.getPlanDisplayName(this.subscription()?.plan || 'free');
    }

    get statusName(): string {
        return this.subscriptionService.getStatusDisplayName(this.subscription()?.status || 'active');
    }

    get isPro(): boolean {
        return this.subscriptionService.isPro(this.subscription());
    }

    get isGrandfathered(): boolean {
        return this.subscription()?.isGrandfathered || false;
    }

    get periodEndDate(): string {
        const endDate = this.subscription()?.currentPeriodEnd;
        if (!endDate) return 'N/A';
        return new Date(endDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    get trialEndDate(): string {
        const trialEnd = this.subscription()?.trialEndsAt;
        if (!trialEnd) return '';
        return new Date(trialEnd).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    get isOnTrial(): boolean {
        return this.subscription()?.status === 'on_trial';
    }

    get isCancelled(): boolean {
        return this.subscription()?.cancelAtPeriodEnd || false;
    }

    upgradeToProMonthly(): void {
        this.checkoutLoading.set(true);
        this.subscriptionService.createCheckout('pro_monthly').subscribe({
            next: (url) => {
                window.location.href = url;
            },
            error: (err) => {
                console.error('Checkout error:', err);
                this.checkoutLoading.set(false);
                this.toast.error('Failed to start checkout. Please try again.');
            },
        });
    }

    upgradeToProYearly(): void {
        this.checkoutLoading.set(true);
        this.subscriptionService.createCheckout('pro_yearly').subscribe({
            next: (url) => {
                window.location.href = url;
            },
            error: (err) => {
                console.error('Checkout error:', err);
                this.checkoutLoading.set(false);
                this.toast.error('Failed to start checkout. Please try again.');
            },
        });
    }

    cancelSubscription(): void {
        if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
            return;
        }

        this.cancelling.set(true);
        this.subscriptionService.cancelSubscription().subscribe({
            next: (updated) => {
                this.subscription.set(updated);
                this.cancelling.set(false);
                this.toast.success('Subscription will be cancelled at the end of your billing period.');
            },
            error: (err) => {
                console.error('Cancel error:', err);
                this.cancelling.set(false);
                this.toast.error('Failed to cancel subscription. Please try again.');
            },
        });
    }
}
