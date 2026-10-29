# Wiring and GPIO Reference

Use this as a reference, then confirm it against the actual prototype before powering the board.

## GPIO assignment in the sketch

| Component | ESP32 GPIO | Configuration / connection |
|---|---:|---|
| Braille dot 1 button | 13 | `INPUT_PULLUP`; button between GPIO and GND |
| Braille dot 2 button | 14 | `INPUT_PULLUP`; button between GPIO and GND |
| Braille dot 3 button | 27 | `INPUT_PULLUP`; button between GPIO and GND |
| Braille dot 4 button | 26 | `INPUT_PULLUP`; button between GPIO and GND |
| Braille dot 5 button | 25 | `INPUT_PULLUP`; button between GPIO and GND |
| Braille dot 6 button | 33 | `INPUT_PULLUP`; button between GPIO and GND |
| Confirm / clear button | 32 | `INPUT_PULLUP`; button between GPIO and GND |
| Green LED | 18 | Output; use a suitable series resistor |
| Red LED | 19 | Output; use a suitable series resistor |
| Buzzer | 23 | Output; confirm buzzer type and wiring |

## Button behavior

The inputs use internal pull-up resistors. A button is considered pressed when its GPIO reads `LOW`, so each button should connect its assigned GPIO to ground when pressed. Dot presses are latched in software; the learner can press dots one at a time.

- Brief press and release of Confirm: submit the current pattern.
- Hold Confirm for approximately one second: clear the current pattern.

## Buzzer configuration

In the sketch, `PASSIVE_BUZZER` is set to `1` for tone output. Set it to `0` only if using the supported active-buzzer on/off behavior. Check the component's voltage/current requirements and do not drive a load beyond the board pin's limits.

## Before powering on

- [ ] Confirm the board model and GPIO labels.
- [ ] Confirm all buttons connect the intended GPIO to GND.
- [ ] Check LED polarity and series resistors.
- [ ] Confirm the buzzer type and wiring.
- [ ] Check for loose wires and shorts.
- [ ] Verify the actual wiring matches the sketch's pin assignments.
