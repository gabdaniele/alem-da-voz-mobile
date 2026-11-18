export function validatePhrase(body) {
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 1000 || typeof body.favorite !== "boolean") {
    const error = new Error(
      "Escreva de 1 a 1.000 caracteres e informe favorito como verdadeiro ou falso.",
    );
    error.status = 400;
    throw error;
  }
  return { text, favorite: body.favorite ? 1 : 0 };
}
export const serializePhrase = (row) => ({
  ...row,
  favorite: Boolean(row.favorite),
});
