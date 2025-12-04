import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-oauth-callback',
    standalone: true,
    template: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <h1>Connecting...</h1>
      <p>Please wait while we complete the connection.</p>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OAuthCallbackComponent implements OnInit {
    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const channel = new BroadcastChannel('oauth_channel');

            if (params['status'] === 'success') {
                channel.postMessage({
                    type: 'OAUTH_SUCCESS',
                    platform: params['platform'],
                    credentialName: params['credentialName']
                });
            } else {
                channel.postMessage({
                    type: 'OAUTH_ERROR',
                    error: params['error'] || 'Unknown error'
                });
            }

            // Close after a brief delay to ensure message is sent
            setTimeout(() => {
                window.close();
            }, 1000);
        });
    }
}
