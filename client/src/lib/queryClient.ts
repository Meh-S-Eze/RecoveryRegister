import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Create headers with enhanced caching control
    const headers: Record<string, string> = {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    };
    
    // Add debug session ID if available for auth endpoints
    const url = queryKey[0] as string;
    const debugSessionId = localStorage.getItem('recoveryRegister_debug_sessionId');
    if (debugSessionId && url.startsWith('/api/auth')) {
      console.log("Using debug session ID in query:", url, debugSessionId);
      headers['X-Debug-Session-ID'] = debugSessionId;
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // If this is an auth endpoint and we get a session ID header, save it
    if (url.startsWith('/api/auth') && res.headers.get('X-Session-ID')) {
      const sessionId = res.headers.get('X-Session-ID');
      if (sessionId) {
        localStorage.setItem('recoveryRegister_debug_sessionId', sessionId);
        console.log("Saved session ID from query response:", sessionId);
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
