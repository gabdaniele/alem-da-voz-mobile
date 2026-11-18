# Validação

## Verificado automaticamente

- Testes HTTP da API: cadastro, login, token, usuário atual, criação, listagem, leitura, edição e exclusão de frases.
- Rejeição de credenciais inválidas, token adulterado e formulário inválido.
- Uma conta não pode ler, editar ou excluir frases de outra.
- Normalização de posição e escala; tolerância a espelhamento; rejeição de pose fora do limite.
- Espera por letra e confirmação; mudança de sinal reinicia a espera; ausência de mão e lacunas interrompem a estabilização.
- Gesto de confirmação mantido não adiciona letras repetidamente; repetir uma letra funciona depois de soltar o gesto.
- Aparelho lento (um quadro a cada 2,2 s) ainda reconhece e confirma; uma interrupção longa continua reiniciando a espera.
- Bundles JavaScript Android e iOS gerados pelo Expo/Metro.

## Não verificado neste ambiente

Não havia celular físico ou simulador nativo conectado. Compilar JavaScript não comprova funcionamento de câmera, bridge da WebView, permissões, desempenho, acessibilidade ou API dentro de um aparelho. A seção abaixo é a etapa pendente para a apresentação.

## Roteiro de aceitação no celular

- [ ] Instalar cliente compatível / build e abrir o projeto.
- [ ] Negar permissão de câmera e recuperar pelo fluxo de configurações.
- [ ] Autorizar, carregar o detector e observar estado de mão detectada.
- [ ] Capturar pose e conferir prévia; salvar; capturar outra com o mesmo nome.
- [ ] Importar JSON antigo e confirmar número de sinais; exportar backup.
- [ ] Importar um JSON grande (vários MB), fechar o app por completo, abrir de novo e conferir que os sinais continuam lá.
- [ ] Atualizar por cima da versão anterior e conferir que sinais, mensagem e ajustes foram migrados.
- [ ] Testar o reconhecimento em um celular mais simples/antigo.
- [ ] Câmera e letra visíveis juntas em tela pequena; conferir rolagem com fonte ampliada.
- [ ] Reconhecer duas letras diferentes, esperar, confirmar, repetir uma letra.
- [ ] Segurar o gesto de confirmação por vários segundos: não duplicar a letra.
- [ ] Afastar a mão e reapresentar; pausar e voltar; enviar app ao fundo: câmera liberada.
- [ ] Editar texto, espaço, apagar, limpar, copiar; reiniciar app e conferir persistência.
- [ ] Testar `/health` no app; cadastrar conta, entrar, salvar frase, editar/favoritar e excluir.
- [ ] Abrir leituras externas; desligar rede e verificar erro e nova tentativa.
- [ ] Testar luz, ângulo e pessoa diferentes; registrar acertos e confusões, sem inferir precisão universal.

## Riscos conhecidos

A extração usa capturas sequenciais e MediaPipe IMAGE dentro de WebView. O primeiro carregamento depende da rede e pode demorar; celulares modestos podem processar lentamente. Para uso em produção com vídeo fluido, considerar um pipeline nativo de landmarks e avaliar o reconhecimento com pessoas fluentes em Libras. Essa evolução não está implementada neste pacote.
