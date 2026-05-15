import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { Database, DBDocument } from './Database';
import { DuplicateException } from './errors';

export class DynamoDBDatabase implements Database {
  private readonly client: DynamoDBDocumentClient;

  constructor(region: string, endpoint?: string) {
    const base = new DynamoDBClient({ region, ...(endpoint ? { endpoint } : {}) });
    this.client = DynamoDBDocumentClient.from(base);
  }

  async query<T extends DBDocument>(table: string, filter: Partial<T>, projection?: (keyof T)[]): Promise<Partial<T>[]> {
    const filterEntries = Object.entries(filter).filter(([, v]) => v !== undefined) as [string, unknown][];
    const hasFilter = filterEntries.length > 0;
    const hasProjection = projection && projection.length > 0;

    const expressionAttributeNames: Record<string, string> = {
      ...(hasFilter && Object.fromEntries(filterEntries.map(([k], i) => [`#f${i}`, k]))),
      ...(hasProjection && Object.fromEntries(projection!.map((k, i) => [`#p${i}`, k as string]))),
    };

    const { Items } = await this.client.send(new ScanCommand({
      TableName: table,
      ...(hasFilter && {
        FilterExpression: filterEntries.map((_, i) => `#f${i} = :v${i}`).join(' AND '),
        ExpressionAttributeValues: Object.fromEntries(filterEntries.map(([, v], i) => [`:v${i}`, v])),
      }),
      ...(hasProjection && {
        ProjectionExpression: projection!.map((_, i) => `#p${i}`).join(', '),
      }),
      ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames }),
    }));
    return (Items ?? []) as Partial<T>[];
  }

  async get<T extends DBDocument>(table: string, key: string): Promise<T | null> {
    const { Item } = await this.client.send(
      new GetCommand({ TableName: table, Key: { key } }),
    );
    return (Item as T) ?? null;
  }

  async create<T extends DBDocument>(table: string, item: T): Promise<void> {
    try {
      await this.client.send(
        new PutCommand({
          TableName: table,
          Item: item,
          ConditionExpression: 'attribute_not_exists(#k)',
          ExpressionAttributeNames: { '#k': 'key' },
        }),
      );
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) throw new DuplicateException(table, item.key);
      throw err;
    }
  }

  async save<T extends DBDocument>(table: string, item: T): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: table,
        Item: item,
      }),
    );
  }
}
