import { asc } from "drizzle-orm";
import { db } from "@/db";
import { albums, albumMemories, posts, profiles, settings, specialDates, tracks, wallMessages } from "@/db/schema";
import { sql } from "drizzle-orm";

let bootstrapped = false;

const STOCK = {
  a1: "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200",
  a2: "https://images.pexels.com/photos/1441472/pexels-photo-1441472.jpeg?auto=compress&cs=tinysrgb&w=1200",
  a3: "https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=1200",
  a4: "https://images.pexels.com/photos/3771089/pexels-photo-3771089.jpeg?auto=compress&cs=tinysrgb&w=1200",
  a5: "https://images.pexels.com/photos/386009/pexels-photo-386009.jpeg?auto=compress&cs=tinysrgb&w=1200",
  a6: "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1200",
};

/**
 * Cria dados base apenas na primeira execução (idempotente).
 * Preserva qualquer dado que já exista no banco.
 */
export async function ensureBootstrap(): Promise<void> {
  if (bootstrapped) return;
  try {
    await db
      .insert(settings)
      .values({ id: 1, startDate: "2023-03-11", city: "Guarulhos" })
      .onConflictDoNothing();

    const existing = await db.select({ id: profiles.id }).from(profiles).limit(1);
    if (existing.length === 0) {
      const created = await db
        .insert(profiles)
        .values([
          {
            username: "maymay",
            displayName: "Mayara 💗",
            bio: "colecionando momentos com você ✨",
            avatarUrl: STOCK.a4,
          },
          {
            username: "meuamor",
            displayName: "Meu Amor ✨",
            bio: "você é o meu lugar favorito no mundo 💗",
            avatarUrl: STOCK.a5,
          },
        ])
        .returning({ id: profiles.id, username: profiles.username });

      const may = created.find((p) => p.username === "maymay")?.id ?? created[0].id;
      const love = created.find((p) => p.username === "meuamor")?.id ?? created[0].id;

      const [albumA, albumB] = await db
        .insert(albums)
        .values([
          { title: "brigada sp11", description: "nossos dias na cidade grande", coverUrl: STOCK.a1 },
          { title: "maymay ❤️", description: "retalhos da gente", coverUrl: STOCK.a2 },
        ])
        .returning({ id: albums.id });

      await db.insert(albumMemories).values([
        { albumId: albumA.id, url: STOCK.a1, kind: "image", caption: "espelho do apê" },
        { albumId: albumA.id, url: STOCK.a6, kind: "image", caption: "café da manhã" },
        { albumId: albumB.id, url: STOCK.a2, kind: "image", caption: "domingo lento" },
        { albumId: albumB.id, url: STOCK.a3, kind: "image", caption: "nossa trilha" },
      ]);

      const createdPosts = await db
        .insert(posts)
        .values([
          {
            authorId: may,
            content: "Nosso dia foi perfeito 💗 obrigada por existir do meu lado.",
            isSpecial: true,
            specialTitle: "O começo de tudo",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          },
          {
            authorId: love,
            content: "Guardando esse pôr do sol pra te mostrar depois ✨",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
          },
          {
            authorId: may,
            content: "Há um ano exatamente assim: rindo à toa 📸",
            isSpecial: true,
            specialTitle: "Lembra disso?",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
          },
        ])
        .returning({ id: posts.id });

      await db.execute(sql`
        insert into post_media (post_id, url, kind, position, alt)
        values
          (${createdPosts[0].id}, ${STOCK.a3}, 'image', 0, 'nossa selfie'),
          (${createdPosts[0].id}, ${STOCK.a1}, 'image', 1, 'rolê'),
          (${createdPosts[0].id}, ${STOCK.a6}, 'image', 2, 'detalhe'),
          (${createdPosts[1].id}, ${STOCK.a2}, 'image', 0, 'pôr do sol'),
          (${createdPosts[2].id}, ${STOCK.a5}, 'image', 0, 'há um ano')
      `);

      await db.insert(wallMessages).values([
        { authorId: may, content: "Te amo infinitamente ❤️", emoji: "❤️" },
        { authorId: love, content: "hoje foi bom demais com você", emoji: "☁️" },
      ]);

      await db.insert(tracks).values([
        {
          title: "Perfect",
          artist: "Ed Sheeran",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          coverUrl: STOCK.a3,
          favorite: true,
        },
        {
          title: "Nossa música do momento",
          artist: "Nós duas",
          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          coverUrl: STOCK.a1,
        },
      ]);

      await db.insert(specialDates).values([
        { title: "Nosso aniversário de namoro", date: "2023-03-11", emoji: "💕" },
        { title: "Viagem pra praia", date: "2026-07-12", emoji: "🌊", recurring: false },
      ]);
    }
    bootstrapped = true;
  } catch {
    // banco ainda não migrado (ex.: durante build) — tenta novamente na próxima requisição
  }
}

export const seedAssets = STOCK;
