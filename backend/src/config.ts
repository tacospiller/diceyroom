type DbType = 'local' | 'dynamodb';

interface Config {
  db: DbType;
  dynamodb: {
    region: string;
    endpoint?: string;
  };
  local: {
    dataDir: string;
  };
  tables: {
    users: string;
    posts: string;
  };
}

const config: Config = {
  db: (process.env.DB_TYPE as DbType) ?? 'local',
  dynamodb: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpoint: process.env.DYNAMODB_ENDPOINT,
  },
  local: {
    dataDir: process.env.LOCAL_DATA_DIR ?? './data',
  },
  tables: {
    users: process.env.TABLE_USERS ?? 'DiceyRoom-Users',
    posts: process.env.TABLE_POSTS ?? 'DiceyRoom-Posts'
  },
};

export default config;
