import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "../config/env";

const baseClient = new DynamoDBClient({
  region: env.AWS_REGION,
  // When DYNAMODB_ENDPOINT is set (e.g. DynamoDB Local) point the SDK at it.
  ...(env.DYNAMODB_ENDPOINT ? { endpoint: env.DYNAMODB_ENDPOINT } : {}),
});

// DocumentClient marshals/unmarshals native JS objects <-> DynamoDB attribute maps.
export const ddb = DynamoDBDocumentClient.from(baseClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

export const USERS_TABLE = env.DYNAMODB_TABLE;
export const GOOGLE_ID_INDEX = "GoogleIdIndex";
export const USERNAME_INDEX = "UsernameIndex";
