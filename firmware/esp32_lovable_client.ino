/*
  ESP32 Monitor — Cliente HTTPS de exemplo
  ----------------------------------------
  Envia telemetria para a plataforma via HTTPS POST /api/public/ingest.

  Bibliotecas necessárias (Arduino Library Manager):
    - WiFi (nativo ESP32)
    - HTTPClient (nativo ESP32)
    - ArduinoJson (Benoit Blanchon)
    - DHT sensor library (Adafruit)

  Configure abaixo:
    WIFI_SSID, WIFI_PASSWORD
    INGEST_URL   -> https://SEU-DOMINIO/api/public/ingest
    DEVICE_ID    -> criado no painel
    DEVICE_KEY   -> gerada no painel
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ============ CONFIG ============
const char* WIFI_SSID     = "SUA_REDE";
const char* WIFI_PASSWORD = "SUA_SENHA";

const char* INGEST_URL = "https://SEU-DOMINIO/api/public/ingest";
const char* LOG_URL    = "https://SEU-DOMINIO/api/public/log";
const char* ALERT_URL  = "https://SEU-DOMINIO/api/public/alert";

const char* DEVICE_ID  = "esp32-001";
const char* DEVICE_KEY = "cole-a-chave-aqui";

// ============ HARDWARE ============
#define DHT_PIN   4
#define DHT_TYPE  DHT22
#define LED_PIN_1 2
#define LED_PIN_2 5
#define BTN_PIN_1 12
#define BTN_PIN_2 14
#define ENERGY_PIN 32   // sensor de rede elétrica
#define GEN_PIN    33   // sensor do gerador

DHT dht(DHT_PIN, DHT_TYPE);

const unsigned long SEND_INTERVAL_MS = 5000;
unsigned long lastSend = 0;

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.printf("\nOK  IP=%s  MAC=%s\n", WiFi.localIP().toString().c_str(), WiFi.macAddress().c_str());
}

bool postJson(const char* url, const String& payload) {
  WiFiClientSecure client;
  client.setInsecure(); // aceita cert público (Vercel/Lovable). Para produção use setCACert().
  HTTPClient http;
  if (!http.begin(client, url)) return false;
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);
  bool ok = code >= 200 && code < 300;
  if (!ok) Serial.printf("POST %s -> HTTP %d\n", url, code);
  http.end();
  return ok;
}

void sendTelemetry() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  StaticJsonDocument<512> doc;
  doc["device_id"]  = DEVICE_ID;
  doc["device_key"] = DEVICE_KEY;
  doc["temperature"] = isnan(t) ? nullptr : (JsonVariant)t;
  doc["humidity"]    = isnan(h) ? nullptr : (JsonVariant)h;
  doc["status"]      = "ok";
  doc["energy"]      = digitalRead(ENERGY_PIN) == HIGH;
  doc["generator"]   = digitalRead(GEN_PIN) == HIGH;

  JsonObject leds = doc.createNestedObject("leds");
  leds["led1"] = digitalRead(LED_PIN_1) == HIGH;
  leds["led2"] = digitalRead(LED_PIN_2) == HIGH;

  JsonObject btns = doc.createNestedObject("buttons");
  btns["btn1"] = digitalRead(BTN_PIN_1) == LOW; // pull-up
  btns["btn2"] = digitalRead(BTN_PIN_2) == LOW;

  doc["uptime"] = (uint32_t)(millis() / 1000);
  doc["ip"]     = WiFi.localIP().toString();
  doc["mac"]    = WiFi.macAddress();
  doc["wifi"]   = String(WIFI_SSID);
  doc["rssi"]   = WiFi.RSSI();

  String out; serializeJson(doc, out);
  postJson(INGEST_URL, out);
}

void sendLog(const char* level, const char* message) {
  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["device_key"] = DEVICE_KEY;
  doc["level"] = level;
  doc["message"] = message;
  String out; serializeJson(doc, out);
  postJson(LOG_URL, out);
}

void sendAlert(const char* type, const char* severity, const char* message) {
  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["device_key"] = DEVICE_KEY;
  doc["type"] = type;
  doc["severity"] = severity;
  doc["message"] = message;
  String out; serializeJson(doc, out);
  postJson(ALERT_URL, out);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(BTN_PIN_1, INPUT_PULLUP);
  pinMode(BTN_PIN_2, INPUT_PULLUP);
  pinMode(ENERGY_PIN, INPUT);
  pinMode(GEN_PIN, INPUT);
  dht.begin();
  connectWifi();
  sendLog("info", "Dispositivo iniciado");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();
    sendTelemetry();
  }
}
