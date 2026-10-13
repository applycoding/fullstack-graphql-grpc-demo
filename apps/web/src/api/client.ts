export class GraphqlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphqlError';
  }
}

type GraphqlBody<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch('/graphql', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new GraphqlError(`Request failed (${response.status})`);
  }
  const body = (await response.json()) as GraphqlBody<T>;
  const message = body.errors?.[0]?.message;
  if (message) {
    throw new GraphqlError(message);
  }
  if (!body.data) {
    throw new GraphqlError('Request failed');
  }
  return body.data;
}
