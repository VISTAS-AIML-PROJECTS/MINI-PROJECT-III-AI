/*
  BrailleLearn - ESP32 six-button Braille practice console (letters A-Z)
  Board : ESP32 Dev Module (Arduino-ESP32 core 2.x or 3.x)
  Status: written for the project; NOT yet tested on hardware.

  How it works
  - Six buttons = dots 1-6, one button = CONFIRM. All buttons go between
    the GPIO pin and GND (internal pull-ups are used).
  - A pressed dot is latched until CONFIRM, so dots need not be held together.
  - Hold CONFIRM for about 1 s to clear the latched dots.
  - The response is compared with the target dot by dot:
        missed = target & ~response   (dots left out)
        extra  = response & ~target   (dots pressed but not needed)
  - Per-dot error scores drive the "targeted" mode.

  Serial monitor (115200 baud) = supervisor view. Commands:
        r = random letters      t = targeted practice
        f = free practice (no scoring)     s = print score and error table
        n = skip to next letter
*/

#include <Arduino.h>

// ---------------- Pin assignment (change to match your wiring) ----------------
// Avoid GPIO 0, 2, 12, 15 (boot strapping) and 34-39 (no internal pull-up).
const uint8_t DOT_PIN[6]   = {13, 14, 27, 26, 25, 33};  // dots 1..6
const uint8_t CONFIRM_PIN  = 32;
const uint8_t LED_GREEN    = 18;
const uint8_t LED_RED      = 19;
const uint8_t BUZZER_PIN   = 23;

#define PASSIVE_BUZZER 1   // 1 = passive buzzer (tones), 0 = active buzzer (on/off)

// ---------------- Tunable parameters ----------------
const unsigned long DEBOUNCE_MS   = 25;
const unsigned long CLEAR_HOLD_MS = 1000;
const float LAMBDA   = 0.90f;   // forgetting factor for error scores (Eq. 3-4)
const float EPSILON  = 0.50f;   // keeps every letter possible (Eq. 6)

// ---------------- Braille table A-Z ----------------
// Dot numbers for each letter; converted to bit masks at start-up.
// Bit (d-1) of a mask stands for dot d.
const char* LETTER_DOTS[26] = {
  "1",     "12",    "14",    "145",   "15",    "124",   "1245",  "125",   "24",
  "245",   "13",    "123",   "134",   "1345",  "135",   "1234",  "12345", "1235",
  "234",   "2345",  "136",   "1236",  "2456",  "1346",  "13456", "1356"
};
uint8_t LETTER_MASK[26];

// ---------------- State ----------------
enum Mode { MODE_RANDOM, MODE_TARGETED, MODE_FREE };
Mode mode = MODE_RANDOM;

uint8_t  latched = 0;          // dots latched so far (bit d-1 = dot d)
int      target = -1;          // index 0..25
int      lastTarget = -1;
float    missScore[6] = {0};   // m_d
float    extraScore[6] = {0};  // e_d
unsigned attempts = 0, correctCount = 0;
unsigned attemptsThisLetter = 0;

// Debounce data for 7 inputs: index 0-5 dots, 6 confirm
struct Btn {
  uint8_t pin;
  bool stable = false;          // true = pressed
  bool lastRaw = false;
  unsigned long changedAt = 0;
  unsigned long pressedAt = 0;
};
Btn btn[7];

// ---------------- Buzzer helpers ----------------
void toneStart(int freq) {
#if PASSIVE_BUZZER
  #if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcWriteTone(BUZZER_PIN, freq);
  #else
    ledcWriteTone(0, freq);
  #endif
#else
  digitalWrite(BUZZER_PIN, HIGH);
#endif
}
void toneStop() {
#if PASSIVE_BUZZER
  #if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcWriteTone(BUZZER_PIN, 0);
  #else
    ledcWriteTone(0, 0);
  #endif
#else
  digitalWrite(BUZZER_PIN, LOW);
#endif
}
void beep(int freq, int ms) { toneStart(freq); delay(ms); toneStop(); }

void buzzerInit() {
#if PASSIVE_BUZZER
  #if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcAttach(BUZZER_PIN, 2000, 8);
  #else
    ledcSetup(0, 2000, 8);
    ledcAttachPin(BUZZER_PIN, 0);
  #endif
#else
  pinMode(BUZZER_PIN, OUTPUT);
#endif
}

// ---------------- Feedback ----------------
void feedbackCorrect() {
  digitalWrite(LED_GREEN, HIGH);
  beep(1200, 120); delay(40); beep(1600, 180);
  delay(200);
  digitalWrite(LED_GREEN, LOW);
}
void feedbackWrong() {
  digitalWrite(LED_RED, HIGH);
  beep(300, 350);
  delay(150);
  digitalWrite(LED_RED, LOW);
}
void feedbackCleared() { beep(800, 60); delay(60); beep(800, 60); }
void feedbackPress()   { beep(1000, 15); }

// ---------------- Braille utilities ----------------
uint8_t parseMask(const char* dots) {
  uint8_t m = 0;
  for (const char* p = dots; *p; ++p) {
    if (*p >= '1' && *p <= '6') m |= (1 << (*p - '1'));
  }
  return m;
}

void printDots(uint8_t mask) {
  bool any = false;
  for (int d = 0; d < 6; d++) {
    if (mask & (1 << d)) { if (any) Serial.print(','); Serial.print(d + 1); any = true; }
  }
  if (!any) Serial.print("none");
}

// ---------------- Target selection ----------------
// r(c) = sum of missScore over dots in c + sum of extraScore over dots not in c
float riskOf(int c) {
  float r = 0;
  for (int d = 0; d < 6; d++) {
    if (LETTER_MASK[c] & (1 << d)) r += missScore[d];
    else                           r += extraScore[d];
  }
  return r;
}

int pickTargeted() {
  float w[26], total = 0;
  for (int c = 0; c < 26; c++) {
    w[c] = (c == lastTarget) ? 0.0f : riskOf(c) + EPSILON;  // avoid immediate repeat
    total += w[c];
  }
  float x = (esp_random() / 4294967296.0f) * total;
  for (int c = 0; c < 26; c++) {
    if (x < w[c]) return c;
    x -= w[c];
  }
  return (lastTarget + 1) % 26;
}

int pickRandom() {
  int c;
  do { c = esp_random() % 26; } while (c == lastTarget);
  return c;
}

void nextTarget() {
  lastTarget = target;
  if (mode == MODE_TARGETED)    target = pickTargeted();
  else if (mode == MODE_RANDOM) target = pickRandom();
  else                          target = -1;
  latched = 0;
  attemptsThisLetter = 0;
  if (target >= 0) {
    Serial.print("\nTarget letter: ");
    Serial.print((char)('A' + target));
    Serial.print("   (dots ");
    printDots(LETTER_MASK[target]);
    Serial.println(")");
  } else {
    Serial.println("\nFree practice: press dots, then confirm.");
  }
}

// ---------------- Evaluation (Eq. 1-6) ----------------
void updateScores(uint8_t missed, uint8_t extra) {
  for (int d = 0; d < 6; d++) {
    missScore[d]  = LAMBDA * missScore[d]  + ((missed & (1 << d)) ? 1.0f : 0.0f);
    extraScore[d] = LAMBDA * extraScore[d] + ((extra  & (1 << d)) ? 1.0f : 0.0f);
  }
}

void evaluate() {
  uint8_t resp = latched & 0x3F;
  if (resp == 0) return;                      // empty confirm is ignored

  if (mode == MODE_FREE) {
    Serial.print("Entered dots: "); printDots(resp);
    int hit = -1;
    for (int c = 0; c < 26; c++) if (LETTER_MASK[c] == resp) hit = c;
    if (hit >= 0) { Serial.print("  -> letter "); Serial.print((char)('A' + hit)); }
    else          { Serial.print("  -> no letter A-Z uses this pattern"); }
    Serial.println();
    feedbackPress();
    latched = 0;
    return;
  }

  uint8_t T = LETTER_MASK[target];
  uint8_t missed = T & ~resp & 0x3F;
  uint8_t extra  = resp & ~T & 0x3F;
  bool correct = (missed | extra) == 0;

  attempts++;
  attemptsThisLetter++;
  updateScores(missed, extra);

  Serial.print("Response: "); printDots(resp);
  if (correct) {
    correctCount++;
    Serial.println("  -> CORRECT");
    feedbackCorrect();
    nextTarget();
  } else {
    Serial.print("  -> WRONG   missed: "); printDots(missed);
    Serial.print("   extra: ");            printDots(extra);
    Serial.println();
    feedbackWrong();
    latched = 0;                              // try again on the same letter
  }
}

void printReport() {
  Serial.println("\n--- Session report ---");
  Serial.print("Attempts: "); Serial.print(attempts);
  Serial.print("  Correct: "); Serial.println(correctCount);
  Serial.println("Dot  missScore  extraScore");
  for (int d = 0; d < 6; d++) {
    Serial.print("  "); Serial.print(d + 1); Serial.print("     ");
    Serial.print(missScore[d], 2); Serial.print("       ");
    Serial.println(extraScore[d], 2);
  }
}

// ---------------- Input handling ----------------
// Returns via events: dot pressed (latch), confirm released (evaluate / clear).
void scanButtons() {
  unsigned long now = millis();
  for (int i = 0; i < 7; i++) {
    bool raw = (digitalRead(btn[i].pin) == LOW);       // LOW = pressed
    if (raw != btn[i].lastRaw) { btn[i].lastRaw = raw; btn[i].changedAt = now; }
    if ((now - btn[i].changedAt) >= DEBOUNCE_MS && raw != btn[i].stable) {
      btn[i].stable = raw;
      if (i < 6) {
        if (raw) { latched |= (1 << i); feedbackPress(); }       // latch on press
      } else {
        if (raw) btn[6].pressedAt = now;
        else {                                                    // confirm released
          if (now - btn[6].pressedAt >= CLEAR_HOLD_MS) {
            latched = 0; feedbackCleared();
            Serial.println("Cleared.");
          } else {
            evaluate();
          }
        }
      }
    }
  }
}

void handleSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == 'r') { mode = MODE_RANDOM;   Serial.println("\nMode: random");   lastTarget = -1; nextTarget(); }
    else if (c == 't') { mode = MODE_TARGETED; Serial.println("\nMode: targeted"); lastTarget = -1; nextTarget(); }
    else if (c == 'f') { mode = MODE_FREE;     Serial.println("\nMode: free");     nextTarget(); }
    else if (c == 's') { printReport(); }
    else if (c == 'n' && mode != MODE_FREE) { nextTarget(); }
  }
}

// ---------------- Arduino entry points ----------------
void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 26; i++) LETTER_MASK[i] = parseMask(LETTER_DOTS[i]);

  for (int i = 0; i < 6; i++) { btn[i].pin = DOT_PIN[i]; pinMode(DOT_PIN[i], INPUT_PULLUP); }
  btn[6].pin = CONFIRM_PIN; pinMode(CONFIRM_PIN, INPUT_PULLUP);

  pinMode(LED_GREEN, OUTPUT); pinMode(LED_RED, OUTPUT);
  buzzerInit();

  Serial.println("\nBrailleLearn - letters A-Z");
  Serial.println("Commands: r random | t targeted | f free | s report | n next");
  beep(1000, 80);
  nextTarget();
}

void loop() {
  scanButtons();
  handleSerial();
}
