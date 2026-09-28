# Architecture

## Regra

Adaptar a arquitetura atual. Não migrar framework/banco sem motivo.

## Domínios

-   auth
-   profiles
-   feed
-   posts
-   comments
-   reactions
-   notifications
-   albums
-   memories
-   music
-   wall
-   special-dates
-   settings

## Fluxo

Pages/UI → Feature Components → Hooks/State → Services → Repository/API
→ Database/Storage

## Feed

Começar cronológico. Não criar algoritmo de recomendação complexo.

Paginação: - cursor quando suportado; - evitar carregar histórico
inteiro.

## Mídia

-   storage externo existente;
-   thumbnails;
-   lazy loading;
-   compressão;
-   upload com progresso.

## Realtime

Se a stack existente suportar realtime, usar para: - novos posts; -
comentários; - curtidas; - notificações. Caso contrário, não trocar toda
a infraestrutura apenas por isso.
