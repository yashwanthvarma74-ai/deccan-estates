package main

import (
	"context"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"

	pb "github.com/yashwanth/hyderabad-realestate-platform/services/verification/gen"
	"github.com/yashwanth/hyderabad-realestate-platform/services/verification/internal/report"
)

type server struct {
	pb.UnimplementedVerificationServer
}

var statusOf = map[string]pb.Status{"VERIFIED": pb.Status_VERIFIED, "CAUTION": pb.Status_CAUTION, "RISK": pb.Status_RISK}
var resultOf = map[report.Result]pb.CheckResult{report.Pass: pb.CheckResult_PASS, report.Warn: pb.CheckResult_WARN, report.Fail: pb.CheckResult_FAIL}
var validTypes = map[string]bool{"PLOT": true, "VILLA": true, "APARTMENT": true, "GATED_COMMUNITY": true, "COMMERCIAL": true}

func (server) GetReport(_ context.Context, req *pb.GetReportRequest) (*pb.Report, error) {
	if !validTypes[req.Type] {
		return nil, status.Errorf(codes.InvalidArgument, "unknown property type %q", req.Type)
	}
	if req.Seed < 0 {
		return nil, status.Error(codes.InvalidArgument, "seed must not be negative")
	}
	r := report.Build(report.Subject{Type: req.Type, Possession: req.Possession, Approval: req.Approval, Locality: req.Locality}, int(req.Seed))
	out := &pb.Report{Status: statusOf[r.Status], Score: int32(r.Score), Summary: r.Summary}
	for _, c := range r.Checks {
		out.Checks = append(out.Checks, &pb.Check{Key: c.Key, Label: c.Label, Result: resultOf[c.Result], Note: c.Note, Source: c.Source})
	}
	return out, nil
}

func main() {
	addr := ":" + envOr("VERIFICATION_PORT", "4200")
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		slog.Error("listen failed", "err", err)
		os.Exit(1)
	}
	s := grpc.NewServer()
	pb.RegisterVerificationServer(s, server{})
	hs := health.NewServer()
	healthpb.RegisterHealthServer(s, hs)
	reflection.Register(s)

	go func() {
		stop := make(chan os.Signal, 1)
		signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
		<-stop
		s.GracefulStop()
	}()
	slog.Info("verification service listening", "addr", addr)
	if err := s.Serve(lis); err != nil {
		slog.Error("serve failed", "err", err)
		os.Exit(1)
	}
}

func envOr(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
