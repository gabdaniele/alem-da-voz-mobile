import React, { useEffect, useRef, useState } from "react";
import { AppState, Linking, StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  Text,
  ActivityIndicator,
} from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera";
import { WebView } from "react-native-webview";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { engineHtml } from "../recognition/engineHtml";
import { features } from "../recognition/matcher";
export default function CameraSurface({ enabled, onPose, height = 270 }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );
  const [cameraReady, setCameraReady] = useState(false),
    [engineReady, setEngineReady] = useState(false),
    [error, setError] = useState(""),
    [facing, setFacing] = useState("front"),
    [retry, setRetry] = useState(0);
  const camera = useRef(null),
    engine = useRef(null),
    pending = useRef(null),
    callback = useRef(onPose),
    sequence = useRef(0);
  callback.current = onPose;
  const active = enabled && appActive && permission?.granted;
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setAppActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    setCameraReady(false);
    setEngineReady(false);
    setError("");
    callback.current(null);
  }, [active, retry, facing]);
  useEffect(() => {
    if (!active || engineReady) return;
    const timer = setTimeout(
      () =>
        setError(
          "O detector demorou para carregar. Confira a internet e tente novamente.",
        ),
      30000,
    );
    return () => clearTimeout(timer);
  }, [active, engineReady, retry, facing]);
  useEffect(() => {
    if (!active || !cameraReady || !engineReady || error) return;
    let cancelled = false,
      timer;
    async function tick() {
      let original, small;
      try {
        original = await camera.current?.takePictureAsync({
          quality: 0.45,
          shutterSound: false,
        });
        if (cancelled || !original) return;
        small = await manipulateAsync(
          original.uri,
          [{ resize: { width: 480 } }],
          { base64: true, compress: 0.6, format: SaveFormat.JPEG },
        );
        if (cancelled) return;
        const id = ++sequence.current;
        const result = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            pending.current = null;
            reject(
              Error(
                "O detector parou de responder. Toque em tentar novamente.",
              ),
            );
          }, 10000);
          pending.current = {
            id,
            resolve: (value) => {
              clearTimeout(timeout);
              resolve(value);
            },
            reject: (e) => {
              clearTimeout(timeout);
              reject(e);
            },
          };
          engine.current?.injectJavaScript(
            `window.processFrame(${JSON.stringify(small.base64)},${id});true;`,
          );
        });
        if (!cancelled)
          callback.current(
            result?.length === 1
              ? {
                  pose: features(result[0]),
                  time: Date.now(),
                  hands: 1,
                  preview: "data:image/jpeg;base64," + small.base64,
                }
              : null,
          );
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Falha na câmera. Tente novamente.");
          callback.current(null);
        }
      } finally {
        for (const uri of new Set([original?.uri, small?.uri].filter(Boolean)))
          FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
        if (!cancelled) timer = setTimeout(tick, 250);
      }
    }
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      pending.current?.resolve(null);
      pending.current = null;
      callback.current(null);
    };
  }, [active, cameraReady, engineReady, error, facing, retry]);
  function receive(event) {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "ready") {
        setEngineReady(true);
        setError("");
      } else if (message.type === "error") setError(message.message);
      else if (message.id === pending.current?.id) {
        const job = pending.current;
        pending.current = null;
        message.type === "pose"
          ? job.resolve(message.hands)
          : job.reject(
              Error("Não foi possível analisar a imagem. Tente novamente."),
            );
      }
    } catch {
      setError("Resposta inesperada do detector. Tente novamente.");
    }
  }
  return (
    <View style={[styles.frame, { height }]}>
      {active && !error && (
        <CameraView
          key={`${facing}-${retry}`}
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing={facing}
          // Frames are captured continuously; the default shutter animation
          // would make the preview flash on every capture.
          animateShutter={false}
          flash="off"
          onCameraReady={() => setCameraReady(true)}
          onMountError={() =>
            setError("Não foi possível abrir a câmera. Verifique a permissão.")
          }
        />
      )}
      {active && (
        <WebView
          key={`engine-${facing}-${retry}`}
          ref={engine}
          source={{ html: engineHtml, baseUrl: "https://localhost/" }}
          originWhitelist={["*"]}
          javaScriptEnabled
          onMessage={receive}
          onError={() => setError("Falha ao iniciar o detector.")}
          onContentProcessDidTerminate={() =>
            setError("O detector foi interrompido. Tente novamente.")
          }
          onRenderProcessGone={() =>
            setError("O detector foi interrompido. Tente novamente.")
          }
          style={styles.engine}
          containerStyle={styles.engine}
          pointerEvents="none"
          accessible={false}
        />
      )}
      {!active && (
        <View style={styles.center}>
          <Text style={styles.offTitle}>
            {!enabled
              ? "Seu espaço para se expressar"
              : "Vamos usar sua câmera?"}
          </Text>
          <Text style={styles.offText}>
            A imagem fica no aparelho. Mostre apenas uma mão por vez.
          </Text>
          {enabled && !permission?.granted && (
            <Button
              mode="contained"
              onPress={() =>
                permission?.canAskAgain
                  ? requestPermission()
                  : Linking.openSettings()
              }
            >
              {permission?.canAskAgain ? "Permitir câmera" : "Abrir permissões"}
            </Button>
          )}
        </View>
      )}
      {active && !error && (
        <>
          <View pointerEvents="none" style={styles.guide} />
          <View style={styles.label}>
            <View
              style={[
                styles.dot,
                { backgroundColor: engineReady ? "#9BE4BE" : "#E9C686" },
              ]}
            />
            <Text style={styles.labelText}>
              {engineReady ? "Câmera ativa" : "Preparando reconhecimento"}
            </Text>
          </View>
          <IconButton
            icon="camera-flip-outline"
            accessibilityLabel="Trocar câmera"
            iconColor="#fff"
            style={styles.flip}
            onPress={() => setFacing((x) => (x === "front" ? "back" : "front"))}
          />
          {!engineReady && (
            <ActivityIndicator color="#fff" style={styles.spinner} />
          )}
        </>
      )}
      {!!error && (
        <View style={styles.center}>
          <Text style={styles.offText}>{error}</Text>
          <Button mode="contained" onPress={() => setRetry((x) => x + 1)}>
            Tentar novamente
          </Button>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { backgroundColor: "#302A3E", borderRadius: 24, overflow: "hidden" },
  engine: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    top: 0,
    left: 0,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 14,
  },
  offTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "600",
    textAlign: "center",
  },
  offText: { color: "#E2D8EE", textAlign: "center", lineHeight: 21 },
  guide: {
    position: "absolute",
    left: "24%",
    right: "24%",
    top: "20%",
    bottom: "15%",
    borderWidth: 1.5,
    borderColor: "#FFFFFF80",
    borderRadius: 38,
  },
  label: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "#292335BA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  labelText: { color: "#fff", fontSize: 11 },
  flip: {
    position: "absolute",
    right: 5,
    top: 3,
    backgroundColor: "#29233590",
  },
  spinner: { position: "absolute", top: "50%", left: "46%" },
});
