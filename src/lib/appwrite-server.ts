import { Client, Users, Account, ID } from "node-appwrite";

function getUsersClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
  return new Users(client);
}

function getAccountClient() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
  return new Account(client);
}

export async function getAppwriteUser(userId: string) {
  const users = getUsersClient();
  try {
    return await users.get(userId);
  } catch {
    return null;
  }
}

export async function listAppwriteUsers() {
  const users = getUsersClient();
  try {
    const result = await users.list();
    return result.users;
  } catch {
    return [];
  }
}

export async function createAppwriteUser(email: string, password: string, name: string) {
  const users = getUsersClient();
  return users.create(ID.unique(), email, password, name);
}

export async function deleteAppwriteUser(userId: string) {
  const users = getUsersClient();
  return users.delete(userId);
}

export async function createSession(userId: string, secret: string) {
  const account = getAccountClient();
  return account.createSession(userId, secret);
}

export async function deleteSession(sessionId: string) {
  const account = getAccountClient();
  return account.deleteSession(sessionId);
}