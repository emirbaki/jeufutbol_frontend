import { Injectable } from '@angular/core';
import { Apollo, gql, QueryRef, } from 'apollo-angular';
import { firstValueFrom, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment as env } from '../../environments/environment.development';

const DELETE_POST = gql`
  mutation DeletePost($postId: String!) {
    deletePost(postId: $postId)
  }
`;

const PUBLISH_POST = gql`
  mutation PublishPost($postId: String!) {
    publishPost(postId: $postId) {
      id
      status
      failureReasons
      publishedPosts {
        platform
        platformPostUrl
        platformPostId
        publishStatus
        publishedAt
      }
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const RETRY_PUBLISH_POST = gql`
  mutation RetryPublishPost($postId: String!) {
    retryPublishPost(postId: $postId) {
      id
      status
      failureReasons
      publishedPosts {
        platform
        platformPostUrl
        platformPostId
        publishStatus
        publishedAt
      }
    }
  }
`;

const GET_USER_POSTS = gql`
  query GetUserPosts($limit: Int) {
    getUserPosts(limit: $limit) {
      id
      content
      mediaUrls
      status
      failureReasons
      targetPlatforms
      platformSpecificContent
      scheduledFor
      createdAt
      user {
        id
        firstName
        lastName
        email
      }
      publishedPosts {
        platform
        platformPostUrl
        platformPostId
        publishStatus
        publishedAt
      }
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      status
      mediaUrls
      targetPlatforms
      createdAt
      scheduledFor
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const GET_POST = gql`
  query GetPost($postId: String!) {
    getPost(postId: $postId) {
      id
      content
      mediaUrls
      status
      targetPlatforms
      platformSpecificContent
      scheduledFor
      failureReasons
    }
  }
`;

const UPDATE_POST = gql`
  mutation UpdatePost($postId: String!, $input: UpdatePostInput!) {
    updatePost(postId: $postId, input: $input) {
      id
      content
      status
      mediaUrls
      targetPlatforms
      platformSpecificContent
      scheduledFor
    }
  }
`;

const POST_UPDATED_SUBSCRIPTION = gql`
  subscription PostUpdated {
    postUpdated {
      id
      content
      mediaUrls
      status
      failureReasons
      targetPlatforms
      platformSpecificContent
      scheduledFor
      createdAt
      user {
        id
        firstName
        lastName
        email
      }
      publishedPosts {
        platform
        platformPostUrl
        platformPostId
        publishStatus
        publishedAt
      }
      tenant {
        id
        name
        subdomain
      }
    }
  }
`;

const GET_TIKTOK_CREATOR_INFO = gql`
  query GetTikTokCreatorInfo {
    getTikTokCreatorInfo {
      creator_nickname
      creator_avatar_url
      privacy_level_options
      max_video_post_duration_sec
      comment_disabled
      duet_disabled
      stitch_disabled
    }
  }
`;

/**
 * TikTok Creator Info - returned from TikTok's creator_info API
 */
export interface TikTokCreatorInfo {
  creator_nickname: string;
  creator_avatar_url: string;
  privacy_level_options: string[];
  max_video_post_duration_sec: number;
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
}

/**
 * TikTok Post Settings - user-selected options for posting
 * Required by TikTok Content Sharing Guidelines
 */
export interface TikTokPostSettings {
  title?: string; // TikTok post title/caption
  privacy_level: string;
  allow_comment: boolean;
  allow_duet: boolean;
  allow_stitch: boolean;
  is_brand_organic?: boolean;
  is_branded_content?: boolean;
}


interface CreatePostInput {
  content: string;
  mediaUrls?: string[];
  targetPlatforms: string[];
  platformSpecificContent?: Record<string, any>;
  scheduledFor?: string;
  tiktokSettings?: TikTokPostSettings;
}


export interface Post {
  id: string;
  content: string;
  mediaUrls?: string[];
  status: 'PUBLISHED' | 'SCHEDULED' | 'DRAFT' | 'FAILED';
  failureReasons?: Record<string, string>;
  targetPlatforms: string[];
  scheduledFor?: string;
  createdAt: Date;
  publishedPosts?: PublishedPost[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
  };
  platformSpecificContent?: Record<string, any>;
}

export interface PublishedPost {
  platform: string;
  platformPostUrl: string;
  publishStatus?: string;
  publishedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  constructor(
    private apollo: Apollo,
    private http: HttpClient,
  ) { }
  private postsQueryRef: QueryRef<{ getUserPosts: Post[] }> | null = null;
  private apiUrl = `${(env as any).api_url}/upload/multiple`;

  async createPost(input: CreatePostInput): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ createPost: Post }>({
        mutation: CREATE_POST,
        variables: { input },
        refetchQueries: [{
          query: GET_USER_POSTS,
          variables: { limit: 100 }
        }],
        update: (cache, { data }) => {
          if (!data?.createPost) return;

          // Read existing posts from cache
          const existingPosts = cache.readQuery<{ getUserPosts: Post[] }>({
            query: GET_USER_POSTS,
            variables: { limit: 100 }
          });

          if (existingPosts) {
            // Write updated posts to cache
            cache.writeQuery({
              query: GET_USER_POSTS,
              variables: { limit: 100 },
              data: {
                getUserPosts: [data.createPost, ...existingPosts.getUserPosts]
              }
            });
          }
        },
      })
    );
    return result.data!.createPost;
  }

  watchPosts(limit = 50): Observable<Post[]> {
    // Create or reuse the query reference
    if (!this.postsQueryRef) {
      this.postsQueryRef = this.apollo.watchQuery<{ getUserPosts: Post[] }>({
        query: GET_USER_POSTS,
        variables: { limit },
        fetchPolicy: 'cache-and-network', // Get cached data first, then fetch from network
      });
    }

    // Return the observable that emits posts
    return this.postsQueryRef.valueChanges.pipe(
      map(result => result.data.getUserPosts)
    );
  }

  async getUserPosts(limit = 50): Promise<Post[]> {
    const result = await firstValueFrom(
      this.apollo.query<{ getUserPosts: Post[] }>({
        query: GET_USER_POSTS,
        variables: { limit },
        fetchPolicy: 'cache-first'
      })
    );
    return result.data.getUserPosts;
  }

  async deletePost(postId: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ deletePost: boolean }>({
        mutation: DELETE_POST,
        variables: { postId },
        update: (cache) => {
          // Identify and remove the post from cache
          cache.evict({ id: cache.identify({ __typename: 'Post', id: postId }) });
          cache.gc(); // Garbage collect orphaned references
        },
      })
    );
    return result.data?.deletePost || false;
  }

  async publishPost(postId: string): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ publishedPost: Post }>({
        mutation: PUBLISH_POST,
        variables: { postId },
        refetchQueries: [
          {
            query: GET_USER_POSTS,
            variables: { limit: 100 }
          }
        ]
      })
    );
    return result.data!.publishedPost;
  }

  /**
   * Manually refetch posts
   */
  async refetchPosts(): Promise<void> {
    if (this.postsQueryRef) {
      await this.postsQueryRef.refetch();
    }
  }

  async uploadMedia(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(`file`, file);
    });

    const response = await firstValueFrom(
      this.http.post<any>(this.apiUrl, formData)
    );
    return response.path.split(',');
  }

  async retryPublishPost(postId: string): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ retryPublishPost: Post }>({
        mutation: RETRY_PUBLISH_POST,
        variables: { postId },
        refetchQueries: [
          {
            query: GET_USER_POSTS,
            variables: { limit: 100 }
          }
        ]
      })
    );
    return result.data!.retryPublishPost;
  }

  async getPost(postId: string): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.query<{ getPost: Post }>({
        query: GET_POST,
        variables: { postId },
        fetchPolicy: 'network-only'
      })
    );
    return result.data.getPost;
  }

  async updatePost(postId: string, input: Partial<CreatePostInput>): Promise<Post> {
    const result = await firstValueFrom(
      this.apollo.mutate<{ updatePost: Post }>({
        mutation: UPDATE_POST,
        variables: { postId, input },
        refetchQueries: [{
          query: GET_USER_POSTS,
          variables: { limit: 100 }
        }]
      })
    );
    return result.data!.updatePost;
  }

  subscribeToPostUpdates(): Observable<Post> {
    return this.apollo.subscribe<{ postUpdated: Post }>({
      query: POST_UPDATED_SUBSCRIPTION,
    }).pipe(
      map(result => result.data!.postUpdated)
    );
  }

  /**
   * Get TikTok creator info for posting compliance
   * Returns privacy options, posting limits, and interaction settings
   * Required by TikTok Content Sharing Guidelines
   */
  async getTikTokCreatorInfo(): Promise<TikTokCreatorInfo> {
    const result = await firstValueFrom(
      this.apollo.query<{ getTikTokCreatorInfo: TikTokCreatorInfo }>({
        query: GET_TIKTOK_CREATOR_INFO,
        fetchPolicy: 'network-only' // Always fetch fresh from API
      })
    );
    return result.data.getTikTokCreatorInfo;
  }
}
