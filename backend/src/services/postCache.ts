import config from "../config";
import db from "../db";

const TABLE = config.tables.posts;

export async function initializePostCache() {
    var posts = await db.query(TABLE);
    
}