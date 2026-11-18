import React, { useState } from "react";
import { Alert, View } from "react-native";
import {
  Button,
  HelperText,
  List,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { useApp } from "../context/AppContext";
import { Heading, Page, s } from "../components/UI";
import { request } from "../services/api";
export default function SettingsScreen({ navigation }) {
  const app = useApp(),
    [url, setUrl] = useState(app.apiUrl),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function server() {
    const normalized = url.trim().replace(/\/$/, "");
    try {
      const parsed = new URL(normalized);
      if (
        !["https:", "http:"].includes(parsed.protocol) ||
        parsed.username ||
        parsed.password ||
        parsed.search ||
        parsed.hash
      )
        throw Error();
    } catch {
      setError(
        "Use um endereço HTTP ou HTTPS válido, sem senha ou parâmetros.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await request(normalized, "/health");
      if (result.status !== "ok")
        throw Error("Este endereço não corresponde à API do Além da Voz.");
      if (app.apiUrl !== normalized && app.session) await app.logout();
      app.update({ apiUrl: normalized });
      app.setNotice("Conexão com a API verificada.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Heading
        title="Do seu jeito"
        subtitle="Ajustes simples para uma conversa tranquila."
      />
      <View style={s.card}>
        <Text variant="titleMedium">
          {app.session ? `Olá, ${app.session.user.name}` : "Sua conta"}
        </Text>
        <Text style={s.muted}>
          {app.session
            ? app.session.user.email
            : "Entre para guardar frases. A câmera funciona sem login."}
        </Text>
        <Button
          mode="outlined"
          onPress={() =>
            app.session
              ? app
                  .logout()
                  .catch(() =>
                    app.setNotice("Não foi possível sair. Tente novamente."),
                  )
              : navigation.navigate("Login")
          }
        >
          {app.session ? "Sair da conta" : "Entrar ou criar conta"}
        </Button>
      </View>
      <View style={s.card}>
        <Text variant="titleMedium">Reconhecimento</Text>
        {[
          [
            "slow",
            "Mais tempo para fazer o sinal",
            "Espera de 2 segundos antes de reconhecer.",
          ],
          [
            "tolerant",
            "Aceitar mais variações",
            "Pode confundir sinais parecidos. Confira a letra.",
          ],
          [
            "haptics",
            "Vibrar ao salvar a letra",
            "Uma confirmação curta, além do aviso visual.",
          ],
        ].map(([key, title, description]) => (
          <View key={key} style={s.between}>
            <View style={s.grow}>
              <Text variant="titleSmall">{title}</Text>
              <Text style={[s.muted, { fontSize: 12 }]}>{description}</Text>
            </View>
            <Switch
              value={app[key]}
              onValueChange={(value) => app.update({ [key]: value })}
              accessibilityLabel={title}
            />
          </View>
        ))}
      </View>
      <View style={s.card}>
        <Text variant="titleMedium">Gesto de confirmação</Text>
        <Text style={s.muted}>
          {app.confirmation.length
            ? "Configurado. Faça a letra e depois este gesto para salvar."
            : "Configure uma pose diferente das letras para confirmar sem tocar na tela."}
        </Text>
        <Button
          mode="contained-tonal"
          onPress={() =>
            navigation.navigate("Capture", { kind: "confirmation" })
          }
        >
          {app.confirmation.length ? "Trocar gesto" : "Configurar gesto"}
        </Button>
        {!!app.confirmation.length && (
          <Button
            onPress={() =>
              Alert.alert(
                "Remover gesto?",
                "Você precisará configurar outro para confirmar letras.",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Remover",
                    onPress: () => app.update({ confirmation: [] }),
                  },
                ],
              )
            }
          >
            Remover gesto
          </Button>
        )}
      </View>
      <List.Item
        title="Como usar"
        description="Aprenda em três passos"
        left={(props) => <List.Icon {...props} icon="help-circle-outline" />}
        onPress={() => navigation.navigate("Help")}
      />
      <List.Item
        title="Conhecer a Libras"
        description="Artigos de uma fonte externa"
        left={(props) => <List.Icon {...props} icon="book-open-outline" />}
        onPress={() => navigation.navigate("Learn")}
      />
      <View style={s.card}>
        <Text variant="titleMedium">Conexão com o servidor</Text>
        <Text style={s.muted}>
          Para login e frases salvas, informe o endereço da API. Em testes, use
          o IP do computador conectado à mesma rede.
        </Text>
        <TextInput
          label="Endereço da API"
          mode="outlined"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="http://192.168.1.10:3000"
        />
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
        <Button mode="outlined" loading={busy} disabled={busy} onPress={server}>
          Testar e salvar conexão
        </Button>
      </View>
      <Text style={[s.muted, { fontSize: 12 }]}>
        Suas capturas são processadas no aparelho. Apenas conta e frases salvas
        são enviadas à API. O detector precisa de internet para carregar.
      </Text>
    </Page>
  );
}
