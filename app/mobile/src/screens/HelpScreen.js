import React from "react";
import { Linking, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { Heading, Page, s } from "../components/UI";
import { useRemote } from "../hooks/useRemote";
export default function HelpScreen({ navigation }) {
  return (
    <Page>
      <Heading
        title="Uma conversa, passo a passo"
        subtitle="Apoie o celular e deixe uma mão livre."
      />
      {[
        [
          "01",
          "Ensine seus sinais",
          "Em Meus sinais, capture uma pose e indique a letra. Para melhorar, salve variações com o mesmo nome. Você também pode importar seu JSON da versão web.",
        ],
        [
          "02",
          "Mostre e espere",
          "Na tela Conversar, ative a câmera. Mantenha uma mão inteira visível até a barra completar. Confira a letra que apareceu logo abaixo.",
        ],
        [
          "03",
          "Confirme e continue",
          "Faça seu gesto de confirmação até salvar. Solte o gesto e faça a próxima letra. Use Espaço para separar palavras.",
        ],
      ].map(([n, title, body]) => (
        <View style={s.card} key={n}>
          <Text style={s.eyebrow}>PASSO {n}</Text>
          <Text variant="titleMedium">{title}</Text>
          <Text style={s.muted}>{body}</Text>
        </View>
      ))}
      <View style={s.card}>
        <Text variant="titleMedium">Se a letra não aparecer</Text>
        <Text style={s.muted}>
          Confira se você cadastrou o sinal, melhore a iluminação e evite fundo
          confuso. Cadastre outra referência com a pessoa que está usando.
          Sinais muito parecidos podem exigir novas capturas.
        </Text>
      </View>
      <Text style={s.muted}>
        Este protótipo compara poses estáticas de uma mão. Não traduz Libras
        completa: movimentos, expressões e sinais com duas mãos não são
        reconhecidos. Valide os sinais com pessoas fluentes em Libras.
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate("Capture", { kind: "letter" })}
      >
        Cadastrar um sinal
      </Button>
    </Page>
  );
}
export function LearnScreen() {
  const { data, loading, error, reload } = useRemote(async () => {
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(
        "https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=L%C3%ADngua%20brasileira%20de%20sinais&gsrlimit=5&prop=extracts%7Cinfo&inprop=url&exintro=1&explaintext=1&exsentences=3&format=json&origin=*",
        { signal: controller.signal },
      );
      if (!response.ok) throw Error();
      const json = await response.json();
      const pages = Object.values(json.query?.pages || {});
      if (!pages.length) throw Error();
      return pages;
    } catch {
      throw Error(
        "Não foi possível buscar os artigos. Confira a internet e tente novamente.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }, []);
  return (
    <Page>
      <Heading
        title="Conhecer a Libras"
        subtitle="Leituras introdutórias. Aprender com pessoas fluentes faz a diferença."
      />
      {loading && (
        <>
          <ActivityIndicator />
          <Text>Buscando artigos…</Text>
        </>
      )}
      {!!error && (
        <>
          <Text style={s.error}>{error}</Text>
          <Button onPress={reload}>Tentar novamente</Button>
        </>
      )}
      {data.map((item) => (
        <View key={item.pageid} style={s.card}>
          <Text variant="titleMedium">{item.title}</Text>
          <Text style={s.muted}>
            {item.extract || "Abra o artigo para ler o conteúdo completo."}
          </Text>
          <Button
            icon="open-in-new"
            onPress={() => Linking.openURL(item.fullurl).catch(() => {})}
          >
            Ler na Wikipédia
          </Button>
        </View>
      ))}
      <Text style={[s.muted, { fontSize: 12 }]}>
        Fonte: Wikipédia em português, via MediaWiki API. Textos sob CC BY-SA,
        conforme o artigo de origem. Esta seção não é um dicionário de sinais.
      </Text>
    </Page>
  );
}
