import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
  createHttpLink,
  from,
  gql,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { fromPromise } from "@apollo/client";
import { tokenStore } from "./tokenStore";
import { slowLoadStore } from "./slowLoadStore";

const SLOW_THRESHOLD_MS = 1_000;

const slowLoadLink = new ApolloLink((operation, forward) => {
  let marked = false;
  const timer = setTimeout(() => {
    marked = true;
    slowLoadStore.increment();
  }, SLOW_THRESHOLD_MS);

  const cleanup = () => {
    clearTimeout(timer);
    if (marked) {
      marked = false;
      slowLoadStore.decrement();
    }
  };

  return new Observable((observer) => {
    const sub = forward(operation).subscribe({
      next(value) { cleanup(); observer.next(value); },
      error(err)  { cleanup(); observer.error(err); },
      complete()  { cleanup(); observer.complete(); },
    });
    return () => { cleanup(); sub.unsubscribe(); };
  });
});

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || "/graphql",
  credentials: "include", // always send cookies
});

const authLink = setContext((_, { headers }) => {
  const token = tokenStore.get();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const REFRESH = gql`
  mutation Refresh {
    refresh {
      token
      user { id email displayName role }
    }
  }
`;

let isRefreshing = false;
let pendingResolvers: Array<(token: string | null) => void> = [];

function drainPending(token: string | null) {
  pendingResolvers.forEach((resolve) => resolve(token));
  pendingResolvers = [];
}

async function doRefresh(): Promise<string | null> {
  try {
    // Use a plain fetch so we don't go through the error link again
    const res = await fetch(import.meta.env.VITE_GRAPHQL_URL || "/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query: REFRESH.loc!.source.body }),
    });
    const json = await res.json();
    return json?.data?.refresh?.token ?? null;
  } catch {
    return null;
  }
}

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  const isUnauthenticated = graphQLErrors?.some(
    (e) => e.message === "Unauthenticated"
  );

  if (!isUnauthenticated) return;

  if (isRefreshing) {
    // Queue this operation until the in-flight refresh resolves
    return fromPromise(
      new Promise<string | null>((resolve) => pendingResolvers.push(resolve))
    ).flatMap((token) => {
      if (token) {
        operation.setContext(({ headers = {} }: { headers: Record<string, string> }) => ({
          headers: { ...headers, authorization: `Bearer ${token}` },
        }));
      }
      return forward(operation);
    });
  }

  isRefreshing = true;
  return fromPromise(
    doRefresh().then((token) => {
      tokenStore.set(token);
      drainPending(token);
      if (!token) window.location.href = "/login";
      return token;
    }).finally(() => { isRefreshing = false; })
  ).flatMap((token) => {
    if (!token) return forward(operation);
    operation.setContext(({ headers = {} }: { headers: Record<string, string> }) => ({
      headers: { ...headers, authorization: `Bearer ${token}` },
    }));
    return forward(operation);
  });
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, slowLoadLink, httpLink]),
  cache: new InMemoryCache(),
});
