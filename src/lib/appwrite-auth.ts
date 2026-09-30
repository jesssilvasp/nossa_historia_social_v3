"use client";

import { Account, Client, ID } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);

export async function login(email: string, password: string) {
  return account.createEmailPasswordSession(email, password);
}

export async function register(email: string, password: string, name: string) {
  return account.create(ID.unique(), email, password, name);
}

export async function logout() {
  return account.deleteSession("current");
}

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

export async function updateProfile(name: string) {
  return account.updateName(name);
}

export async function updateEmail(email: string, password: string) {
  return account.updateEmail(email, password);
}

export async function updatePassword(oldPassword: string, newPassword: string) {
  return account.updatePassword(oldPassword, newPassword);
}

export async function createMagicLink(email: string, url: string) {
  return account.createMagicURLToken(email, url);
}

export async function verifyMagicLink(userId: string, secret: string) {
  return account.createSession(userId, secret);
}