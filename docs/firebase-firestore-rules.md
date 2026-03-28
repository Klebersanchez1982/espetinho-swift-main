# Regras de seguranca Firestore (passo a passo)

Este projeto usa duas colecoes principais:
- `products`
- `orders`

## 1) Publicar regras no Console Firebase
1. Acesse o projeto no Console Firebase.
2. Abra Firestore Database.
3. Clique na aba Rules.
4. Copie o conteudo de `firestore.rules`.
5. Cole no editor de regras.
6. Clique em Publish.

## 2) Entender o que estas regras exigem
As regras usam Firebase Auth + role salva em `users/{uid}.role` com um destes valores:
- `garcom`
- `assador`
- `caixa`

Sem autenticacao, leitura/escrita sera negada.
Sem role definida no documento do usuario, acesso de equipe sera negado.
Depois de criada, a role nao pode ser alterada pelo proprio usuario (apenas `updatedAt` pode mudar).

## 3) Matriz de permissao
- `users`
  - read: proprio usuario autenticado e Caixa (admin)
  - create: proprio usuario autenticado, definindo role inicial
  - update: proprio usuario autenticado, sem trocar role (somente `updatedAt`)
  - update admin: Caixa pode alterar role de qualquer usuario
  - delete: bloqueado
- `products`
  - read: garcom, assador, caixa
  - create/update/delete: somente caixa
- `orders`
  - read: garcom, assador, caixa
  - create: garcom
  - update: membros da equipe (garcom, assador, caixa)
  - delete: caixa

## 4) Validacoes de dados aplicadas
- Produto exige: `name`, `price`, `category`, `available`, `stock` com tipos corretos.
- Comanda exige: `table`, `client`, `items`, `status`, `createdAt` e validacao de cada item.
- Metodos de pagamento permitidos: `dinheiro`, `pix`, `cartao`.

## 5) Habilitar Auth Email/Senha no Firebase
1. Acesse Firebase Console > Authentication.
2. Clique em Get started (se necessario).
3. Em Sign-in method, habilite Email/Password.
4. Salve.

Sem isso, a tela de login do app nao conseguira autenticar.

## 6) Regra temporaria (somente teste)
Se precisar testar sem Auth pronto, use regra aberta por tempo curto:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Depois, volte imediatamente para as regras seguras em `firestore.rules`.

## 7) Proximo passo recomendado
Painel administrativo de usuarios ja implementado na aba `Usuarios` do perfil Caixa.
Como evolucao, voce pode migrar controle de role para custom claims no backend.
