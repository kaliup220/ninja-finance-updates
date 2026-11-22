# Ninja Finance 1.0.2

Aplicativo desktop de gestão financeira, com interface Ninja Finance, ícone original, atualização automática via GitHub Releases e armazenamento do usuário em `%APPDATA%\NinjaFinance\finance_data.json`.

## Código-fonte

- `main.js`: processo Electron, leitura e gravação atômica do JSON, backup, restauração e atualizador.
- `preload.js`: ponte IPC segura para a interface.
- `index.html`: interface e lógica financeira.
- `assets/`: ícone e logotipo do Ninja Finance.

## Dados e migração

O formato atual é JSON v3. Ao abrir um arquivo JSON v2 reconhecido, o aplicativo guarda uma cópia `finance_data.json.v2-backup-<data>.json` no mesmo diretório e migra os dados para v3. No modo navegador, as chaves v2 `ninja_finance_movements_v2` e `ninja_finance_initial_v2` são migradas para `ninja_finance_data_v3`; as chaves antigas permanecem como cópia.

A exclusão de um lançamento grava imediatamente o estado atualizado. A restauração substitui o conjunto atual de movimentações pelo conteúdo do backup, evitando duplicação.

## Desenvolvimento e empacotamento

Requer Node.js e npm compatíveis com Electron 34.5.8.

```powershell
npm ci
npm start
npm run dist
```

O instalador Windows é gerado em `release/`. Esta fonte está identificada como 1.0.2; a publicação oficial exige build e verificação do instalador, criação da Release GitHub `v1.0.2` com o instalador, `latest.yml` e `.blockmap`, e validação de atualização em uma instalação de teste.

## Identidade e configuração

Nome do produto: Ninja Finance. ID: `br.ninjatech.ninjafinance`. Atualizador: GitHub Releases do repositório `kaliup220/ninja-finance-updates`. A desinstalação mantém os dados em AppData.
