# Verification Test Plan

Record actual outcomes only after running each test. Do not fill in results based on expected behavior.

| ID | Test | Expected result | Actual result / date |
|---|---|---|---|
| T1 | Power the ESP32 and open Serial Monitor at 115200 baud | Startup message and initial target appear | To be recorded |
| T2 | Press one dot button | Dot is latched and input acknowledgement occurs | To be recorded |
| T3 | Press multiple dot buttons and briefly press Confirm | Pattern is evaluated against the target | To be recorded |
| T4 | Enter the correct target pattern | Green LED and correct tone; correct count increases | To be recorded |
| T5 | Enter a pattern missing a target dot | Missing dot is reported and incorrect feedback occurs | To be recorded |
| T6 | Enter a pattern with an extra dot | Extra dot is reported and incorrect feedback occurs | To be recorded |
| T7 | Hold Confirm for about one second | Latched pattern is cleared | To be recorded |
| T8 | Send `r`, `t`, and `f` in Serial Monitor | Each operating mode activates | To be recorded |
| T9 | Send `s` after scored attempts | Attempt count, correct count, and per-dot scores print | To be recorded |
| T10 | Restart the ESP32 after creating scores | RAM-based scores reset | To be recorded |

## Suggested quantitative measurements

If evaluating the learning experience, record the number of trials and conditions for each measurement.

- Response accuracy = correct scored responses / total scored responses × 100
- Response time = time from target presentation to confirmed response
- Dot error frequency = count of missing and extra errors for each dot
- Targeted-practice effect = compare results across random and targeted practice sessions
- Input reliability = repeated button press/release cycles and count missed or duplicated inputs

No results are implied by this checklist. Use actual observations and avoid claims of learning improvement without a suitable evaluation.
