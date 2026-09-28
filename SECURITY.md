# Security --- Private Social App

## Privacidade

A aplicação deve ser privada por padrão.

-   Não expor feed sem autenticação quando auth existir.
-   Usuário só pode editar/excluir seu próprio conteúdo, salvo regra
    administrativa explícita.
-   Não confiar em autorização apenas no frontend.
-   Se usar Supabase, aplicar RLS adequada.

## Upload

-   MIME permitido;
-   extensão;
-   tamanho;
-   limite de quantidade;
-   nomes seguros;
-   URLs controladas.

## Inputs

Sanitizar: - posts; - comentários; - mural; - bios; - legendas.

## Secrets

Nunca enviar secrets ao bundle frontend. Nunca commitar .env.

## Música

Não implementar stream ripping ou download permanente não autorizado.

## Exclusão

Ações destrutivas precisam de confirmação. Evitar exclusão em cascata
acidental sem regra explícita.
