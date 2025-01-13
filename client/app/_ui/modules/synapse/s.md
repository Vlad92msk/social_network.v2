```typescript
type QueryEffect = Observable<QueryEvent>;
type SelectorEffect = Observable<any>;

interface QueryEvent {
  type: 'success' | 'error' | 'loading';
  queryId: string;
  payload?: any;
}

// 2. Effect Creators
function watchQueryEffects(queries: Query[]): Observable<QueryEvent> {
  return new Observable<QueryEvent>(subscriber => {
    const subscriptions = queries.map(query =>
      fromEventPattern(
        handler => query.on('stateChange', handler),
        handler => query.off('stateChange', handler)
      ).subscribe(subscriber)
    );

    return () => subscriptions.forEach(sub => sub.unsubscribe());
  });
}

function watchSelectorEffects(selectors: Selector[]): Observable<any> {
  return combineLatest(
    selectors.map(selector => store$.pipe(
      map(selector),
      distinctUntilChanged()
    ))
  );
}

// 3. Custom RxJS Operators
const ofTypeSuccess = (options: { every: boolean }) => (source$: Observable<QueryEvent>) =>
  source$.pipe(
    filter(event => {
      if (options.every) {
        return queries.every(q =>
          event.type === 'success' && event.queryId === q.id
        );
      }
      return queries.some(q =>
        event.type === 'success' && event.queryId === q.id
      );
    })
  );

const ofTypeValues = (options: { every: boolean }) => (source$: Observable<any>) =>
  source$.pipe(
    distinctUntilChanged((prev, curr) => {
      if (options.every) {
        return isEqual(prev, curr);
      }
      return some(zip(prev, curr), ([p, c]) => !isEqual(p, c));
    })
  );

const addOptions = (optionsFn: (value: any) => QueryEffectConfig) =>
  (source$: Observable<any>) =>
    source$.pipe(
      mergeMap(value => {
        const config = optionsFn(value);

        const validationResult = config.validate?.();
        if (validationResult && !validationResult.every(Boolean)) {
          return EMPTY;
        }

        if (config.poolingInterval) {
          return interval(config.poolingInterval).pipe(
            startWith(0),
            map(() => value)
          );
        }

        return of(value);
      })
    );

// 4. Query API Implementation
class QueryApi {
  constructor(
    private name: string,
    private config: QueryApiConfig,
    private synapse: Synapse
  ) {}

  createEndpoint<TParams = any, TResult = any>(config: EndpointConfig<TParams, TResult>) {
    const endpoint = {
      ...config,
      execute: (params: TParams) => {
        const queryKey = this.buildQueryKey(config, params);
        const cachedData = this.getCachedData(queryKey);

        if (cachedData && this.isCacheValid(cachedData, config.cache)) {
          return of(cachedData.data);
        }

        return this.executeQuery(config, params, queryKey).pipe(
          tap(result => this.cacheResult(queryKey, result, config.cache)),
          tap(() => this.invalidateRelatedCache(config.invalidates))
        );
      }
    };

    return endpoint;
  }

  private buildQueryKey(config: EndpointConfig, params: any): string {
    return config.cache?.key || `${this.name}:${config.name}:${JSON.stringify(params)}`;
  }

  private getCachedData(key: string) {
    return this.synapse.state.get(`query:${key}`);
  }

  private isCacheValid(cachedData: any, cacheConfig?: CacheConfig): boolean {
    if (!cacheConfig) return false;

    const now = Date.now();
    const age = now - cachedData.timestamp;

    return age < (cacheConfig.maxAge || this.config.cache.maxAge);
  }

  private executeQuery(config: EndpointConfig, params: any, queryKey: string) {
    const queryConfig = config.query(params);
    const headers = this.prepareHeaders(queryConfig);

    return this.synapse.http.request({
      ...queryConfig,
      url: `${this.config.baseURL}${queryConfig.path}`,
      headers
    });
  }

  private prepareHeaders(queryConfig: QueryConfig) {
    const headers = new Headers(queryConfig.headers);

    if (this.config.prepareHeaders) {
      this.config.prepareHeaders(headers, {
        getState: () => this.synapse.state.getState()
      });
    }

    return headers;
  }

  private cacheResult(key: string, result: any, cacheConfig?: CacheConfig) {
    if (!cacheConfig) return;

    this.synapse.state.set(`query:${key}`, {
      data: result,
      timestamp: Date.now()
    });
  }

  private invalidateRelatedCache(invalidates?: string[]) {
    if (!invalidates) return;

    invalidates.forEach(key => {
      this.synapse.state.delete(`query:${key}`);
    });
  }
}
```
