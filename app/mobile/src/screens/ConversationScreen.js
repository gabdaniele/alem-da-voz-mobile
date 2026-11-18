import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  StyleSheet,
  View,
  Vibration,
  useWindowDimensions,
} from "react-native";
import {
  Button,
  IconButton,
  ProgressBar,
  Text,
  TextInput,
} from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import CameraSurface from "../components/CameraSurface";
import { Page, colors, s } from "../components/UI";
import { useApp } from "../context/AppContext";
import { classify, createRecognizer } from "../recognition/matcher";
export default function ConversationScreen({ navigation }) {
  const app = useApp(),
    focused = useIsFocused(),
    { height } = useWindowDimensions();
  const [active, setActive] = useState(false),
    [result, setResult] = useState({
      pending: "",
      progress: 0,
      hint: "Ative a câmera para começar.",
    });
  const recognizer = useRef(createRecognizer());
  useEffect(() => {
    recognizer.current = createRecognizer({
      letterMs: app.slow ? 2000 : 1300,
      confirmMs: app.slow ? 1300 : 900,
    });
    setResult({
      pending: "",
      progress: 0,
      hint: "Mostre uma mão inteira à câmera.",
    });
  }, [app.slow, app.tolerant, app.classes, app.confirmation]);
  useEffect(() => {
    if (!focused) {
      setActive(false);
      recognizer.current.reset();
      setResult({
        pending: "",
        progress: 0,
        hint: "Ative a câmera para começar.",
      });
    }
  }, [focused]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        setActive(false);
        recognizer.current.reset();
        setResult({
          pending: "",
          progress: 0,
          hint: "Ative a câmera para continuar.",
        });
      }
    });
    return () => sub.remove();
  }, []);
  function onPose(frame) {
    if (!active) return;
    const next = recognizer.current.step(
      frame
        ? classify(
            frame.pose,
            app.classes,
            app.confirmation,
            app.tolerant ? 0.5 : 0.38,
          )
        : null,
      Date.now(),
    );
    setResult(next);
    if (next.append) {
      app.update((current) => ({
        text: (current.text + next.append).slice(0, 1000),
      }));
      if (app.haptics) Vibration.vibrate(45);
    }
  }
  function toggle() {
    recognizer.current.reset();
    setResult({
      pending: "",
      progress: 0,
      hint: active
        ? "Reconhecimento pausado."
        : "Mostre uma mão inteira à câmera.",
    });
    setActive(!active);
  }
  return (
    <Page style={{ gap: 8, paddingTop: 8 }}>
      <View style={s.between}>
        <View>
          <Text style={s.eyebrow}>ALÉM DA VOZ</Text>
          <Text style={styles.title}>Vamos conversar?</Text>
        </View>
        <IconButton
          icon="help-circle-outline"
          accessibilityLabel="Como usar"
          onPress={() => navigation.navigate("Help")}
        />
      </View>
      <View style={styles.stage}>
        {focused && (
          <CameraSurface
            enabled={active}
            onPose={onPose}
            height={Math.max(155, Math.min(260, height * 0.25))}
          />
        )}
        <View style={styles.result}>
          <View style={styles.letter}>
            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.letterText,
                { fontSize: result.pending.length > 3 ? 24 : 48 },
              ]}
            >
              {result.pending || "—"}
            </Text>
          </View>
          <View style={[s.grow, { gap: 6 }]}>
            <Text style={s.eyebrow}>SINAL RECONHECIDO</Text>
            <Text style={s.muted}>
              {active ? result.hint : "A câmera e sua mensagem, juntas."}
            </Text>
            <ProgressBar
              progress={active ? result.progress : 0}
              color={colors.purple}
              style={{ height: 5, borderRadius: 4 }}
            />
          </View>
        </View>
      </View>
      {!app.classes.length ? (
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate("Capture", { kind: "letter" })}
        >
          Cadastrar meu primeiro sinal
        </Button>
      ) : (
        <Button
          mode="contained"
          icon={active ? "pause" : "camera-outline"}
          onPress={toggle}
          contentStyle={{ height: 46 }}
        >
          {active ? "Pausar reconhecimento" : "Ativar câmera"}
        </Button>
      )}
      {!!app.classes.length && !app.confirmation.length && (
        <Button
          compact
          icon="gesture-tap"
          onPress={() =>
            navigation.navigate("Capture", { kind: "confirmation" })
          }
        >
          Configurar gesto para salvar letras
        </Button>
      )}
      <View style={[s.card, { padding: 12, gap: 6 }]}>
        <View style={s.between}>
          <Text style={s.eyebrow}>SUA MENSAGEM</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>
            Salva neste aparelho
          </Text>
        </View>
        <TextInput
          mode="flat"
          placeholder="Sua palavra aparece aqui…"
          value={app.text}
          onChangeText={(text) => app.update({ text })}
          multiline
          maxLength={1000}
          accessibilityLabel="Mensagem formada, editável"
          style={{ backgroundColor: "#fff", fontSize: 22, minHeight: 50 }}
          underlineColor="transparent"
        />
        <View style={s.between}>
          <Button
            compact
            onPress={() =>
              app.update((current) => ({
                text: (current.text + " ").slice(0, 1000),
              }))
            }
          >
            Espaço
          </Button>
          <View style={s.row}>
            <IconButton
              icon="backspace-outline"
              accessibilityLabel="Apagar último caractere"
              disabled={!app.text}
              onPress={() =>
                app.update((current) => ({
                  text: Array.from(current.text).slice(0, -1).join(""),
                }))
              }
            />
            <IconButton
              icon="delete-outline"
              accessibilityLabel="Limpar mensagem"
              disabled={!app.text}
              onPress={() =>
                Alert.alert(
                  "Limpar mensagem?",
                  "Essa ação apaga o texto atual.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Limpar",
                      style: "destructive",
                      onPress: () => {
                        app.update({ text: "" });
                        recognizer.current.reset();
                        setResult({
                          pending: "",
                          progress: 0,
                          hint: "Mostre o próximo sinal.",
                        });
                      },
                    },
                  ],
                )
              }
            />
          </View>
        </View>
        <View style={s.row}>
          <Button
            mode="outlined"
            icon="content-copy"
            disabled={!app.text}
            style={s.grow}
            onPress={async () => {
              try {
                await Clipboard.setStringAsync(app.text);
                app.setNotice("Mensagem copiada.");
              } catch {
                app.setNotice("Não foi possível copiar.");
              }
            }}
          >
            Copiar
          </Button>
          <Button
            mode="contained-tonal"
            icon="bookmark-outline"
            disabled={!app.text.trim()}
            style={s.grow}
            onPress={() =>
              navigation.navigate(
                app.session ? "PhraseEdit" : "Login",
                app.session ? { text: app.text } : {},
              )
            }
          >
            Salvar frase
          </Button>
        </View>
      </View>
      <Text style={[s.muted, { fontSize: 12, textAlign: "center" }]}>
        1. Faça o sinal · 2. Espere a barra · 3. Confirme com seu gesto
      </Text>
    </Page>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 25, fontWeight: "700", color: colors.ink, marginTop: 4 },
  stage: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    minHeight: 96,
  },
  letter: {
    width: 72,
    minHeight: 72,
    backgroundColor: "#F0EAF7",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: { color: colors.purple, fontWeight: "700", textAlign: "center" },
});
