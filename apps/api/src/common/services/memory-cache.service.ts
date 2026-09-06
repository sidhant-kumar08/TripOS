import { Injectable, OnModuleDestroy } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class MemoryCacheService implements OnModuleDestroy {

  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Sweep expired cache entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.sweepExpired();
    }, 60000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Retrieves an item from cache if it exists and hasn't expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Stores an item with a time-to-live in seconds.
   */
  set<T>(key: string, value: T, ttlSeconds: number = 30): void {
    if (ttlSeconds <= 0) return;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Deletes a specific cache key.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Deletes all keys matching a prefix or regex pattern.
   */
  deletePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern) || key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears all cached domain data for a specific trip.
   */
  invalidateTrip(tripId: string): void {
    this.deletePattern(`trip:${tripId}`);
  }

  /**
   * Clears all cached domain data for a specific user.
   */
  invalidateUser(userId: string): void {
    this.deletePattern(`user:${userId}`);
  }

  /**
   * Removes all expired cache records.
   */
  private sweepExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
