# 10. Enquiry events on Kafka

Date: 2026-10-26 · Status: Accepted (slice 4 of Phase 2)

## Context
When someone submits the Sell form the team should hear about it without the API waiting on any notification channel.

## Decision
After saving an enquiry the API publishes `enquiry.created` (keyed by enquiry id) through `EventsService`. The event carries the id, property type, locality, expected price and time, and no name, phone or email; consumers look the enquiry up by id. With `KAFKA_BROKERS` unset the publisher does nothing, and a broker error is logged and dropped, so the form never fails because of Kafka. `services/notifier` (Go, kafka-go, consumer group `notifier`) turns each event into a one-line summary, logs it, and posts it to `NOTIFY_WEBHOOK_URL` when set. It retries a failing webhook up to five times, then moves on; malformed messages are skipped.

## Consequences
- Delivery is best effort: an event can be lost if Kafka is down when the enquiry is saved. The enquiry is always in the database, so a later slice could add an outbox table to replay missed events.
- Other consumers (agent assignment, CRM sync) can subscribe to the same topic without changing the API.
