# Algorithm Notes

## 1. Pattern representation

Each letter A–Z is stored as a string of dot numbers, then converted to a six-bit mask. Bit 0 represents dot 1, bit 1 represents dot 2, and so on through bit 5 for dot 6.

## 2. Missing and extra dots

Let `T` be the target mask and `R` be the entered response mask.

```text
missing = T & ~R & 0x3F
extra   = R & ~T & 0x3F
```

The `0x3F` mask restricts results to six valid dot positions. A response is correct when both masks are zero.

## 3. Per-dot scores

For each dot `d`, the code keeps two scores:

- `missScore[d]`: how often the learner omits that dot
- `extraScore[d]`: how often the learner selects that dot unnecessarily

Scores decay by a factor of `0.90` on each scored response, and an error adds `1.0` to the corresponding score. The scores are stored in RAM only.

## 4. Targeted selection

The risk score for a candidate letter combines miss scores for dots used by that letter and extra scores for dots not used by it. The candidate's selection weight is its risk plus `0.50`; the immediately previous target is assigned zero weight to avoid an immediate repeat. A weighted random draw selects the next target.

This is a rule-based heuristic. It is not a trained AI or machine-learning model, and its effect on learning must be evaluated with real tests.

## 5. Modes

- **Random (`r`)**: selects random letters while avoiding an immediate repeat.
- **Targeted (`t`)**: uses accumulated dot-error scores to weight candidate letters.
- **Free (`f`)**: reports the letter matching the entered pattern, if an A–Z match exists, without scoring correctness.
