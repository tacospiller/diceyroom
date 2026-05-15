import config from '../config';
import { Database } from './Database';
import { DynamoDBDatabase } from './DynamoDBDatabase';
import { LocalDatabase } from './LocalDatabase';

function createDatabase(): Database {
  if (config.db === 'dynamodb') {
    return new DynamoDBDatabase(config.dynamodb.region, config.dynamodb.endpoint);
  }
  return new LocalDatabase(config.local.dataDir);
}

const db: Database = createDatabase();

export default db;
