#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// Update these values for your WiFi network and Flask server
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.1.100:5000/api/rfid/scan";

// Adjust action to "find", "increase", or "decrease"
const char* rfidAction = "find";
const int quantity = 1;

#define SS_PIN 5
#define RST_PIN 22

MFRC522 mfrc522(SS_PIN, RST_PIN);

String getUidString(MFRC522::Uid uid) {
  String uidString = "";
  for (byte i = 0; i < uid.size; i++) {
    if (uidString.length() > 0) {
      uidString += ":";
    }
    uidString += String(uid.uidByte[i] < 0x10 ? "0" : "");
    uidString += String(uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();
  return uidString;
}

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();

  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(200);
    return;
  }

  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  String rfidUid = getUidString(mfrc522.uid);
  Serial.print("RFID UID detected: ");
  Serial.println(rfidUid);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String body = "{\"rfid_uid\": \"" + rfidUid + "\", "
                  "\"action\": \"" + String(rfidAction) + "\", "
                  "\"quantity\": " + String(quantity) + ", "
                  "\"reference\": \"ESP32-RFID\"}";

    int httpResponseCode = http.POST(body);
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Server response (code ");
      Serial.print(httpResponseCode);
      Serial.print("): ");
      Serial.println(response);
    } else {
      Serial.print("Error sending request: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.reconnect();
  }

  mfrc522.PICC_HaltA();
  delay(3000);
}
