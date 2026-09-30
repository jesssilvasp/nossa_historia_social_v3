# Current Tasks --- Social V3

## Objetivo atual

PROJETO CONCLUÍDO - Todas as fases implementadas.

## Auditoria obrigatória

Antes de alterar: - identificar stack; - rotas; - autenticação; -
banco; - componentes; - Home; - álbuns; - mural; - música; -
persistência.

Registrar mentalmente ou de forma curta: Funcionalidade \| Existe \|
Funciona \| Reutilizar \| Alterar

## Preservar

-   dados existentes;
-   uploads existentes;
-   personalizações existentes.

## Fase 7 - Qualidade (status)

- Segurança: headers CSP, X-Frame-Options, rate limiting no middleware, sanitização de inputs (XSS protection) em todas as rotas API.
- Acessibilidade: focus-visible, prefers-reduced-motion, ARIA labels, semântica HTML, contraste adequado.
- Performance: compressão gzip, headers de cache, lazy loading de imagens, skeleton loaders.
- Realtime: notificações via polling (pronto para SSE/WS futuro).
- Testes: build, lint, typecheck passando.
- Mobile: revisão completa - bottom nav, touch targets, responsividade.

Build, lint e typecheck passando.

## Integração Appwrite (status)

- Híbrido: banco relacional permanece no Neon/PostgreSQL (Drizzle); Appwrite só para Auth/Storage.
- Storage (`src/lib/storage.ts` + `src/lib/appwrite.ts`): `saveUpload` envia ao bucket `uploads` do Appwrite; `removeUploadUrl` exclui por fileId; `readUpload` legado retorna null (rota `/api/files/[name]` responde 404 para URLs antigas locais).
- Auth server (`src/app/api/auth/route.ts`): login, register, logout, magic-link, verify-magic via `node-appwrite`; cookie `a_session` httpOnly (secure só em produção).
- Auth client (`src/lib/appwrite-auth.ts`): helpers `login`, `register`, `logout`, `getCurrentUser`, magic link via SDK `appwrite`.
- Auth admin (`src/lib/appwrite-server.ts`): `getAppwriteUser`, `listAppwriteUsers`, `createAppwriteUser`, `deleteAppwriteUser`, sessões.
- Sessão de perfil (`nha_profile`) preservada no PostgreSQL; `DELETE /api/session` agora limpa `nha_profile` e `a_session`.
- YouTube/Spotify (`src/app/api/resolve-audio/route.ts` + composer): cola link no campo de música, resolve título/artista/URL de áudio/capa; `PlayerTrack.id` aceita `number | string`; `PostCard` toca música do post.
- Pendente no Console Appwrite: criar bucket `uploads` (read/write para `users`); habilitar providers de Auth; gerar API key (`users` + `files` + `account`).
- Pendente no Vercel: `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `DATABASE_URL`; `SPOTIFY_TOKEN` opcional.
- Validado local: typecheck, lint (1 warning pré-existente de `<img>`) e build passando com `DATABASE_URL` do Neon.
- Debug música YouTube (sem som no ar): `/api/resolve-audio` agora retorna o erro real do `ytdl-core` (`console.error` server + mensagem no JSON); composer mostra toast de erro/sucesso em vez de silenciar; player loga `audio.error` e rejeição de `play()` no console do navegador.
- Fix deploy Vercel (`src/db/index.ts`): não lança mais no import sem `DATABASE_URL`; usa placeholder + `console.warn` para a coleta de páginas do build passar; fallbacks existentes (`session`/`data`/`bootstrap`) cobrem runtime sem banco. Build validado localmente SEM `DATABASE_URL`.
- Lembrete: `DATABASE_URL` continua obrigatória em runtime (Production/Preview/Development no Vercel) para o app funcionar de verdade.
## Corre��o do player de m�sica

- Links do YouTube/Spotify preservam a URL original e usam embeds oficiais; o endpoint resolve apenas metadados via oEmbed.
- MP3 direto continua compat�vel com o player HTML Audio.
- CSP permite frames apenas dos dom�nios dos players oficiais usados.


## Player via links � atualiza��o

- Cadastro da playlist aceita links YouTube/Spotify e resolve t�tulo/artista/capa automaticamente.
- Player global oferece controles pr�prios para YouTube; Spotify usa o player oficial para comandos e seek.
- CSP libera scripts e frames oficiais do YouTube e Spotify.

- Ao adicionar uma faixa, ela tamb�m � selecionada para aparecer no player global; inicializa��o dos callbacks dos players oficiais corrigida.

- Neon local: DATABASE_URL usa sslmode=verify-full; pg-connection-string carrega a configuracao sem aviso de SSL.

- YouTube IFrame API: comandos aguardam onReady para evitar loadVideoById antes de o player estar pronto.

- Player YouTube: barra permite recolher o video para um quadro flutuante visivel de 320x200, preservando o mesmo iframe e a reproducao.

- Player unificado no card direito: video YouTube e controles no mesmo lugar, volume persistente (0-100), sem barra musical inferior; no celular o card aparece no canto direito quando uma faixa e escolhida.

- Mobile: botao Player sempre visivel no canto direito; abre o card mesmo antes da primeira faixa ser selecionada e permite iniciar a musica salva. O card abre automaticamente ao escolher uma faixa.

- Mobile: toque fora do player expandido recolhe o card sem parar a reproducao; botao Player reabre. YouTube mantem o mesmo iframe visivel em 200x200 no modo compacto.
