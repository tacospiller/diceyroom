import { env } from "./config/env";
import { UserRepository } from "./repositories/userRepository";
import { DynamoUserRepository } from "./repositories/dynamoUserRepository";
import { FileUserRepository } from "./repositories/fileUserRepository";
import { SessionStore } from "./stores/sessionStore";
import { RedisSessionStore } from "./stores/redisSessionStore";
import { FileSessionStore } from "./stores/fileSessionStore";
import { TokenService } from "./services/tokenService";
import { AuthService } from "./services/authService";

/**
 * Composition root. Chooses concrete implementations based on env.PERSISTENCE
 * so local dev ("file") needs neither DynamoDB nor Redis — data is stored in
 * JSON files under DATA_DIR — while production ("aws") uses DynamoDB + Redis.
 */
const useFiles = env.PERSISTENCE === "file";

if (useFiles) {
  console.warn(
    `[container] PERSISTENCE=file — storing users and sessions as JSON under ` +
      `"${env.DATA_DIR}". For local dev only; do not use in production.`
  );
}

export const userRepository: UserRepository = useFiles
  ? new FileUserRepository(env.DATA_DIR)
  : new DynamoUserRepository();

export const sessionStore: SessionStore = useFiles
  ? new FileSessionStore(env.DATA_DIR)
  : new RedisSessionStore();

export const tokenService = new TokenService(sessionStore);
export const authService = new AuthService(userRepository);

/** Release backing resources (Redis connection, pending file writes) on shutdown. */
export async function disconnect(): Promise<void> {
  await sessionStore.disconnect();
}
