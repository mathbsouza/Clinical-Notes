# Como atualizar o GitHub Pages

Este projeto publica o site automaticamente pelo GitHub Actions. Sempre que uma alteração é enviada para a branch `main`, o workflow `.github/workflows/pages.yml` gera o site e publica a pasta `dist/` no GitHub Pages.

## Atualização normal

Abra o PowerShell na pasta do projeto e confira o que foi alterado:

```powershell
git status
```

Antes de publicar, teste o site localmente:

```powershell
npm install
npm run dev
```

O terminal mostrará um endereço local, normalmente `http://localhost:5173`. Abra esse endereço no navegador e confira as alterações. Para encerrar o servidor, pressione `Ctrl+C`.

Em seguida, valide a versão de produção:

```powershell
npm run build
```

Se o comando terminar sem erros, adicione somente os arquivos que deseja publicar. Por exemplo:

```powershell
git add README.md
git add "src/content/Doenças/Especialidade/Assunto/Assunto.md"
```

Use aspas quando o caminho tiver espaços ou acentos. Confira novamente os arquivos preparados para o commit:

```powershell
git status
```

Crie o commit e envie-o para o GitHub:

```powershell
git commit -m "Atualiza notas clínicas"
git push origin main
```

O `push` inicia a publicação automaticamente. Não é necessário enviar a pasta `dist/` nem criar uma branch `gh-pages`.

## Acompanhar a publicação

1. Abra o repositorio `mathbsouza/ClinicalNotes` no GitHub.
2. Entre na aba **Actions**.
3. Abra a execução chamada **Deploy Clinical Notes to GitHub Pages**.
4. Aguarde os jobs `build` e `deploy` ficarem verdes.
5. Abra o site pelo endereço exibido no job `deploy` ou em **Settings > Pages**.

A atualização pode levar alguns minutos para aparecer. Se o deploy estiver verde, mas o navegador ainda mostrar a versão anterior, recarregue a página com `Ctrl+F5`.

## Primeira configuração do repositório

Esta etapa precisa ser feita apenas uma vez:

1. No GitHub, abra **Settings > Pages**.
2. Em **Build and deployment**, selecione **GitHub Actions** como fonte.
3. Confirme que o GitHub Pages está habilitado para o repositório.

O workflow já possui as permissões necessárias para publicar o site.

## Executar novamente sem criar outro commit

Se for preciso repetir uma publicação:

1. Abra **Actions** no GitHub.
2. Selecione **Deploy Clinical Notes to GitHub Pages**.
3. Clique em **Run workflow**.
4. Escolha a branch `main` e confirme em **Run workflow**.

## Problemas comuns

### `git push` foi rejeitado

Pode haver mudanças mais recentes no GitHub. Traga-as para sua branch e tente novamente:

```powershell
git pull --rebase origin main
git push origin main
```

Se surgir um conflito, resolva os arquivos indicados antes de continuar. Não force o envio com `--force` sem entender quais mudanças seriam substituídas.

### O job `build` falhou

Reproduza as verificações no computador:

```powershell
npm ci
npm run build
```

Leia a primeira mensagem de erro, corrija o arquivo indicado, crie outro commit e envie novamente.

### O workflow nao iniciou

Confira se o commit realmente chegou à `main`:

```powershell
git branch --show-current
git status
git log -1 --oneline
```

O deploy automático somente é disparado por alterações enviadas para a branch `main`. Também é possível iniciá-lo manualmente pela aba **Actions**.
