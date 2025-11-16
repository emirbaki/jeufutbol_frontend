import { Observable, of, shareReplay } from 'rxjs';

/**
 * Custom RxJS operator for memoizing observables by key
 * Usage: getProfileTweets(id).pipe(memoize(id))
 */
export function memoize<T>(key: string, cache?: Map<string, Observable<T>>) {
  const memoCache = cache || memoize.cache;
  
  return (source: Observable<T>): Observable<T> => {
    if (!memoCache.has(key)) {
      const shared = source.pipe(shareReplay(1));
      memoCache.set(key, shared);
      return shared;
    }
    return memoCache.get(key)!;
  };
}

// Global cache for the memoize operator
memoize.cache = new Map<string, Observable<any>>();

// Helper to clear cache
memoize.clear = (key?: string) => {
  if (key) {
    memoize.cache.delete(key);
  } else {
    memoize.cache.clear();
  }
};

/**
 * Alternative: Memoize function wrapper (more decorator-like)
 */
export function memoizeAsync<T extends (...args: any[]) => Observable<any>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, Observable<any>>();
  
  const memoized = ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (!cache.has(key)) {
      const result = fn(...args).pipe(shareReplay(1));
      cache.set(key, result);
      return result;
    }
    
    return cache.get(key)!;
  }) as T;
  
  // Add cache control methods
  (memoized as any).clearCache = (key?: string) => {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  };
  
  return memoized;
}