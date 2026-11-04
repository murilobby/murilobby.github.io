# murilobby.github.io

Meu portfólio pessoal: **[murilobby.github.io](https://murilobby.github.io/)**.

Site estático em HTML, CSS e JavaScript puros, sem framework nem etapa de build, publicado pelo GitHub Pages a partir da branch `main`.

## Rodar localmente

Abra o `index.html` no navegador ou sirva a pasta:

```sh
python -m http.server 8000
```

## Arquivos

- `index.html`: conteúdo da página e dados estruturados (JSON-LD)
- `styles.css`: estilos e layout responsivo
- `script.js`: menu mobile, animações e foto ampliada
- `murilo-lobo.jpg`, `favicon.svg`: imagens

Ao alterar `styles.css` ou `script.js`, aumente o `?v=` correspondente no `index.html`, para o navegador não usar a versão antiga guardada em cache.

## Licença

O código está sob a licença [MIT](LICENSE). A foto e os textos pessoais não estão incluídos e continuam reservados.
