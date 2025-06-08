interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  subscribers: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private cleanupInterval: NodeJS.Timeout;
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  private readonly MAX_REQUEST_AGE = 60000; // 1 minute

  constructor() {
    // Periodic cleanup of old requests
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Deduplicate requests based on a key. If a request with the same key is already
   * in progress, return the existing promise instead of making a new request.
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      maxAge?: number;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<T> {
    const { maxAge = this.MAX_REQUEST_AGE } = options;

    // Check if we already have this request pending
    const existing = this.pendingRequests.get(key);

    if (existing) {
      // Check if the request is still fresh
      const age = Date.now() - existing.timestamp;
      if (age < maxAge) {
        existing.subscribers++;
        console.log(`🔄 Deduplicating request: ${key} (${existing.subscribers} subscribers)`);
        return existing.promise;
      } else {
        // Request is too old, remove it
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    console.log(`🚀 New request: ${key}`);
    const promise = requestFn().finally(() => {
      // Clean up after completion
      this.pendingRequests.delete(key);
    });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
      subscribers: 1
    });

    return promise;
  }

  /**
   * Create a hash key for deduplication based on request parameters
   */
  createKey(params: {
    model?: string;
    messages?: any[];
    prompt?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  }): string {
    // Create a deterministic hash of the request parameters
    const normalized = {
      model: params.model || 'default',
      content: this.normalizeContent(params),
      config: {
        temperature: params.temperature,
        maxTokens: params.maxTokens
      }
    };

    return this.hash(JSON.stringify(normalized));
  }

  /**
   * Normalize content for consistent hashing
   */
  private normalizeContent(params: any): string {
    if (params.messages) {
      // For chat messages, use the last few messages for deduplication
      const recentMessages = params.messages.slice(-3); // Last 3 messages
      return JSON.stringify(recentMessages);
    }

    if (params.prompt) {
      return params.prompt.trim().toLowerCase();
    }

    return JSON.stringify(params);
  }

  /**
   * Simple hash function for creating keys
   */
  private hash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Clean up old requests
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.MAX_REQUEST_AGE) {
        this.pendingRequests.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old requests`);
    }
  }

  /**
   * Get current statistics
   */
  getStats(): {
    pendingRequests: number;
    totalSubscribers: number;
    oldestRequest: number | null;
  } {
    const requests = Array.from(this.pendingRequests.values());
    const totalSubscribers = requests.reduce((sum, req) => sum + req.subscribers, 0);
    const oldestRequest = requests.length > 0
      ? Math.min(...requests.map(r => r.timestamp))
      : null;

    return {
      pendingRequests: this.pendingRequests.size,
      totalSubscribers,
      oldestRequest
    };
  }

  /**
   * Clear all pending requests (useful for testing or reset)
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Destroy the deduplicator and clean up resources
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Convenience function for AI chat requests
 */
export async function deduplicateAIRequest<T>(
  model: string,
  messages: any[],
  requestFn: () => Promise<T>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    maxAge?: number;
  }
): Promise<T> {
  const key = requestDeduplicator.createKey({
    model,
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens
  });

  return requestDeduplicator.deduplicate(key, requestFn, {
    maxAge: options?.maxAge,
    priority: 'normal'
  });
}

/**
 * Convenience function for syntax highlighting requests
 */
export async function deduplicateHighlightRequest<T>(
  code: string,
  language: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const key = requestDeduplicator.createKey({
    action: 'highlight',
    code: code.slice(0, 200), // Use first 200 chars for key
    language
  });

  return requestDeduplicator.deduplicate(key, requestFn, {
    maxAge: 300000, // 5 minutes for syntax highlighting
    priority: 'low'
  });
}
