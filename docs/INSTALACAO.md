# Testar no celular

## Preparação simples

Extraia o ZIP e abra a pasta `alem-da-voz-mobile` no VS Code. Use Terminal → Novo terminal. Execute:

```bash
npm run setup
```

O script não precisa de conta Expo e não publica nada. A primeira instalação exige internet. Se você tiver VPN ou vários adaptadores, o IP sugerido pode estar errado. Descubra o IP Wi-Fi do computador (`ipconfig` no Windows) e use-o no app em Ajustes → Conexão com o servidor.

Em dois terminais separados:

```bash
npm run api
```

```bash
npm run mobile
```

Deixe ambos abertos. Leia o QR Code com um cliente Expo compatível com SDK 58. Celular e computador devem estar na mesma rede. Caso o firewall pergunte, permita acesso do Node à rede privada que você está usando.

## Primeira conversa

1. Abra Meus sinais e capture uma pose com a mão inteira visível.
2. Indique a letra (por exemplo, a letra que você validou em Libras) e salve. Não há letras pré-treinadas neste pacote.
3. Salve outras capturas do mesmo sinal para ensinar variações. Ou importe seu arquivo `alem-da-voz-sinais.json`.
4. Em Ajustes, configure um gesto de confirmação diferente das letras.
5. Vá a Conversar, ative a câmera, aguarde o detector e mantenha o sinal até a barra completar.
6. Confira a letra. Faça o gesto de confirmação. Ela será adicionada ao campo da mensagem sem apertar um botão.
7. Solte o gesto e repita; para repetir a mesma letra, solte o gesto de confirmação antes de mostrá-la novamente.

## Testar login e CRUD

1. Em Ajustes, confira a URL da API, como `http://192.168.1.10:3000`.
2. Toque em Testar e salvar conexão. O app chama `/health`.
3. Toque em Entrar ou criar conta e registre uma conta de teste.
4. Em Frases, crie uma frase, abra-a, altere texto/favorito e salve.
5. Abra novamente e confira a alteração; depois exclua a frase.
6. Use outra conta e confira que ela não vê as frases da primeira.

O endereço `localhost` no celular significa o próprio celular, não seu computador. Um túnel do Expo resolve o acesso ao Metro, mas **não publica automaticamente a API**.

## Se o Expo Go não aceitar SDK 58

As versões do app da loja podem ser mais recentes que o SDK deste projeto. Consulte https://expo.dev/go. Se não houver Expo Go compatível para seu dispositivo, use um development build. Isso precisa de conta Expo, acesso à internet e, conforme a plataforma, ferramentas nativas/credenciais Apple.

Na pasta `app/mobile`:

```bash
npx expo install expo-dev-client
npx eas-cli build:configure
```

Acrescente ao `eas.json` um perfil `development` com `developmentClient: true` e `distribution: "internal"`; gere o build para seu sistema:

```bash
npx eas-cli build --profile development --platform android
npx expo start --dev-client
```

Para iPhone, use `--platform ios` e siga o fluxo de assinatura da Apple. As contas, certificados e geração de binários não estão incluídos neste ZIP.

## Gerar APK para instalar sem Expo Go

O projeto inclui `eas.json` com perfil `preview` gerando APK Android. Antes de distribuir, hospede a API com HTTPS, persistência para SQLite e variável JWT_SECRET. Configure `EXPO_PUBLIC_API_URL` com essa URL no ambiente do build (ou ajuste no próprio aplicativo).

Na pasta `app/mobile`:

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

Isso inicia a geração do APK na sua conta Expo; pode haver fila/limites de uso. Um build Android de distribuição pode bloquear HTTP; use HTTPS para a API. GitHub Pages não executa a API Node.js. O reconhecimento precisa de internet ao carregar o modelo, mesmo com o app instalado.

## Problemas comuns

| Situação                                  | O que conferir                                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| A câmera não abre                         | Permissão de câmera nas configurações do celular; feche outro app que esteja usando a câmera |
| Detector não carrega                      | Internet e acesso a jsDelivr e Google Storage; toque Tentar novamente                        |
| Nenhuma letra aparece                     | Sinal cadastrado/importado, apenas uma mão, boa luz, segurar até estabilizar                 |
| Aparece a letra errada                    | Mais capturas; desative Aceitar mais variações; confira sinais parecidos                     |
| A letra aparece, mas não entra na palavra | Configure gesto de confirmação diferente das letras; segure até completar                    |
| Não reconhece outra pessoa                | Cadastre referências com essa pessoa; não há garantia universal de reconhecimento            |
| API não conecta                           | Terminal da API aberto, URL/IP, mesma rede Wi-Fi e firewall; use Testar conexão              |
| Reiniciar o app perde frases              | API usando o mesmo arquivo de banco; conta correta; volume persistente se hospedada          |

## Usar em apresentação

Prepare antes: conta de teste, referências de quem vai apresentar, gesto de confirmação, Wi-Fi e API ligada. Teste o fluxo inteiro no próprio aparelho que será usado. Não dependa de uma instalação de última hora.
