import { Injectable } from '@angular/core';
import { Apollo, gql, QueryRef, } from 'apollo-angular';
import { firstValueFrom, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment as env } from '../../environments/environment';

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
      publishedPosts {
        platform
        platformPostUrl
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
      targetPlatforms
      scheduledFor
      createdAt
      publishedPosts {
        platform
        platformPostUrl
        publishedAt
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
    }
  }
`;

interface CreatePostInput {
  content: string;
  mediaUrls?: string[];
  targetPlatforms: string[];
  platformSpecificContent?: Record<string, any>;
  scheduledFor?: string;
}

export interface Post {
  id: string;
  content: string;
  mediaUrls?: string[];
  status: 'PUBLISHED' | 'SCHEDULED' | 'DRAFT' | 'FAILED';
  targetPlatforms: string[];
  scheduledFor?: string;
  createdAt: Date;
  publishedPosts?: PublishedPost[];
}

export interface PublishedPost {
  platform: string;
  platformPostUrl: string;
  publishedAt: Date;
}


@Injectable({
  providedIn: 'root'
})
export class PostsService {
  constructor(
    private apollo: Apollo,
    private http: HttpClient,
  ) {}
  private postsQueryRef: QueryRef<{ getUserPosts: Post[] }> | null = null;
  private apiUrl = `${(env as any).api_url}/upload/multiple`;
  
  async createPost(input: CreatePostInput): Promise<Post> {

    const result = await firstValueFrom(
      this.apollo.mutate<{createPost : Post}>({
        mutation: CREATE_POST,
        variables: { input },
        refetchQueries: [{ query: GET_USER_POSTS,
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
        fetchPolicy: 'network-only'
        
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
      this.apollo.mutate<{publishedPost : Post}>({
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
}