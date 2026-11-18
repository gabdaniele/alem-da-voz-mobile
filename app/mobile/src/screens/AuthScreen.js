import React, { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Button, HelperText, TextInput, Text } from "react-native-paper";
import { Heading, Page, s } from "../components/UI";
import { useApp } from "../context/AppContext";
export default function AuthScreen({ navigation }) {
  const app = useApp(),
    [register, setRegister] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [hidden, setHidden] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit() {
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 8 ||
      password.length > 128 ||
      (register && name.trim().length < 2)
    ) {
      setError(
        "Preencha os campos. Use um e-mail válido e uma senha de 8 a 128 caracteres.",
      );
      return;
    }
    setError("");
    setBusy(true);
    try {
      await app.login(
        { name: name.trim(), email: email.trim(), password },
        register,
      );
      app.setNotice("Você entrou. Suas frases estão disponíveis.");
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Page>
        <Heading
          title={register ? "Vamos criar sua conta?" : "Bom ter você aqui"}
          subtitle="Entre para guardar e organizar suas frases na API."
        />
        {!app.apiUrl && (
          <>
            <Text style={s.error}>
              Configure o endereço do servidor em Ajustes antes de entrar.
            </Text>
            <Button
              onPress={() =>
                navigation.navigate("Home", { screen: "Settings" })
              }
            >
              Configurar servidor
            </Button>
          </>
        )}
        {register && (
          <TextInput
            mode="outlined"
            label="Seu nome"
            value={name}
            onChangeText={setName}
            maxLength={80}
            autoComplete="name"
          />
        )}
        <TextInput
          mode="outlined"
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          maxLength={254}
        />
        <TextInput
          mode="outlined"
          label="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={hidden}
          maxLength={128}
          autoCapitalize="none"
          autoComplete={register ? "new-password" : "current-password"}
          right={
            <TextInput.Icon
              icon={hidden ? "eye-outline" : "eye-off-outline"}
              onPress={() => setHidden(!hidden)}
              accessibilityLabel="Mostrar ou ocultar senha"
            />
          }
        />
        <HelperText type={error ? "error" : "info"}>
          {error || "A senha deve ter pelo menos 8 caracteres."}
        </HelperText>
        <Button
          mode="contained"
          loading={busy}
          disabled={busy || !app.apiUrl}
          onPress={submit}
        >
          {register ? "Criar conta" : "Entrar"}
        </Button>
        <Button
          disabled={busy}
          onPress={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? "Já tenho conta" : "Ainda não tenho conta"}
        </Button>
        <Text style={s.muted}>
          O reconhecimento e seus sinais podem ser usados sem uma conta.
        </Text>
      </Page>
    </KeyboardAvoidingView>
  );
}
