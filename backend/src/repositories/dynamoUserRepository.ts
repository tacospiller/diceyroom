import { randomUUID } from "node:crypto";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, USERS_TABLE, GOOGLE_ID_INDEX } from "../db/dynamo";
import { User } from "../models/user";
import {
  CreateUserInput,
  UpdateProfileInput,
  UserRepository,
} from "./userRepository";

export class DynamoUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const res = await ddb.send(
      new GetCommand({ TableName: USERS_TABLE, Key: { id } })
    );
    return (res.Item as User) ?? null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: GOOGLE_ID_INDEX,
        KeyConditionExpression: "googleId = :g",
        ExpressionAttributeValues: { ":g": googleId },
        Limit: 1,
      })
    );
    return (res.Items?.[0] as User) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      googleId: input.googleId,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
      createdAt: now,
      updatedAt: now,
    };

    await ddb.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: user,
        // Guard against races creating two rows with the same id.
        ConditionExpression: "attribute_not_exists(id)",
      })
    );

    return user;
  }

  async updateProfile(id: string, fields: UpdateProfileInput): Promise<User> {
    const now = new Date().toISOString();
    const res = await ddb.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id },
        UpdateExpression:
          "SET email = :email, #n = :name, avatarUrl = :avatarUrl, updatedAt = :now",
        ExpressionAttributeNames: { "#n": "name" },
        ExpressionAttributeValues: {
          ":email": fields.email,
          ":name": fields.name,
          ":avatarUrl": fields.avatarUrl ?? null,
          ":now": now,
        },
        ReturnValues: "ALL_NEW",
      })
    );
    return res.Attributes as User;
  }
}
