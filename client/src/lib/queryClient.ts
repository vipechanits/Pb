import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// CSRF token management
let csrfToken: string | null = null;

export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf-token", {
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch CSRF token");
  }
  
  const data = await res.json();
  if (!data.csrfToken) {
    throw new Error("CSRF token not found in response");
  }
  csrfToken = data.csrfToken as string;
  return csrfToken;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function resetCsrfToken(): void {
  csrfToken = null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retryCount = 0,
): Promise<Response> {
  try {
    // Fetch CSRF token if not already fetched
    if (!csrfToken) {
      console.log('[API] Fetching CSRF token...');
      await fetchCsrfToken();
      console.log('[API] CSRF token fetched successfully');
    }
    
    const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
    
    // Include CSRF token for state-changing requests
    if (csrfToken && ["POST", "PATCH", "PUT", "DELETE"].includes(method.toUpperCase())) {
      headers["CSRF-Token"] = csrfToken;
      console.log('[API] Including CSRF token in request');
    }
    
    console.log(`[API] Sending ${method} request to ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log(`[API] Response received: ${res.status} ${res.statusText}`);

    // If we get 403 (CSRF error), clear token and retry once
    if (res.status === 403 && retryCount === 0) {
      console.log('[API] 403 error, refreshing CSRF token and retrying...');
      resetCsrfToken();
      return apiRequest(method, url, data, retryCount + 1);
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[API] Request timed out after 30 seconds');
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    console.error('[API] Request failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
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
