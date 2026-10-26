package enquiry

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDecodeRejectsBadMessages(t *testing.T) {
	for _, in := range []string{"not json", `{"locality":"Kokapet"}`} {
		if _, err := Decode([]byte(in)); !errors.Is(err, ErrInvalid) {
			t.Fatalf("%q: want ErrInvalid, got %v", in, err)
		}
	}
}

func TestSummary(t *testing.T) {
	typ, loc, price := "PLOT", "Kokapet", int64(45000000)
	got := Event{ID: "e1", PropertyType: &typ, Locality: &loc, ExpectedPriceInr: &price}.Summary()
	want := "New sell enquiry e1: PLOT in Kokapet expecting about ₹4.50 Cr"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	if s := (Event{ID: "e2"}).Summary(); s != "New sell enquiry e2: property in Hyderabad" {
		t.Fatalf("defaults wrong: %q", s)
	}
}

func TestHandlePostsToWebhook(t *testing.T) {
	var body string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		body = string(b)
	}))
	defer srv.Close()
	err := Notifier{WebhookURL: srv.URL}.Handle(context.Background(), []byte(`{"id":"e1","locality":"Kokapet"}`))
	if err != nil || !strings.Contains(body, "e1") {
		t.Fatalf("err=%v body=%q", err, body)
	}
}

func TestHandleReportsWebhookFailure(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(500) }))
	defer srv.Close()
	if err := (Notifier{WebhookURL: srv.URL}).Handle(context.Background(), []byte(`{"id":"e1"}`)); err == nil {
		t.Fatal("expected an error for a 500 response")
	}
}
