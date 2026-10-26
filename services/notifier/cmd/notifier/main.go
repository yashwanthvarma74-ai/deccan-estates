package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/segmentio/kafka-go"

	"github.com/yashwanth/hyderabad-realestate-platform/services/notifier/internal/enquiry"
)

func main() {
	brokers := strings.Split(os.Getenv("KAFKA_BROKERS"), ",")
	if brokers[0] == "" {
		slog.Error("KAFKA_BROKERS is not set")
		os.Exit(1)
	}
	topic := envOr("ENQUIRY_TOPIC", "enquiry.created")
	n := enquiry.Notifier{WebhookURL: os.Getenv("NOTIFY_WEBHOOK_URL")}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	r := kafka.NewReader(kafka.ReaderConfig{Brokers: brokers, GroupID: "notifier", Topic: topic, MinBytes: 1, MaxBytes: 1 << 20, CommitInterval: time.Second})
	defer r.Close()
	slog.Info("notifier listening", "topic", topic, "brokers", brokers)

	for {
		m, err := r.FetchMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			slog.Error("fetch failed", "err", err)
			time.Sleep(2 * time.Second)
			continue
		}
		if err := handle(ctx, n, m); err != nil {
			slog.Error("giving up on message", "offset", m.Offset, "err", err)
		}
		_ = r.CommitMessages(ctx, m)
	}
}

// handle retries transient failures (for example the webhook being down) a few times;
// invalid messages are skipped straight away because they can never succeed.
func handle(ctx context.Context, n enquiry.Notifier, m kafka.Message) error {
	var err error
	for attempt := 1; attempt <= 5; attempt++ {
		if err = n.Handle(ctx, m.Value); err == nil {
			return nil
		}
		if errors.Is(err, enquiry.ErrInvalid) {
			return err
		}
		slog.Warn("handling failed, retrying", "attempt", attempt, "err", err)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(time.Duration(attempt) * 2 * time.Second):
		}
	}
	return err
}

func envOr(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
