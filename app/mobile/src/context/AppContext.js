import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { request } from "../services/api";
import { loadSignals, saveSignals } from "../services/signalStore";
const Context = createContext(null);
// Small values (text, preferences, API URL) stay in AsyncStorage.
// Signals can reach several MB, so they live in their own file (signalStore).
const PREFS_KEY = "alem-mobile-v2",
  LEGACY_KEY = "alem-mobile-v1";
const PREF_FIELDS = ["text", "haptics", "slow", "tolerant", "apiUrl"];
const defaults = {
  classes: [],
  confirmation: [],
  text: "",
  haptics: true,
  slow: false,
  tolerant: false,
  apiUrl: process.env.EXPO_PUBLIC_API_URL || "",
};
function pickPrefs(source) {
  const prefs = {};
  for (const key of PREF_FIELDS)
    if (source && typeof source[key] === typeof defaults[key])
      prefs[key] = source[key];
  return prefs;
}
export function AppProvider({ children }) {
  const [state, setState] = useState(defaults),
    [ready, setReady] = useState(false),
    [session, setSession] = useState(null),
    [notice, setNotice] = useState("");
  const prefsQueue = useRef(Promise.resolve()),
    signalsQueue = useRef(Promise.resolve()),
    // If loading a part failed, never overwrite what is stored with defaults.
    canSavePrefs = useRef(false),
    canSaveSignals = useRef(false),
    skipFirstSave = useRef({ prefs: true, signals: true });
  useEffect(() => {
    (async () => {
      const problems = [];
      let prefs = null,
        signals = { classes: [], confirmation: [] },
        legacy = null,
        legacyRead = false;
      // Version 1 kept everything (signals included) in a single key.
      try {
        const raw = await AsyncStorage.getItem(LEGACY_KEY);
        legacy = raw ? JSON.parse(raw) : null;
        legacyRead = true;
      } catch {
        problems.push("dados da versão anterior");
      }
      try {
        const saved = await AsyncStorage.getItem(PREFS_KEY);
        if (saved) prefs = pickPrefs(JSON.parse(saved));
        canSavePrefs.current = true;
      } catch {
        problems.push("preferências");
      }
      let signalsOk = false;
      try {
        const result = await loadSignals(legacy);
        signals = result.signals;
        canSaveSignals.current = result.writable;
        signalsOk = result.writable && !result.problem;
        if (result.problem) problems.push(result.problem);
      } catch {
        problems.push("sinais");
      }
      if (!prefs && legacy && canSavePrefs.current) {
        prefs = pickPrefs(legacy);
        try {
          await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        } catch {
          canSavePrefs.current = false;
        }
      }
      // Only drop the old key once both parts are safely in the new places.
      if (legacy && legacyRead && signalsOk && canSavePrefs.current)
        AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
      setState({ ...defaults, ...(prefs || {}), ...signals });
      try {
        const auth = await SecureStore.getItemAsync("alem-session");
        if (auth) setSession(JSON.parse(auth));
      } catch {
        problems.push("sessão");
      }
      if (problems.length)
        setNotice(
          "Não foi possível recuperar: " +
            problems.join(", ") +
            ". Nada foi apagado; importe um backup se precisar.",
        );
      setReady(true);
    })();
  }, []);
  const prefsKey = PREF_FIELDS.map((k) => state[k]);
  useEffect(() => {
    if (!ready || !canSavePrefs.current) return;
    if (skipFirstSave.current.prefs) {
      skipFirstSave.current.prefs = false;
      return;
    }
    const snapshot = JSON.stringify(pickPrefs(state));
    prefsQueue.current = prefsQueue.current
      .then(() => AsyncStorage.setItem(PREFS_KEY, snapshot))
      .catch(() => setNotice("Falha ao salvar a mensagem no aparelho."));
  }, [ready, ...prefsKey]);
  useEffect(() => {
    if (!ready || !canSaveSignals.current) return;
    if (skipFirstSave.current.signals) {
      skipFirstSave.current.signals = false;
      return;
    }
    const snapshot = {
      classes: state.classes,
      confirmation: state.confirmation,
    };
    signalsQueue.current = signalsQueue.current
      .then(() => saveSignals(snapshot))
      .catch(() =>
        setNotice("Falha ao salvar seus sinais no aparelho. Exporte um backup."),
      );
  }, [ready, state.classes, state.confirmation]);
  const update = (patch) =>
    setState((current) => ({
      ...current,
      ...(typeof patch === "function" ? patch(current) : patch),
    }));
  async function login(data, register = false) {
    const result = await request(
      state.apiUrl,
      register ? "/auth/register" : "/auth/login",
      { method: "POST", body: data },
    );
    await SecureStore.setItemAsync("alem-session", JSON.stringify(result));
    setSession(result);
  }
  async function logout() {
    await SecureStore.deleteItemAsync("alem-session");
    setSession(null);
  }
  async function api(path, options = {}) {
    try {
      return await request(state.apiUrl, path, {
        ...options,
        token: session?.token,
      });
    } catch (error) {
      if (error.status === 401) {
        await logout();
        setNotice("Sua sessão expirou. Entre novamente em Ajustes.");
      }
      throw error;
    }
  }
  return (
    <Context.Provider
      value={{
        ...state,
        ready,
        session,
        notice,
        setNotice,
        update,
        login,
        logout,
        api,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
