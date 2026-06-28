# API Response Format

Successful responses:

```json
{
  "data": {},
  "meta": { "requestId": "..." },
  "error": null
}
```

Errors:

```json
{
  "data": null,
  "meta": { "requestId": "..." },
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "fields": {}
  }
}
```
