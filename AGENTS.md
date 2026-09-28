# Agent Instructions

## Contexto mínimo

Para cada tarefa: 1. Leia PROJECT.md. 2. Leia TASKS.md. 3. Consulte
somente os MDs relacionados. 4. Para UI, leia UI.md. 5. Para
modelos/persistência, leia DATABASE.md. 6. Para componentes, leia
COMPONENTS.md. 7. Para segurança/autorização, leia SECURITY.md. 8.
ARCHITECTURE.md somente quando necessário.

## Economia de tokens

-   Não leia todo o repositório.
-   Não releia arquivos sem relação com a tarefa.
-   Prefira patches pequenos.
-   Não reescreva arquivos completos sem necessidade.
-   Não replique documentação em comentários.
-   Reutilize componentes existentes.
-   Atualize TASKS.md após concluir trabalho.
-   Atualize ROADMAP.md apenas quando o estado da fase mudar.

## Regra crítica

O projeto já existe. Antes de substituir algo, descubra se já existe e
funciona.

## Qualidade

-   Tipagem estrita quando aplicável.
-   Sem secrets no cliente.
-   Componentes pequenos.
-   Regras de negócio fora da UI.
-   Estados loading/error/empty.
-   Responsividade.
-   Acessibilidade.
-   Executar build/lint/testes disponíveis.
