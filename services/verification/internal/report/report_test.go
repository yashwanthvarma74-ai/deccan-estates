package report

import (
	"encoding/json"
	"os"
	"reflect"
	"testing"
)

type goldenCase struct {
	Subject struct {
		Type       string  `json:"type"`
		Possession string  `json:"possession"`
		Approval   *string `json:"approval"`
		Locality   string  `json:"locality"`
	} `json:"subject"`
	N      int    `json:"n"`
	Report Report `json:"report"`
}

// Every report must match what the TypeScript implementation produced for the same input.
func TestMatchesTypeScript(t *testing.T) {
	raw, err := os.ReadFile("testdata/golden.json")
	if err != nil {
		t.Fatal(err)
	}
	var cases []goldenCase
	if err := json.Unmarshal(raw, &cases); err != nil {
		t.Fatal(err)
	}
	if len(cases) == 0 {
		t.Fatal("no golden cases")
	}
	for _, c := range cases {
		s := Subject{Type: c.Subject.Type, Possession: c.Subject.Possession, Locality: c.Subject.Locality}
		if c.Subject.Approval != nil {
			s.Approval = *c.Subject.Approval
		}
		got := Build(s, c.N)
		if !reflect.DeepEqual(got, c.Report) {
			t.Fatalf("%s n=%d differs:\n got  %+v\n want %+v", s.Type, c.N, got, c.Report)
		}
	}
}

func TestScoreBoundsAndRisk(t *testing.T) {
	for n := 0; n < 500; n++ {
		r := Build(Subject{Type: "PLOT", Possession: "READY"}, n)
		if r.Score < 0 || r.Score > 100 {
			t.Fatalf("score %d out of range", r.Score)
		}
		for _, c := range r.Checks {
			if c.Result == Fail && r.Status != "RISK" {
				t.Fatalf("n=%d has a failed check but status %s", n, r.Status)
			}
		}
	}
}
