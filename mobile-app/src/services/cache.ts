import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private prefix = '@automation_dashboard_';

  async set<T>(key: string, data: T, ttlSeconds = 3600): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };
    await AsyncStorage.setItem(
      this.prefix + key,
      JSON.stringify(entry)
    );
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(this.prefix + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const elapsed = Date.now() - entry.timestamp;

      if (elapsed > entry.ttl) {
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter((key) =>
      key.startsWith(this.prefix)
    );
    await AsyncStorage.multiRemove(keysToRemove);
  }
}

export const cacheService = new CacheService();
