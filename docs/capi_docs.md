# Meta Conversions API (CAPI) — Integration Reference

Source: Meta for Developers — https://developers.facebook.com/docs/marketing-api/conversions-api/
API Version: v21.0

---

## Overview

The Conversions API (CAPI) lets you send web events, app events, and offline events directly from
your server to Meta, bypassing browser limitations (ad blockers, iOS privacy changes).

Multiple integration paths exist:
1. **Direct server-to-server API** — call the Graph API endpoint directly from your backend
2. **Meta Pixel + CAPI deduplication** — browser Pixel fires AND server CAPI fires; deduplicated via event_id
3. **GTM Server-Side** — route events through Google Tag Manager's server container
4. **Partner integrations** — CDPs, ESPs, or platforms (e.g. Shopify, HubSpot) have built-in CAPI support

---

## Authentication

All requests require an **access token** passed as the `access_token` query parameter (or in the POST body).

Use a **System User access token** for server-side integrations (preferred over Page access tokens
because they don't expire by default and are not tied to a user's Facebook account).

```
POST https://graph.facebook.com/v21.0/{pixel_id}/events?access_token=<TOKEN>
```

Token scopes required: `ads_management` or a system user with "Advertise" permission on the ad account.

---

## Endpoint

```
POST /{pixel_id}/events
```

Note: Meta documentation sometimes uses the term "Dataset ID" interchangeably with "Pixel ID" in
newer API versions, particularly when referring to offline conversion datasets. The path parameter
is the same field; the terminology depends on the asset type being tracked.

---

## Request Body

Content-Type: application/json

```json
{
  "data": [ <array of Event objects, max 1,000 per request> ],
  "test_event_code": "<optional string for test/debug mode>"
}
```

The `access_token` can be provided either as a query parameter or as a top-level field in the JSON body.
If both are provided, the query parameter takes precedence.

---

## Event Object Schema

Each event in the `data` array:

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| event_name | Yes | string | Standard event (Purchase, Lead, ViewContent, etc.) or custom |
| event_time | Yes | integer | Unix timestamp in seconds (UTC). Must be within last 7 days. |
| action_source | Yes | string | "website", "app", "email", "phone_call", "chat", "physical_store", "system_generated", "other" |
| event_id | No | string | Recommended for deduplication with browser Pixel. Match event_id in Pixel JS. |
| event_source_url | No | string | URL where conversion happened (for website action_source) |
| user_data | Yes | object | At least one user identifier required |
| custom_data | No | object | Custom properties (value, currency, order_id, etc.) |
| data_processing_options | No | array | CCPA/LDU handling |

---

## user_data Object

**Critical: All PII fields must be SHA-256 hashed before sending.**
The API will not hash them for you. Sending unhashed PII violates Meta's terms of service.

Normalization rules (must be applied BEFORE hashing):
- Lowercase the string
- Remove leading/trailing whitespace
- For phone numbers: remove all non-numeric characters; include country code (e.g. "14155552671")
- For city: full city name, lowercase (e.g. "menlo park")
- For state: 2-letter US state abbreviation, lowercase (e.g. "ca")
- For zip: 5-digit US zip (e.g. "94025")
- For date of birth: "YYYYMMDD" format

| Parameter | Description | Must Hash |
|-----------|-------------|-----------|
| em | Email address | Yes |
| ph | Phone number | Yes |
| fn | First name | Yes |
| ln | Last name | Yes |
| db | Date of birth (YYYYMMDD) | Yes |
| ge | Gender ("m" or "f") | Yes |
| ct | City | Yes |
| st | State | Yes |
| zp | Zip/postal code | Yes |
| country | 2-letter country code lowercase | Yes |
| external_id | Your internal user/customer ID | Yes (recommended) |
| client_ip_address | IP address | No |
| client_user_agent | User agent string | No |
| fbc | Browser cookie (_fbc) | No |
| fbp | Browser cookie (_fbp) | No |

---

## Batching

- Maximum **1,000 events per request**
- **All-or-nothing validation**: if ANY event in the batch fails validation, the **entire batch is rejected**
  with a 400 error. There is no partial success response.
- Recommended: validate all events client-side before sending; or send events one at a time
  during development, then batch in production.

---

## Response

Success:
```json
{
  "events_received": 1,
  "fbtrace_id": "ABC123"
}
```

Error:
```json
{
  "error": {
    "message": "Invalid parameter",
    "type": "OAuthException",
    "code": 100,
    "error_subcode": 1234567,
    "fbtrace_id": "DEF456"
  }
}
```

---

## Event Match Quality (EMQ)

EMQ is Meta's score (1–10) for how well your events can be matched to Facebook users.
Higher EMQ → better optimization and attribution.

EMQ depends on:
1. **Number of user_data fields provided** — more matched fields = higher score
2. **Correct normalization** — unhashed or incorrectly formatted fields score as mismatches
3. **Correct field values** — em + ph together score higher than either alone
4. **event_id deduplication** — prevents double-counting when using both Pixel and CAPI

---

## Rate Limits

Meta does not publish explicit per-endpoint rate limits for CAPI. General Graph API limits:
- Calls are metered per-app per-user
- HTTP 429 with `Retry-After` header when throttled
- Exponential backoff is recommended

---

## Test Events

During development, pass `test_event_code` in the request body to send test events visible
in the Meta Events Manager Test Events tool without affecting production reporting.

```json
{
  "data": [...],
  "test_event_code": "TEST12345"
}
```

Test event codes are available in Events Manager → Data Sources → your Pixel → Test Events tab.

---

## Deduplication

To deduplicate events sent via both browser Pixel and CAPI:
- Set the same `event_id` value in the Pixel `fbq('track', 'Purchase', {...}, {eventID: 'ORDER123'})` call
  AND in the CAPI `event_id` field
- Events with the same event_name + event_id within a 48-hour window are deduplicated
- The browser Pixel event is kept by default; CAPI event is dropped

---

## Common Integration Mistakes

1. Sending unhashed PII — fails silently or gets flagged in Events Manager
2. Using Pixel ID when a Dataset ID is expected (for offline events) or vice versa
3. Forgetting to normalize strings before hashing (e.g. "John@Example.COM" vs "john@example.com")
4. Sending event_time in milliseconds instead of seconds
5. Sending future event_time (even 1 second in the future causes rejection)
6. Using a Page access token instead of a System User token (expires, can be revoked)
