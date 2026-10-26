# 10. Enquiry events on Kafka

Date: 2026-10-26 · Status: Accepted (slices 4 and 6 of Phase 2)

## Context
When someone submits the Sell form the team should hear about it without the API waiting on any notification channel.

## Decision
After saving an enquiry the API publishes `enquiry.created` (keyed by enquiry id) through `EventsService`. The event carries the id, property type, locality, expected price and time, and no name, phone or email; consumers look the enquiry up by id. With `KAFKA_BROKERS` unset the publisher does nothing, and a broker error is logged and dropped, so the form never fails because of Kafka. `services/notifier` (Go, kafka-go, consumer group `notifier`) turns each event into a one-line summary, logs it, and posts it to `NOTIFY_WEBHOOK_URL` when set. It retries a failing webhook up to five times, then moves on; malformed messages are skipped.

## Consequences
- Events go through a transactional outbox (`OutboxEvent` table, `OutboxService`). The enquiry and its event are saved in one transaction; the API then tries to publish straight away, and a sweep every 5 s (`OUTBOX_SWEEP_MS`) replays anything still waiting, oldest first, using `FOR UPDATE SKIP LOCKED` so several API replicas can run it. If Kafka is down the event waits and the enquiry still succeeds.
- Delivery is at least once. A crash between publishing and marking a row can send an event twice, so consumers must tolerate repeats (the notifier would post the same line twice). Published rows are deleted after 7 days.
- With `KAFKA_BROKERS` unset nothing is queued, so the table never fills up with events that could not be sent.
- Other consumers (agent assignment, CRM sync) can subscribe to the same topic without changing the API.
