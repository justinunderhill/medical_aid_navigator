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
- All arrays may be empty but must be present.
- No field may contain a claim guarantee, diagnosis, or broker advice.
- `possibleBenefitCategory` must include a "confirm with your scheme" style caveat.
- For emergencies, `isEmergency` is true and `immediateNextStep` must direct
  the user to urgent care; benefit fields may be brief and focused on after-care.
