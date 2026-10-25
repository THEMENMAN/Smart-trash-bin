#include <Servo.h>

const int trigPin = 9;
const int echoPin = 10;
const int servoPin = 11;
const int ledPin = 13; // Built-in LED for status

Servo riceServo;
long duration;
int distance;

// State Machine Variables
bool isWaitingForBackend = false;
unsigned long detectionTime = 0;

void setup() {
  Serial.begin(9600);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPin, OUTPUT);
  
  riceServo.attach(servoPin);
  riceServo.write(0); // Initial position (closed)
  
  digitalWrite(ledPin, LOW); // Ready state
  Serial.println("SYSTEM_READY");
}

void loop() {
  // 1. Check for incoming commands from Node.js
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "DISPENSE_RICE") {
      dispenseRice();
      isWaitingForBackend = false; // Reset state
      digitalWrite(ledPin, LOW);
    }
  }

  // 2. If not currently waiting for the backend, check the sensor
  if (!isWaitingForBackend) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    duration = pulseIn(echoPin, HIGH);
    distance = duration * 0.034 / 2;

    // If object detected closer than 15cm
    if (distance > 0 && distance < 15) {
      Serial.println("TRASH_DETECTED");
      digitalWrite(ledPin, HIGH); // Turn on LED to show it's processing
      
      isWaitingForBackend = true;
      detectionTime = millis();
    }
  }

  // 3. Safety Timeout: If backend crashes, don't freeze forever
  if (isWaitingForBackend && (millis() - detectionTime > 5000)) {
    Serial.println("TIMEOUT_WAITING_FOR_BACKEND");
    isWaitingForBackend = false;
    digitalWrite(ledPin, LOW);
  }
  
  delay(50); // Small delay to stabilize readings
}

void dispenseRice() {
  Serial.println("Dispensing...");
  riceServo.write(90);  // Open valve
  delay(1500);          // Keep open for 1.5 seconds (adjust based on rice amount)
  riceServo.write(0);   // Close valve
  Serial.println("DISPENSE_COMPLETE");
}