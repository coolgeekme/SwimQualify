import { MongoClient, Db } from 'mongodb';

const MONGO_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'swimqualify';

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  
  client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB: ${DB_NAME}`);
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

export { db };
