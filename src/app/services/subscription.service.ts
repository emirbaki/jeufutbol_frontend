import { Injectable, inject } from '@angular/core';
import { Apollo, gql, MutationResult } from 'apollo-angular';
import { Observable, map } from 'rxjs';

export interface SubscriptionData {
    id: string;
    plan: string;
    status: string;
    billingCycle: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    isGrandfathered: boolean;
    trialEndsAt: string | null;
}

export interface CheckoutSession {
    checkoutUrl: string;
}

const MY_SUBSCRIPTION_QUERY = gql`
  query MySubscription {
    mySubscription {
      id
      plan
      status
      billingCycle
      currentPeriodEnd
      cancelAtPeriodEnd
      isGrandfathered
      trialEndsAt
    }
  }
`;

const CREATE_CHECKOUT_MUTATION = gql`
  mutation CreateCheckout($plan: String!) {
    createCheckout(plan: $plan) {
      checkoutUrl
    }
  }
`;

const CANCEL_SUBSCRIPTION_MUTATION = gql`
  mutation CancelSubscription {
    cancelSubscription {
      id
      status
      cancelAtPeriodEnd
    }
  }
`;

const ENSURE_SUBSCRIPTION_QUERY = gql`
  query EnsureSubscription {
    ensureSubscription {
      id
      plan
      status
    }
  }
`;

@Injectable({
    providedIn: 'root',
})
export class SubscriptionService {
    private apollo = inject(Apollo);

    /**
     * Get current user's subscription
     */
    getMySubscription(): Observable<SubscriptionData | null> {
        return this.apollo
            .watchQuery<{ mySubscription: SubscriptionData | null }>({
                query: MY_SUBSCRIPTION_QUERY,
                fetchPolicy: 'network-only',
            })
            .valueChanges.pipe(map((result) => result.data.mySubscription));
    }

    /**
     * Create checkout session and redirect to Lemon Squeezy
     */
    createCheckout(plan: 'pro_monthly' | 'pro_yearly'): Observable<string> {
        return this.apollo
            .mutate<{ createCheckout: CheckoutSession }>({
                mutation: CREATE_CHECKOUT_MUTATION,
                variables: { plan },
            })
            .pipe(
                map((result: MutationResult<{ createCheckout: CheckoutSession }>) => {
                    const checkoutUrl = result.data?.createCheckout?.checkoutUrl;
                    if (!checkoutUrl) {
                        throw new Error('Failed to create checkout session');
                    }
                    return checkoutUrl;
                })
            );
    }

    /**
     * Cancel subscription at period end
     */
    cancelSubscription(): Observable<SubscriptionData> {
        return this.apollo
            .mutate<{ cancelSubscription: SubscriptionData }>({
                mutation: CANCEL_SUBSCRIPTION_MUTATION,
            })
            .pipe(
                map((result: MutationResult<{ cancelSubscription: SubscriptionData }>) => {
                    if (!result.data?.cancelSubscription) {
                        throw new Error('Failed to cancel subscription');
                    }
                    return result.data.cancelSubscription;
                })
            );
    }

    /**
     * Ensure user has a subscription record
     */
    ensureSubscription(): Observable<SubscriptionData> {
        return this.apollo
            .query<{ ensureSubscription: SubscriptionData }>({
                query: ENSURE_SUBSCRIPTION_QUERY,
                fetchPolicy: 'network-only',
            })
            .pipe(map((result) => result.data.ensureSubscription));
    }

    /**
     * Redirect to Lemon Squeezy checkout
     */
    redirectToCheckout(plan: 'pro_monthly' | 'pro_yearly'): void {
        this.createCheckout(plan).subscribe({
            next: (checkoutUrl) => {
                window.location.href = checkoutUrl;
            },
            error: (err) => {
                console.error('Checkout error:', err);
                alert('Failed to start checkout. Please try again.');
            },
        });
    }

    /**
     * Check if user has an active Pro subscription
     */
    isPro(subscription: SubscriptionData | null): boolean {
        if (!subscription) return false;
        return (
            subscription.plan === 'pro' &&
            (subscription.status === 'active' || subscription.status === 'on_trial')
        );
    }

    /**
     * Get plan display name
     */
    getPlanDisplayName(plan: string): string {
        switch (plan) {
            case 'pro':
                return 'Pro';
            case 'enterprise':
                return 'Enterprise';
            default:
                return 'Free';
        }
    }

    /**
     * Get status display name
     */
    getStatusDisplayName(status: string): string {
        switch (status) {
            case 'active':
                return 'Active';
            case 'on_trial':
                return 'Trial';
            case 'cancelled':
                return 'Cancelled';
            case 'expired':
                return 'Expired';
            case 'past_due':
                return 'Past Due';
            case 'unpaid':
                return 'Unpaid';
            case 'paused':
                return 'Paused';
            default:
                return status;
        }
    }
}
