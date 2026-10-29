# BrailleLearn — ESP32 Braille Practice Console

BrailleLearn is a small embedded-systems project for practicing Grade 1 English Braille letters A–Z. It uses six push buttons as Braille dots, an ESP32 to compare the selected pattern with a target letter, and LEDs plus a buzzer for feedback.

## Features

- Six-button Braille input with latched dot selections
- Random-letter practice
- Targeted practice using accumulated missing-dot and extra-dot scores
- Free practice that reports a matching A–Z pattern, if one exists
- Green LED and two-tone feedback for correct answers
- Red LED and lower-tone feedback for incorrect answers
- Serial Monitor summary of attempts and per-dot error scores
- Short press to submit; hold the confirmation button for about one second to clear the current pattern

## Hardware

- ESP32 development board
- 6 push buttons for dots 1–6
- 1 confirmation button
- 1 green LED and suitable current-limiting resistor
- 1 red LED and suitable current-limiting resistor
- Buzzer (firmware supports passive-buzzer tones or active-buzzer on/off)
- Breadboard, jumper wires, and USB data cable

See [`WIRING.md`](WIRING.md) for the GPIO map and connection notes.

## Software setup

1. Install the Arduino IDE.
2. Install the ESP32 board package using the Boards Manager.
3. Open `BrailleLearnSourceCode.ino`.
4. Select the appropriate ESP32 board and COM/serial port.
5. Upload the sketch.
6. Open Serial Monitor at **115200 baud**.
7. Use the commands listed below.

The sketch includes compatibility branches for Arduino-ESP32 core 2.x and 3.x buzzer APIs. If compilation fails, check the installed ESP32 core version and the relevant LEDC API.

## Serial commands

| Command | Action |
|---|---|
| `r` | Start random practice |
| `t` | Start targeted practice |
| `f` | Start free practice |
| `s` | Print the session report |
| `n` | Skip to the next target (not available in free mode) |

## How the error analysis works

The firmware represents each Braille pattern as a six-bit mask. For a target mask `T` and response mask `R`:

- Missing dots: `T & ~R & 0x3F`
- Extra dots: `R & ~T & 0x3F`

The program maintains separate miss and extra scores for each of the six dots. These scores are held in RAM and reset when the ESP32 restarts. Targeted practice uses the scores as weights when selecting a letter; it is a rule-based heuristic, not a trained machine-learning model.

## Current limitations

- The target is displayed in the Serial Monitor, so the current prototype is not independently usable by a learner who cannot access that display.
- Only English letters A–Z are included.
- Scores and attempt counts are not saved after power-off.
- Bluetooth, phone-based speech, cloud storage, and learner profiles are not implemented.
- Do not claim measured accuracy or learning improvement unless testing has actually been conducted and results recorded.

## Testing

Use [`TEST_PLAN.md`](TEST_PLAN.md) to record actual results. The source comments indicate that the sketch was written but not yet tested on hardware; verify the exact uploaded version and update the status only after testing.

## Repository contents

- `BrailleLearnSourceCode.ino` — ESP32 Arduino sketch
- `WIRING.md` — GPIO assignment and wiring notes
- `ALGORITHM.md` — pattern comparison and targeted-practice explanation
- `TEST_PLAN.md` — repeatable verification checklist
- `CONTRIBUTING.md` — small guide for proposed changes
- `LICENSE` — MIT License template; replace the copyright holder before publishing if needed

## Safety and build note

Disconnect USB power before changing wiring. Use current-limiting resistors for LEDs and verify the board's GPIO limits and your physical wiring before powering the circuit.
