import React, { useCallback, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  HelperText,
  List,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { useApp } from "../context/AppContext";
import { useRemote } from "../hooks/useRemote";
import { Empty, Heading, Page, s } from "../components/UI";
export default function PhrasesScreen({ navigation }) {
  const app = useApp();
  const { data, loading, error, reload } = useRemote(
    () => (app.session ? app.api("/phrases") : Promise.resolve([])),
    [app.session?.token, app.apiUrl],
  );
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  if (!app.session)
    return (
      <Page>
        <Heading title="Minhas frases" />
        <Empty
          icon="bookmark-outline"
          title="Guarde o que você quer dizer"
          description="Entre na sua conta para salvar, editar e encontrar suas frases."
          action="Entrar ou criar conta"
          onPress={() => navigation.navigate("Login")}
        />
      </Page>
    );
  return (
    <View style={s.screen}>
      <FlatList
        contentContainerStyle={s.content}
        data={data}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={reload}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <Heading
              title="Minhas frases"
              subtitle="Palavras que você quer ter por perto."
            />
            <Button
              mode="contained"
              icon="plus"
              onPress={() => navigation.navigate("PhraseEdit", {})}
            >
              Nova frase
            </Button>
            {loading && <ActivityIndicator />}
            {!!error && (
              <>
                <Text style={s.error}>{error}</Text>
                <Button onPress={reload}>Tentar novamente</Button>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <List.Item
            style={s.card}
            title={item.text}
            titleNumberOfLines={3}
            description={item.favorite ? "Favorita" : "Toque para abrir"}
            left={(props) => (
              <List.Icon
                {...props}
                icon={item.favorite ? "star" : "message-text-outline"}
              />
            )}
            onPress={() => navigation.navigate("PhraseEdit", { id: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          !loading && !error ? (
            <Empty
              title="Sua coleção começa aqui"
              description="Salve uma mensagem na tela Conversar ou crie uma frase."
            />
          ) : null
        }
      />
    </View>
  );
}
export function PhraseEditScreen({ route, navigation }) {
  const app = useApp(),
    id = route.params?.id;
  const [text, setText] = useState(route.params?.text || ""),
    [favorite, setFavorite] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const remote = useRemote(async () => {
    if (!id) return [];
    const row = await app.api("/phrases/" + id);
    setText(row.text);
    setFavorite(row.favorite);
    return [row];
  }, [id, app.session?.token]);
  async function save() {
    if (!text.trim()) {
      setError("Escreva uma frase antes de salvar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await app.api("/phrases" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: { text: text.trim(), favorite },
      });
      app.setNotice("Frase salva na sua conta.");
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await app.api("/phrases/" + id, { method: "DELETE" });
      app.setNotice("Frase excluída.");
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!app.session)
    return (
      <Page>
        <Empty
          title="Entre para continuar"
          description="Sua mensagem na tela Conversar continua salva no aparelho."
          action="Entrar"
          onPress={() => navigation.navigate("Login")}
        />
      </Page>
    );
  if (remote.loading && id)
    return (
      <Page>
        <ActivityIndicator />
        <Text>Carregando frase…</Text>
      </Page>
    );
  if (remote.error)
    return (
      <Page>
        <Text style={s.error}>{remote.error}</Text>
        <Button onPress={remote.reload}>Tentar novamente</Button>
      </Page>
    );
  return (
    <Page>
      <Heading title={id ? "Sua frase" : "Guardar uma frase"} />
      <TextInput
        mode="outlined"
        label="Mensagem"
        multiline
        value={text}
        onChangeText={setText}
        maxLength={1000}
        style={{ minHeight: 130 }}
      />
      <Text style={s.muted}>{text.length}/1.000 caracteres</Text>
      <View style={s.between}>
        <Text>Marcar como favorita</Text>
        <Switch
          value={favorite}
          onValueChange={setFavorite}
          accessibilityLabel="Frase favorita"
        />
      </View>
      {!!error && <HelperText type="error">{error}</HelperText>}
      <Button mode="contained" loading={busy} disabled={busy} onPress={save}>
        Salvar frase
      </Button>
      <Button
        icon="content-copy"
        disabled={!text}
        onPress={async () => {
          try {
            await Clipboard.setStringAsync(text);
            app.setNotice("Frase copiada.");
          } catch {
            app.setNotice("Não foi possível copiar.");
          }
        }}
      >
        Copiar
      </Button>
      {id && (
        <Button
          textColor="#A52A3A"
          disabled={busy}
          onPress={() =>
            Alert.alert(
              "Excluir frase?",
              "A frase será removida da sua conta.",
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: remove },
              ],
            )
          }
        >
          Excluir frase
        </Button>
      )}
    </Page>
  );
}
