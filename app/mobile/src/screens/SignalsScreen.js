import React, { useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { Button, List, Searchbar, Text } from "react-native-paper";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useApp } from "../context/AppContext";
import { validClasses, isPose } from "../recognition/matcher";
import { Empty, Heading, Page, s } from "../components/UI";
export default function SignalsScreen({ navigation }) {
  const app = useApp(),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false);
  async function importSignals() {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.size > 20000000) throw Error("Use um arquivo menor que 20 MB.");
      const file = new File(asset.uri);
      if (file.size > 20000000) throw Error("Use um arquivo menor que 20 MB.");
      const json = JSON.parse(await file.text());
      if (json.version !== 1 || !validClasses(json.classes))
        throw Error("Selecione um JSON exportado pelo Além da Voz.");
      const names = json.classes.map((c) => c.name.trim().toLowerCase());
      if (new Set(names).size !== names.length)
        throw Error("O arquivo contém nomes de sinais repetidos.");
      const confirmation =
        Array.isArray(json.confirmation) &&
        json.confirmation.length <= 20 &&
        json.confirmation.every(isPose)
          ? json.confirmation
          : app.confirmation;
      Alert.alert(
        "Importar sinais?",
        `Serão carregados ${json.classes.length} sinais. Os sinais atuais serão substituídos.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Importar",
            onPress: () => {
              app.update({ classes: json.classes, confirmation });
              app.setNotice("Sinais importados. Teste-os na câmera.");
            },
          },
        ],
      );
    } catch (e) {
      app.setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function exportSignals() {
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync()))
        throw Error("Compartilhamento indisponível neste aparelho.");
      const file = new File(Paths.cache, "alem-da-voz-sinais.json");
      await file.write(
        JSON.stringify({
          version: 1,
          classes: app.classes,
          confirmation: app.confirmation,
        }),
      );
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Salvar seus sinais",
        UTI: "public.json",
      });
    } catch (e) {
      app.setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={s.screen}>
      <FlatList
        contentContainerStyle={s.content}
        data={app.classes.filter((c) =>
          c.name.toLowerCase().includes(query.toLowerCase()),
        )}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Heading
              title="Meus sinais"
              subtitle="Seu jeito de sinalizar, um exemplo por vez."
            />
            <Button
              mode="contained"
              icon="plus"
              onPress={() => navigation.navigate("Capture", { kind: "letter" })}
            >
              Cadastrar sinal
            </Button>
            <View style={s.row}>
              <Button
                mode="outlined"
                disabled={busy}
                onPress={importSignals}
                style={s.grow}
              >
                Importar JSON
              </Button>
              <Button
                mode="outlined"
                disabled={busy || !app.classes.length}
                onPress={exportSignals}
                style={s.grow}
              >
                Exportar
              </Button>
            </View>
            <Searchbar
              placeholder="Buscar sinal"
              value={query}
              onChangeText={setQuery}
            />
            <Text style={s.eyebrow}>
              {app.classes.length} SINAIS CADASTRADOS
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <List.Item
            style={[s.card, { padding: 4 }]}
            title={item.name}
            description={`${item.samples.length} captura(s) • Toque para ver`}
            left={() => (
              <View
                style={[s.pill, { justifyContent: "center", minWidth: 48 }]}
              >
                <Text style={{ fontWeight: "700", textAlign: "center" }}>
                  {item.name.slice(0, 2)}
                </Text>
              </View>
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() =>
              navigation.navigate("SignalDetail", { name: item.name })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <Empty
            title={
              query
                ? "Nenhum sinal encontrado"
                : "Seu primeiro sinal começa aqui"
            }
            description={
              query
                ? "Tente buscar por outro nome."
                : "Cadastre uma letra ou importe o arquivo JSON da versão web."
            }
          />
        }
      />
    </View>
  );
}
export function SignalDetailScreen({ route, navigation }) {
  const app = useApp(),
    item = app.classes.find((c) => c.name === route.params.name);
  if (!item)
    return (
      <Page>
        <Empty
          title="Sinal não encontrado"
          description="Ele pode ter sido removido ou substituído."
        />
      </Page>
    );
  return (
    <Page>
      <Heading
        title={item.name}
        subtitle={`${item.samples.length} referência(s) cadastrada(s)`}
      />
      <View style={s.card}>
        <Text variant="titleMedium">Melhore o reconhecimento</Text>
        <Text style={s.muted}>
          Salve novas capturas deste mesmo sinal com pequenas mudanças de
          distância, ângulo e iluminação. Teste com as pessoas que vão usar o
          aplicativo.
        </Text>
        <Button
          mode="contained"
          onPress={() =>
            navigation.navigate("Capture", { kind: "letter", name: item.name })
          }
        >
          Adicionar outra captura
        </Button>
      </View>
      <Button
        textColor="#A52A3A"
        icon="delete-outline"
        onPress={() =>
          Alert.alert(
            "Excluir sinal?",
            `Todas as capturas de “${item.name}” serão apagadas.`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Excluir",
                style: "destructive",
                onPress: () => {
                  app.update({
                    classes: app.classes.filter((c) => c.name !== item.name),
                  });
                  navigation.goBack();
                },
              },
            ],
          )
        }
      >
        Excluir sinal
      </Button>
    </Page>
  );
}
