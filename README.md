# LiveShop Tools — distribuição

Este repositório é **público de propósito** e contém apenas duas coisas:

- a **landing page** de download, servida pelo GitHub Pages;
- as **Releases** com o instalador do LiveShop Tools para Windows.

O código-fonte não mora aqui.

## Por que ele existe separado

A landing descobre qual é o instalador mais recente por uma chamada anônima à
API de releases do GitHub. Num repositório privado essa chamada devolve 404 e o
botão de download quebra. O `electron-updater` dos aplicativos já instalados
consulta exatamente o mesmo endereço.

Então as Releases precisam de um repositório público. O código não — e continua
num privado.

## Não edite os arquivos daqui

O conteúdo da landing é **gerado por espelhamento**: ele é editado no
repositório privado, em `landing/`, e sobrescrito aqui a cada publicação.
Qualquer alteração feita direto neste repositório se perde na próxima.

Este `README.md` é a única exceção — o espelhamento o preserva.

## Download

O instalador está em [Releases](../../releases). Confira a página de download
para as instruções de instalação.
