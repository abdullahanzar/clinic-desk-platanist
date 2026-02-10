import { MongoClient, Db } from "mongodb";

const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Please add MONGODB_URI to your environment variables. " +
      "For local development, add it to .env.local. " +
      "For Docker, set it in docker-compose.yml or .env file."
    );
  }
  return uri;
}

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  const uri = getMongoUri();

  if (process.env.NODE_ENV === "development") {
    // In development, use a global variable to preserve the client across HMR
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production, create a new client
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export default getClientPromise;

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db("platanist-opd");
}