import config from '../config';
import { Cache } from './Cache';
import { MemoryCache } from './MemoryCache';
import { RedisCache } from './RedisCache';

function createCache(): Cache {
  if (config.cache === 'redis') {
    return new RedisCache(config.redis.url);
  }
  return new MemoryCache();
}

const cache: Cache = createCache();

export default cache;
