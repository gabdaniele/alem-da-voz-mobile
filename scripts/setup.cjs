const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  crypto = require("node:crypto"),
  { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error("Instale Node.js 22.13 ou superior (preferencialmente LTS).");
  process.exit(1);
}
// Prefer the Wi-Fi adapter; skip link-local and common virtual adapters
// (VirtualBox 192.168.56.x, Hyper-V/WSL "vEthernet", Docker, VMware).
const virtual = /virtual|vethernet|vmware|vbox|docker|wsl|hyper-v/i;
const addresses = Object.entries(os.networkInterfaces())
  .flatMap(([name, list]) => (list || []).map((x) => ({ ...x, name })))
  .filter(
    (x) =>
      x.family === "IPv4" &&
      !x.internal &&
      !x.address.startsWith("169.254.") &&
      !x.address.startsWith("192.168.56.") &&
      !virtual.test(x.name),
  )
  .sort((a, b) => /wi-?fi|wlan|wireless/i.test(b.name) - /wi-?fi|wlan|wireless/i.test(a.name))
  .map((x) => x.address);
const ip = process.argv[2] || addresses[0];
if (!ip) {
  console.error("Conecte o computador ao Wi-Fi e execute novamente.");
  process.exit(1);
}
const apiEnv = path.join(root, "app/api/.env"),
  mobileEnv = path.join(root, "app/mobile/.env");
if (!fs.existsSync(apiEnv))
  fs.writeFileSync(
    apiEnv,
    "PORT=3000\nDB_PATH=./data/alem.db\nJWT_SECRET=" +
      crypto.randomBytes(48).toString("hex") +
      "\n",
  );
if (!fs.existsSync(mobileEnv))
  fs.writeFileSync(mobileEnv, "EXPO_PUBLIC_API_URL=http://" + ip + ":3000\n");
for (const folder of ["app/api", "app/mobile"]) {
  console.log("Instalando dependências de " + folder + "…");
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["ci", "--no-audit", "--no-fund"],
    {
      cwd: path.join(root, folder),
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("\nPronto. Abra dois terminais nesta pasta:");
console.log("1. npm run api");
console.log("2. npm run mobile");
console.log("Conecte celular e computador à mesma rede. IP sugerido: " + ip);
console.log(
  "Se o IP estiver incorreto, altere o endereço da API em Ajustes no aplicativo.",
);
