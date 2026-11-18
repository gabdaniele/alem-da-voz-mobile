import React, { useRef, useState } from "react";
import { Image, View } from "react-native";
import {
  Button,
  HelperText,
  Text,
  TextInput,
  Switch,
} from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";
import CameraSurface from "../components/CameraSurface";
import { Heading, Page, s } from "../components/UI";
import { useApp } from "../context/AppContext";
export default function CaptureScreen({ route, navigation }) {
  const command = route.params?.kind === "confirmation",
    app = useApp(),
    focused = useIsFocused();
  const [name, setName] = useState(route.params?.name || ""),
    [keep, setKeep] = useState(true),
    [pose, setPose] = useState(null),
    [preview, setPreview] = useState(null),
    [detected, setDetected] = useState(false),
    [error, setError] = useState("");
  const latest = useRef(null);
  function capture() {
    if (!latest.current || Date.now() - latest.current.time > 1800) {
      setError("Mostre uma mão inteira e aguarde a detecção.");
      return;
    }
    setPreview(latest.current.preview);
    setPose(latest.current.pose);
    setError("");
  }
  function save() {
    if (!pose) return;
    if (command) {
      app.update({ confirmation: [pose] });
      app.setNotice("Gesto de confirmação salvo.");
      navigation.goBack();
      return;
    }
    const value = name.trim();
    if (!value || value.length > 40) {
      setError("Dê um nome de até 40 caracteres para o sinal.");
      return;
    }
    const index = app.classes.findIndex(
      (c) => c.name.toLowerCase() === value.toLowerCase(),
    );
    if (index < 0 && app.classes.length >= 30) {
      setError("Limite de 30 sinais. Exclua um sinal para continuar.");
      return;
    }
    if (index >= 0 && app.classes[index].samples.length >= 2000) {
      setError("Limite de capturas desse sinal atingido.");
      return;
    }
    app.update((current) => ({
      classes:
        index < 0
          ? [...current.classes, { name: value, samples: [pose] }]
          : current.classes.map((c, i) =>
              i === index ? { ...c, samples: [...c.samples, pose] } : c,
            ),
    }));
    app.setNotice(`Sinal “${value}” salvo.`);
    setPose(null);
    setError("");
    if (!keep) navigation.goBack();
  }
  return (
    <Page>
      <Heading
        title={command ? "Seu gesto de confirmação" : "Ensine um sinal"}
        subtitle={
          command
            ? "Escolha uma pose diferente de todas as letras. Ela vai salvar a letra que estiver na tela."
            : "Capture uma pose, indique a letra e salve. Repita para ensinar variações."
        }
      />
      {focused && !pose && (
        <CameraSurface
          enabled={true}
          height={250}
          onPose={(frame) => {
            latest.current = frame;
            setDetected(Boolean(frame));
          }}
        />
      )}
      {!!pose && !!preview && (
        <Image
          source={{ uri: preview }}
          style={{ height: 250, borderRadius: 24, backgroundColor: "#302A3E" }}
          resizeMode="contain"
          accessibilityLabel="Prévia do sinal capturado"
        />
      )}
      {!pose ? (
        <>
          <Text style={s.muted}>
            {detected
              ? "Mão detectada. Você já pode capturar."
              : "Posicione uma mão inteira à frente da câmera."}
          </Text>
          <Button
            mode="contained"
            icon="camera-outline"
            onPress={capture}
            disabled={!detected}
          >
            Capturar sinal
          </Button>
        </>
      ) : (
        <View style={s.card}>
          <Text variant="titleMedium">Pose capturada ✓</Text>
          <Text style={s.muted}>
            Os pontos da mão foram capturados. Você pode salvar ou tentar
            novamente.
          </Text>
          {!command && (
            <>
              <TextInput
                label="Letra ou nome do sinal"
                mode="outlined"
                value={name}
                onChangeText={setName}
                maxLength={40}
                autoCapitalize="characters"
              />
              <View style={s.between}>
                <Text style={s.grow}>Continuar cadastrando após salvar</Text>
                <Switch
                  value={keep}
                  onValueChange={setKeep}
                  accessibilityLabel="Continuar cadastrando"
                />
              </View>
            </>
          )}
          <Button mode="contained" onPress={save}>
            {command ? "Salvar gesto" : "Salvar sinal"}
          </Button>
          <Button onPress={() => setPose(null)}>Capturar novamente</Button>
        </View>
      )}
      {!!error && <HelperText type="error">{error}</HelperText>}
      <Text style={s.muted}>
        Dica: varie levemente o ângulo e a distância nas próximas capturas.
        Nesta versão, use poses estáticas de uma mão.
      </Text>
    </Page>
  );
}
