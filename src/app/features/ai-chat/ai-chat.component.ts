import { Component, signal, ViewChild, ElementRef, inject, OnInit, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LLMService, LLMCredentials } from '../../services/llm.service';
import { FormsModule } from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAddRound, matChatRound } from '@ng-icons/material-icons/round';
import { matSend } from '@ng-icons/material-icons/baseline';

const GET_USER_CHAT_SESSIONS = gql`
  query GetUserChatSessions {
    getUserChatSessions {
      id
      title
      updatedAt
    }
  }
`;

const GET_CHAT_SESSION_HISTORY = gql`
  query GetChatSessionHistory($sessionId: String!) {
    getChatSessionHistory(sessionId: $sessionId) {
      id
      role
      content
      createdAt
    }
  }
`;

const CREATE_CHAT_SESSION = gql`
  mutation CreateChatSession($title: String) {
    createChatSession(title: $title) {
      id
      title
      }
  }
`;

const CHAT_WITH_AI = gql`
  mutation ChatWithAI($message: String!, $sessionId: String, $llmProvider: String, $credentialId: Int) {
    chatWithAI(message: $message, sessionId: $sessionId, llmProvider: $llmProvider, credentialId: $credentialId) {
      response
      sessionId
    }
  }
`;

const DELETE_CHAT_SESSION = gql`
  mutation DeleteChatSession($sessionId: String!) {
    deleteChatSession(sessionId: $sessionId)
  }
`;

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatSession {
    id: string;
    title: string;
    updatedAt: Date;
}



@Component({
    selector: 'app-ai-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, ScrollingModule, MarkdownModule, NgIcon],
    templateUrl: './ai-chat.component.html',
    styleUrl: './ai-chat.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons({ matAddRound, matSend, matChatRound })]
})
export class AiChatComponent implements OnInit {
    @ViewChild('scrollContainer') private scrollContainer!: CdkVirtualScrollViewport;
    @ViewChild('chatWindow') private chatWindow!: ElementRef;
    @ViewChild('toggleBtn') private toggleBtn!: ElementRef;

    private apollo = inject(Apollo);
    private platformId = inject(PLATFORM_ID);
    private route = inject(ActivatedRoute);
    private llmService = inject(LLMService);

    isPageMode = signal(false);
    isOpen = signal(false);
    messages = signal<ChatMessage[]>([]);
    currentMessage = signal('');
    isLoading = signal(false);

    // Multi-session signals
    sessions = signal<ChatSession[]>([]);
    currentSessionId = signal<string | null>(null);
    isSidebarOpen = signal(true); // For page mode sidebar

    selectedCredentialId = signal<number | null>(null);
    userCredentials = signal<LLMCredentials[]>([]);

    // Computed available providers based on credentials
    availableProviders = signal<{ id: string; name: string; credentialId?: number }[]>([]);

    updateAvailableProviders() {
        const creds = this.userCredentials();
        const providers = creds.map(c => ({
            id: c.provider,
            name: c.name ? `${c.name} (${c.provider})` : `${c.provider} (${c.modelName || 'Default'})`,
            credentialId: c.id
        }));
        this.availableProviders.set(providers);
    }

    isProviderAvailable(providerId: string): boolean {
        if (providerId === 'custom') return true;
        return this.userCredentials().some(c => c.provider === providerId);
    }

    trackByTimestamp(index: number, item: ChatMessage): any {
        return item.timestamp;
    }

    constructor() {
        // No more GSAP effects
    }

    ngOnInit() {
        this.route.data.subscribe(data => {
            if (data['mode'] === 'page') {
                this.isPageMode.set(true);
                this.isOpen.set(true);
            }
        });

        if (isPlatformBrowser(this.platformId)) {
            this.loadSessions();
            this.loadCredentials();
        }
    }

    async loadCredentials() {
        try {
            const creds = await this.llmService.getCredentials();
            this.userCredentials.set(Array.isArray(creds) ? creds : []);
            this.updateAvailableProviders();

            // Select first available credential if none selected
            if (!this.selectedCredentialId() && this.availableProviders().length > 0) {
                this.selectedCredentialId.set(this.availableProviders()[0].credentialId || null);
            }
        } catch (error) {
            console.error('Error loading credentials:', error);
        }
    }

    async loadSessions() {
        try {
            const result = await firstValueFrom(
                this.apollo.query<{ getUserChatSessions: ChatSession[] }>({
                    query: GET_USER_CHAT_SESSIONS,
                    fetchPolicy: 'network-only'
                })
            );
            this.sessions.set(result.data.getUserChatSessions);

            // If page mode and no session selected, select first one or create new
            if (this.isPageMode() && !this.currentSessionId() && this.sessions().length > 0) {
                this.selectSession(this.sessions()[0].id);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    async selectSession(sessionId: string) {
        this.currentSessionId.set(sessionId);
        this.isLoading.set(true);
        try {
            const result = await firstValueFrom(
                this.apollo.query<{ getChatSessionHistory: any[] }>({
                    query: GET_CHAT_SESSION_HISTORY,
                    variables: { sessionId },
                    fetchPolicy: 'network-only'
                })
            );

            const history = result.data.getChatSessionHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.createdAt)
            }));
            this.messages.set(history);

            if (isPlatformBrowser(this.platformId)) {
                setTimeout(() => {
                    this.scrollToBottom();
                });
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    async createNewSession() {
        this.currentSessionId.set(null);
        this.messages.set([]);
        if (this.isPageMode()) {
            // In page mode, we might want to immediately create a session or just clear the view
            // For now, let's just clear the view and let the first message create the session
        }
    }

    async deleteSession(sessionId: string, event: Event) {
        event.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat?')) return;

        try {
            await firstValueFrom(
                this.apollo.mutate({
                    mutation: DELETE_CHAT_SESSION,
                    variables: { sessionId }
                })
            );
            await this.loadSessions();
            if (this.currentSessionId() === sessionId) {
                this.createNewSession();
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    }

    toggleChat() {
        this.isOpen.update(v => !v);
    }

    scrollToBottom(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        setTimeout(() => {
            if (this.scrollContainer) {
                const totalItems = this.messages().length;
                if (totalItems > 0) {
                    this.scrollContainer.scrollToIndex(totalItems - 1, 'smooth');
                    // Double check scroll after animation
                    setTimeout(() => {
                        this.scrollContainer.scrollToIndex(totalItems - 1, 'smooth');
                    }, 200);
                }
            }
        }, 100);
    }

    private addMessage(msg: ChatMessage) {
        this.messages.update(msgs => [...msgs, msg]);

        if (isPlatformBrowser(this.platformId)) {
            // Small delay to allow virtual scroll to render
            setTimeout(() => {
                this.scrollToBottom();
            }, 50);
        }
    }

    async sendMessage() {
        const message = this.currentMessage().trim();
        if (!message || this.isLoading()) return;

        if (!this.selectedCredentialId()) {
            this.addMessage({
                role: 'assistant',
                content: `⚠️ You haven't selected an LLM provider. Please configure credentials in Settings > LLM Accounts.`,
                timestamp: new Date()
            });
            return;
        }

        // Add user message
        this.addMessage({
            role: 'user',
            content: message,
            timestamp: new Date()
        });

        this.currentMessage.set('');
        this.isLoading.set(true);

        try {
            const result = await firstValueFrom(
                this.apollo.mutate<{ chatWithAI: { response: string, sessionId: string } }>({
                    mutation: CHAT_WITH_AI,
                    variables: {
                        message,
                        sessionId: this.currentSessionId(),
                        llmProvider: this.availableProviders().find(p => p.credentialId === this.selectedCredentialId())?.id,
                        credentialId: this.selectedCredentialId()
                    }
                })
            );

            if (result.data?.chatWithAI) {
                this.addMessage({
                    role: 'assistant',
                    content: result.data.chatWithAI.response,
                    timestamp: new Date()
                });

                // If this was a new session, update the session ID and reload list
                if (!this.currentSessionId()) {
                    this.currentSessionId.set(result.data.chatWithAI.sessionId);
                    this.loadSessions();
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage({
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request.',
                timestamp: new Date()
            });
        } finally {
            this.isLoading.set(false);
        }
    }
}
