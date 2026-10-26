// Package enquiry turns enquiry.created events into notifications.
package enquiry

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

// Event is what the API publishes. It carries no contact details; look the enquiry up by ID.
type Event struct {
	ID               string  `json:"id"`
	PropertyType     *string `json:"propertyType"`
	Locality         *string `json:"locality"`
	ExpectedPriceInr *int64  `json:"expectedPriceInr"`
	CreatedAt        string  `json:"createdAt"`
}

var ErrInvalid = errors.New("invalid enquiry event")

func Decode(b []byte) (Event, error) {
	var e Event
	if err := json.Unmarshal(b, &e); err != nil {
		return e, fmt.Errorf("%w: %v", ErrInvalid, err)
	}
	if e.ID == "" {
		return e, fmt.Errorf("%w: missing id", ErrInvalid)
	}
	return e, nil
}

// Summary is the one-line text sent to the team.
func (e Event) Summary() string {
	kind, place, price := "property", "Hyderabad", ""
	if e.PropertyType != nil {
		kind = *e.PropertyType
	}
	if e.Locality != nil {
		place = *e.Locality
	}
	if e.ExpectedPriceInr != nil {
		price = fmt.Sprintf(" expecting about ₹%.2f Cr", float64(*e.ExpectedPriceInr)/1e7)
	}
	return fmt.Sprintf("New sell enquiry %s: %s in %s%s", e.ID, kind, place, price)
}

// Notifier posts the summary to a webhook (Slack-style {"text": ...}); with no URL it only logs.
type Notifier struct {
	WebhookURL string
	Client     *http.Client
}

// Handle processes one raw message. Invalid messages return ErrInvalid so the caller can skip them.
func (n Notifier) Handle(ctx context.Context, value []byte) error {
	e, err := Decode(value)
	if err != nil {
		return err
	}
	text := e.Summary()
	slog.Info("enquiry", "id", e.ID, "summary", text)
	if n.WebhookURL == "" {
		return nil
	}
	body, _ := json.Marshal(map[string]string{"text": text})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, n.WebhookURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	c := n.Client
	if c == nil {
		c = &http.Client{Timeout: 5 * time.Second}
	}
	res, err := c.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return fmt.Errorf("webhook returned %d", res.StatusCode)
	}
	return nil
}
