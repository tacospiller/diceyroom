/**
 * Create the Users DynamoDB table (idempotent).
 * Run with: npm run db:init
 *
 * Works against real AWS or DynamoDB Local (set DYNAMODB_ENDPOINT).
 */
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import { env } from "../config/env";
import { GOOGLE_ID_INDEX, USERNAME_INDEX } from "../db/dynamo";

const client = new DynamoDBClient({
  region: env.AWS_REGION,
  ...(env.DYNAMODB_ENDPOINT ? { endpoint: env.DYNAMODB_ENDPOINT } : {}),
});

async function tableExists(name: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch (err) {
    if (err instanceof ResourceNotFoundException) return false;
    throw err;
  }
}

async function main(): Promise<void> {
  const TableName = env.DYNAMODB_TABLE;

  if (await tableExists(TableName)) {
    console.log(`Table "${TableName}" already exists — nothing to do.`);
    return;
  }

  await client.send(
    new CreateTableCommand({
      TableName,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "googleId", AttributeType: "S" },
        { AttributeName: "username", AttributeType: "S" },
      ],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      GlobalSecondaryIndexes: [
        {
          IndexName: GOOGLE_ID_INDEX,
          KeySchema: [{ AttributeName: "googleId", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
        },
        {
          IndexName: USERNAME_INDEX,
          KeySchema: [{ AttributeName: "username", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
        },
      ],
    })
  );

  console.log(
    `Created table "${TableName}" with GSIs "${GOOGLE_ID_INDEX}", "${USERNAME_INDEX}".`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to create table:", err);
    process.exit(1);
  });
