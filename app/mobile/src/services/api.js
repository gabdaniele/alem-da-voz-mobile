export async function request(
  base,
  path,
  { token, method = "GET", body } = {},
) {
  if (!/^https?:\/\//.test(base))
    throw Error("Configure o endereço da API em Ajustes.");
  const abort = new AbortController(),
    timer = setTimeout(() => abort.abort(), 12000);
  try {
    const response = await fetch(base.replace(/\/$/, "") + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: abort.signal,
    });
    if (response.status === 204) return null;
    const data = await response
      .json()
      .catch(() => ({ message: "Resposta inválida do servidor." }));
    if (!response.ok) {
      const error = Error(data.message || "Não foi possível concluir.");
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.status) throw error;
    throw Error(
      error.name === "AbortError"
        ? "O servidor demorou a responder. Tente novamente."
        : error.message === "Network request failed"
          ? "Sem conexão com a API. Confira o endereço e a rede Wi-Fi."
          : error.message,
    );
  } finally {
    clearTimeout(timer);
  }
}
