import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Account, Client, ID } from "node-appwrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAccount() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
  return new Account(client);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action;
  const store = await cookies();

  try {
    switch (action) {
      case "login": {
        const { email, password } = body;
        if (!email || !password) return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 });

        const account = getAccount();
        const session = await account.createEmailPasswordSession(email, password);

        store.set("a_session", session.secret, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });

        return NextResponse.json({ user: session.userId });
      }

      case "register": {
        const { email, password, name } = body;
        if (!email || !password || !name) return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });

        const account = getAccount();
        const user = await account.create(ID.unique(), email, password, name);
        const session = await account.createEmailPasswordSession(email, password);

        store.set("a_session", session.secret, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });

        return NextResponse.json({ user: user.$id });
      }

      case "logout": {
        const sessionSecret = store.get("a_session")?.value;
        if (sessionSecret) {
          const account = getAccount();
          try {
            await account.deleteSession("current");
          } catch {}
        }
        store.delete("a_session");
        return NextResponse.json({ ok: true });
      }

      case "magic-link": {
        const { email, url } = body;
        if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

        const account = getAccount();
        await account.createMagicURLToken(email, url || `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`);
        return NextResponse.json({ ok: true });
      }

      case "verify-magic": {
        const { userId, secret } = body;
        if (!userId || !secret) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

        const account = getAccount();
        const session = await account.createSession(userId, secret);

        store.set("a_session", session.secret, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });

        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Auth error:", error);
    const message = error instanceof Error ? error.message : "Erro na autenticação";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function GET() {
  const store = await cookies();
  const sessionSecret = store.get("a_session")?.value;

  if (!sessionSecret) return NextResponse.json({ user: null });

  try {
    const account = getAccount();
    const user = await account.get();
    return NextResponse.json({ user });
  } catch {
    store.delete("a_session");
    return NextResponse.json({ user: null });
  }
}