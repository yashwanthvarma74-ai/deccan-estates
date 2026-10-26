package main

import (
	"context"
	"net"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"

	pb "github.com/yashwanth/hyderabad-realestate-platform/services/verification/gen"
)

func client(t *testing.T) pb.VerificationClient {
	lis := bufconn.Listen(1 << 20)
	s := grpc.NewServer()
	pb.RegisterVerificationServer(s, server{})
	go s.Serve(lis)
	t.Cleanup(s.Stop)
	conn, err := grpc.NewClient("passthrough:///bufnet",
		grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) { return lis.Dial() }),
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	return pb.NewVerificationClient(conn)
}

func TestGetReportForPlot(t *testing.T) {
	r, err := client(t).GetReport(context.Background(), &pb.GetReportRequest{Type: "PLOT", Possession: "READY", Approval: "HMDA", Seed: 5})
	if err != nil {
		t.Fatal(err)
	}
	if len(r.Checks) != 7 || r.Status == pb.Status_STATUS_UNSPECIFIED || r.Summary == "" {
		t.Fatalf("unexpected report: %v", r)
	}
}

func TestRejectsBadInput(t *testing.T) {
	c := client(t)
	for _, req := range []*pb.GetReportRequest{{Type: "CASTLE"}, {Type: "PLOT", Seed: -1}} {
		_, err := c.GetReport(context.Background(), req)
		if status.Code(err) != codes.InvalidArgument {
			t.Fatalf("want InvalidArgument, got %v", err)
		}
	}
}
