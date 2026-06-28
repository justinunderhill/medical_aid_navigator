# Checklist Output Format

_Last reviewed: 2026-06. Source: scheme-neutral output contract._

When generating a navigation checklist, the AI must return JSON matching this
shape exactly (no markdown fences, no commentary):

```json
{
  "scenarioSummary": "string — one or two plain sentences restating the situation",
  "isEmergency": false,
  "immediateNextStep": "string",
  "possibleBenefitCategory": "string — uses cautious language, e.g. 'This may fall under hospital benefits — confirm with your scheme.'",
  "askYourScheme": ["string", "string"],
  "askYourProvider": ["string", "string"],
  "documentsToRequest": ["string", "string"],
  "riskAreas": ["string"],
  "whatNotToDo": ["string"],
  "escalationSteps": ["string"]
}
```

Rules:
- All arrays must be present. For non-emergency checklists, include at least one useful item in each array.
- No field may contain a claim guarantee, diagnosis, or broker advice.
- `possibleBenefitCategory` must include a "confirm with your scheme" style caveat.
- `riskAreas` must specifically cover cost/co-payment risks to check, including network/DSP, rates, limits, or authorisation where relevant.
- `whatNotToDo` must include conservative safety language: no assumptions about cover, no delay of urgent care, and no reliance on this tool as confirmation.
- The checklist must end with a reminder to confirm directly with the scheme, provider, or accredited broker, without implying any claim outcome is guaranteed.
- For emergencies, `isEmergency` is true and `immediateNextStep` must direct
  the user to urgent care; benefit fields may be brief and focused on after-care.
