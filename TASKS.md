# Current Tasks --- Social V3

## Objetivo atual

FASE 2: concluir interacoes sociais do feed privado.

## Auditoria obrigatória

Antes de alterar: - identificar stack; - rotas; - autenticação; -
banco; - componentes; - Home; - álbuns; - mural; - música; -
persistência.

Registrar mentalmente ou de forma curta: Funcionalidade \| Existe \|
Funciona \| Reutilizar \| Alterar

## Implementar agora

1.  SocialLayout.
2.  Sidebar desktop.
3.  Feed central.
4.  Composer "Compartilhe um momento... 💕".
5.  PostCard.
6.  Renderização de texto e mídia já suportada.
7.  Painel direito com cards afetivos.
8.  Header/bottom navigation mobile.
9.  Estados loading/empty/error.
10. Responsividade.

## Preservar

-   álbuns;
-   mural;
-   música;
-   dados existentes;
-   uploads existentes;
-   personalizações existentes.

## Não fazer nesta fase

-   algoritmo de recomendação;
-   seguidores;
-   trending;
-   chat público;
-   refatoração total do banco;
-   recriar autenticação funcional;
-   implementar todas as notificações;
-   reescrever página interna dos álbuns.

## Finalização

-   build;
-   lint;
-   testes disponíveis;
-   corrigir erros;
-   atualizar TASKS.md;
-   marcar progresso no ROADMAP.md;
-   parar antes da Fase 3.


## Fase 2 - Interacoes sociais (status)

- Curtidas, salvamentos, comentarios e notificacoes persistem no PostgreSQL.
- Autorizacao no servidor para editar/excluir posts e comentarios, e marcar momento especial.
- Menus de post, confirmacoes, edicao, exclusao e vinculo a album adicionados.
- Notificacoes abrem o post relacionado e podem ser marcadas como lidas individualmente.
- Migration pendente de aplicar na Neon: migrations/0002_post_updates.sql.
- Validacao local: typecheck, lint e build passaram; nao ha script de testes no package.json.
- Limitacao existente: selecao de perfil por cookie nao e autenticacao forte; proteger o deploy antes de expor publicamente.
