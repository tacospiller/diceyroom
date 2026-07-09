import { randomUUID } from "node:crypto";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ddb,
  USERS_TABLE,
  GOOGLE_ID_INDEX,
  USERNAME_INDEX,
} from "../db/dynamo";
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

  async findByUsername(username: string): Promise<User | null> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: USERNAME_INDEX,
        KeyConditionExpression: "username = :u",
        ExpressionAttributeValues: { ":u": username },
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
      username: input.username,
      profileImageUrl: input.profileImageUrl,
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
    const sets: string[] = ["updatedAt = :now"];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {
      ":now": new Date().toISOString(),
    };

    if (fields.username !== undefined) {
      sets.push("#u = :username");
      names["#u"] = "username";
      values[":username"] = fields.username;
    }
    if (fields.profileImageUrl !== undefined) {
      sets.push("profileImageUrl = :img");
      values[":img"] = fields.profileImageUrl;
    }

    const res = await ddb.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ...(Object.keys(names).length
          ? { ExpressionAttributeNames: names }
          : {}),
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );
    return res.Attributes as User;
  }
}
