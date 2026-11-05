import { of } from 'rxjs';
import { PostsService } from './posts.service';

describe('PostsService deletePosts', () => {
  it('sends 250 posts in 3 requests and combines the results', async () => {
    const batches: string[][] = [];
    const apollo = {
      mutate: ({ variables }: { variables: { postIds: string[] } }) => {
        batches.push(variables.postIds);
        const [failed, ...deleted] = variables.postIds;
        return of({ data: { deletePosts: { deletedIds: deleted, failedIds: [failed] } } });
      },
    };
    const service = new PostsService(apollo as never, {} as never, {} as never);
    const ids = Array.from({ length: 250 }, (_, i) => `p${i}`);

    const result = await service.deletePosts(ids);

    expect(batches.map((b) => b.length)).toEqual([100, 100, 50]);
    expect(result.failedIds).toEqual(['p0', 'p100', 'p200']);
    expect(result.deletedIds.length).toBe(247);
  });
});
