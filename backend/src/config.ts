type DbType = 'local' | 'dynamodb';
type CacheType = 'memory' | 'redis';

interface Config {
  db: DbType;
  cache: CacheType;
  redis: {
    url: string;
  };
  dynamodb: {
    region: string;
    endpoint?: string;
  };
  local: {
    dataDir: string;
  };
  tables: {
    users: string;
    usernames: string;
    posts: string;
  };
  crypto: {
    salt: string;
  }
}

const config: Config = {
  db: (process.env.DB_TYPE as DbType) ?? 'local',
  cache: (process.env.CACHE_TYPE as CacheType) ?? 'memory',
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  dynamodb: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT,
  },
  local: {
    dataDir: process.env.LOCAL_DATA_DIR ?? './data',
  },
  tables: {
    users: process.env.TABLE_USERS ?? 'DiceyRoom-Users',
    usernames: process.env.TABLE_USERNAMES ?? 'DiceyRoom-UserNames',
    posts: process.env.TABLE_POSTS ?? 'DiceyRoom-Posts'
  },
  crypto: {
    salt: process.env.CRYPTO_SALT ?? 'dev-salt'
  }
};

export default config;
