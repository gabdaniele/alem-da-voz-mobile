import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { openDatabase } from "../src/services/database.js";
test("auth, phrase CRUD, ownership and invalid input", async () => {
  const db = openDatabase(":memory:");
  const app = createApp(db, "only-for-tests-a-very-long-secret-key-123456");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  async function call(path, method = "GET", body, token) {
    const r = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, body: r.status === 204 ? null : await r.json() };
  }
  try {
    assert.equal((await call("/health")).status, 200);
    assert.equal((await call("/phrases")).status, 401);
    assert.equal(
      (
        await call("/auth/register", "POST", {
          name: "A",
          email: "bad",
          password: "short",
        })
      ).status,
      400,
    );
    const user = {
      name: "Gabi",
      email: "gabi@example.test",
      password: "Example123!",
    };
    const registration = await call("/auth/register", "POST", user);
    assert.equal(registration.status, 201);
    assert.ok(registration.body.token);
    assert.equal(registration.body.user.password_hash, undefined);
    assert.equal((await call("/auth/register", "POST", user)).status, 409);
    assert.equal(
      (await call("/auth/login", "POST", { ...user, password: "incorrect" }))
        .status,
      401,
    );
    const token = (await call("/auth/login", "POST", user)).body.token;
    assert.equal(
      (await call("/auth/me", "GET", undefined, token)).body.email,
      user.email,
    );
    assert.equal(
      (await call("/phrases", "POST", { text: "", favorite: false }, token))
        .status,
      400,
    );
    const created = await call(
      "/phrases",
      "POST",
      { text: "Olá", favorite: false },
      token,
    );
    assert.equal(created.status, 201);
    const id = created.body.id;
    const other = (
      await call("/auth/register", "POST", {
        ...user,
        email: "other@example.test",
      })
    ).body.token;
    assert.equal(
      (await call("/phrases", "GET", undefined, other)).body.length,
      0,
    );
    for (const method of ["GET", "PUT", "DELETE"])
      assert.equal(
        (
          await call(
            "/phrases/" + id,
            method,
            method === "PUT"
              ? { text: "unauthorized", favorite: false }
              : undefined,
            other,
          )
        ).status,
        404,
      );
    assert.equal(
      (
        await call(
          "/phrases/" + id,
          "PUT",
          { text: "Olá, tudo bem?", favorite: true },
          token,
        )
      ).body.favorite,
      true,
    );
    assert.equal(
      (await call("/phrases", "GET", undefined, token)).body.length,
      1,
    );
    assert.equal(
      (await call("/phrases/" + id, "GET", undefined, token)).body.text,
      "Olá, tudo bem?",
    );
    assert.equal(
      (await call("/phrases/" + id, "DELETE", undefined, token)).status,
      204,
    );
    assert.equal(
      (await call("/phrases", "GET", undefined, token)).body.length,
      0,
    );
    assert.equal(
      (await call("/phrases", "GET", undefined, "tampered")).status,
      401,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  }
});
