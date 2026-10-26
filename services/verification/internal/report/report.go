// Package report builds the due-diligence report for a listing.
// It is a port of services/api-gateway/src/verification/verification.ts and must stay in step with it:
// the golden test compares every result against the TypeScript output.
package report

import (
	"fmt"
	"math"
)

type Result string

const (
	Pass Result = "PASS"
	Warn Result = "WARN"
	Fail Result = "FAIL"
)

type Subject struct {
	Type       string
	Possession string
	Approval   string
	Locality   string
}

type Check struct {
	Key    string `json:"key"`
	Label  string `json:"label"`
	Result Result `json:"result"`
	Note   string `json:"note"`
	Source string `json:"source"`
}

type Report struct {
	Status  string  `json:"status"`
	Score   int     `json:"score"`
	Summary string  `json:"summary"`
	Checks  []Check `json:"checks"`
}

// roll is a tiny deterministic hash, so the same listing always gets the same report.
func roll(n, salt int) float64 {
	x := math.Sin(float64(n+1)*12.9898+float64(salt)*78.233) * 43758.5453
	return x - math.Floor(x)
}

var weight = map[Result]int{Pass: 0, Warn: 8, Fail: 22}

func outcome(n, salt int, warnAt, failAt float64) Result {
	r := roll(n, salt)
	switch {
	case r > failAt:
		return Fail
	case r > warnAt:
		return Warn
	}
	return Pass
}

var notes = map[string]map[Result]string{
	"layout": {
		Pass: "Layout approved; plot number appears in the approved plan.",
		Warn: "Layout approval found, but this plot number needs a plan copy to confirm.",
		Fail: "No approved layout found for this survey number. Likely an unauthorised layout.",
	},
	"zone": {
		Pass: "Residential land use under the master plan.",
		Warn: "Mixed or agricultural land use; conversion papers should be seen.",
		Fail: "Land use does not allow residential construction.",
	},
	"water": {
		Pass: "Outside lake full-tank level and buffer zones.",
		Warn: "Close to a water-body buffer; confirm the exact boundary on site.",
		Fail: "Falls inside a full-tank-level or buffer zone. Construction is restricted.",
	},
	"title": {
		Pass: "Ownership chain traced for 30 years without a break.",
		Warn: "A gap in the ownership chain; a legal opinion is advised.",
		Fail: "Broken chain of title. Do not proceed without legal clearance.",
	},
	"encumbrance": {
		Pass: "No mortgages or charges on the encumbrance certificate.",
		Warn: "An old charge appears without a closure record.",
		Fail: "Active mortgage or attachment registered against the property.",
	},
	"records": {
		Pass: "Seller name and extent match the Dharani land record.",
		Warn: "Extent differs slightly from the land record.",
		Fail: "Seller does not match the owner in the land record.",
	},
	"litigation": {
		Pass: "No court cases found against the property or the seller.",
		Warn: "A closed case is on record; review the order.",
		Fail: "A pending court case concerns this property.",
	},
	"rera": {
		Pass: "RERA registration is valid and the project is in good standing.",
		Warn: "RERA registration expires soon; ask for the extension.",
		Fail: "RERA registration is missing or lapsed.",
	},
	"plan": {
		Pass: "Building plan sanctioned; the built area matches the plan.",
		Warn: "Minor deviation from the sanctioned plan.",
		Fail: "Construction exceeds the sanctioned plan.",
	},
	"occupancy": {
		Pass: "Occupancy certificate issued.",
		Warn: "Occupancy certificate applied for, not yet issued.",
		Fail: "No occupancy certificate for a building that is already occupied.",
	},
	"builder": {
		Pass: "Developer has delivered earlier projects on time.",
		Warn: "Some earlier projects were delivered late.",
		Fail: "Developer has unresolved buyer complaints.",
	},
}

func plural(n int) string {
	if n == 1 {
		return ""
	}
	return "s"
}

// Build returns the report for a subject; n is a stable number for the listing.
func Build(s Subject, n int) Report {
	checks := []Check{}
	add := func(key, label, source string, salt int, warnAt, failAt float64) {
		r := outcome(n, salt, warnAt, failAt)
		checks = append(checks, Check{Key: key, Label: label, Result: r, Note: notes[key][r], Source: source})
	}

	if s.Type == "PLOT" {
		layoutSource := s.Approval
		if layoutSource == "" {
			layoutSource = "HMDA / DTCP"
		}
		add("layout", "Layout approval", layoutSource, 1, 0.82, 0.96)
		add("zone", "Land use zone", "HMDA master plan", 2, 0.9, 0.98)
		add("water", "Lake and buffer zones", "HMDA FTL / buffer map", 3, 0.86, 0.96)
		add("title", "Chain of title (30 years)", "Sale deeds", 4, 0.84, 0.97)
		add("encumbrance", "Encumbrance certificate", "Registration dept.", 5, 0.85, 0.96)
		add("records", "Land record match", "Dharani", 6, 0.86, 0.97)
		add("litigation", "Litigation search", "Court records", 7, 0.9, 0.98)
	} else {
		add("rera", "RERA registration", "TS RERA", 11, 0.9, 0.98)
		add("plan", "Sanctioned building plan", "GHMC / HMDA", 12, 0.86, 0.97)
		if s.Possession == "READY" {
			add("occupancy", "Occupancy certificate", "GHMC", 13, 0.82, 0.96)
		}
		add("builder", "Developer track record", "RERA complaints", 14, 0.8, 0.96)
		add("title", "Chain of title", "Sale deeds", 15, 0.86, 0.97)
		add("encumbrance", "Encumbrance certificate", "Registration dept.", 16, 0.86, 0.97)
		add("litigation", "Litigation search", "Court records", 17, 0.9, 0.98)
	}

	penalty, fails, warns := 0, 0, 0
	for _, c := range checks {
		penalty += weight[c.Result]
		switch c.Result {
		case Fail:
			fails++
		case Warn:
			warns++
		}
	}
	score := max(0, 100-penalty)
	status := "VERIFIED"
	switch {
	case fails > 0:
		status = "RISK"
	case warns > 1 || score < 90:
		status = "CAUTION"
	}
	var summary string
	switch status {
	case "VERIFIED":
		summary = fmt.Sprintf("All %d checks passed. Clear to proceed with the usual agreement and registration.", len(checks))
	case "CAUTION":
		summary = fmt.Sprintf("%d item%s need a closer look before you pay a token amount.", warns, plural(warns))
	default:
		summary = fmt.Sprintf("%d serious issue%s found. Do not pay until these are resolved.", fails, plural(fails))
	}
	return Report{Status: status, Score: score, Summary: summary, Checks: checks}
}
