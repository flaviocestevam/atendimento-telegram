# Testes E2E

## `profile-isolation.ts`

Valida que ao alternar o seletor de perfil, as telas **Dashboard, Conversas,
Leads, Planos e Pagamentos** nunca misturam dados entre vendedores.

O script faz login com um usuário real (mesma RLS do navegador) e, para cada
`seller_profile`, consulta as mesmas tabelas que as telas consomem
(`leads`, `conversations`, `messages`, `telegram_users`, `plans`,
`telegram_groups`, `payments`, `orders`, `access_grants`, `cakto_events`).

Falha (exit 1) se encontrar:

1. Linhas órfãs com `seller_profile_id = NULL`.
2. Linhas com `seller_profile_id` diferente do filtro aplicado.
3. Qualquer `id` que apareça simultaneamente sob dois perfis distintos.

### Como rodar

```bash
TEST_EMAIL=seu@email.com TEST_PASSWORD=suaSenha bun tests/e2e/profile-isolation.ts
```

Saída em caso de sucesso termina com `✅ PASS`.
