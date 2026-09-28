# Database --- Social V3

Adaptar ao schema existente e evitar tabelas duplicadas.

## profiles

-   id
-   display_name
-   username
-   avatar_url
-   cover_url nullable
-   bio nullable
-   created_at
-   updated_at

## posts

-   id
-   author_id
-   body
-   post_type
-   special_moment boolean
-   album_id nullable
-   created_at
-   updated_at

## post_media

-   id
-   post_id
-   media_type: image\|video
-   url
-   thumbnail_url nullable
-   position
-   created_at

## comments

-   id
-   post_id
-   author_id
-   body
-   created_at
-   updated_at

## reactions

-   id
-   post_id
-   user_id
-   reaction_type
-   created_at Unique recomendado: post_id + user_id + reaction_type

## saved_posts

-   user_id
-   post_id
-   created_at

## notifications

-   id
-   recipient_id
-   actor_id nullable
-   type
-   post_id nullable
-   comment_id nullable
-   read_at nullable
-   created_at

## albums

-   preservar/adaptar estrutura atual.

## album_memories

-   preservar/adaptar estrutura atual.

## wall_messages

-   preservar/adaptar estrutura atual.

## special_dates

-   id
-   title
-   date
-   emoji nullable
-   description nullable

## music_items

Apenas se necessário para o player atual. Não armazenar áudio protegido
indevidamente.

## Regras

-   Foreign keys.
-   Índices para feed, comentários e notificações.
-   Autorização por usuário.
-   Migrations versionadas.
