# AWS skeleton: managed Postgres and Redis for the Helm chart in ../helm/deccan.
# Plug in your own VPC and cluster; this file only owns the data stores.
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.region
}

variable "region" { default = "ap-south-2" } # Hyderabad
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_db_subnet_group" "db" {
  name       = "deccan"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "data" {
  name   = "deccan-data"
  vpc_id = var.vpc_id
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier              = "deccan"
  engine                  = "postgres"
  engine_version          = "17"
  instance_class          = "db.t4g.medium"
  allocated_storage       = 50
  db_name                 = "deccan"
  username                = "deccan"
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.db.name
  vpc_security_group_ids  = [aws_security_group.data.id]
  backup_retention_period = 7
  storage_encrypted       = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "deccan-final"
}

resource "aws_elasticache_subnet_group" "cache" {
  name       = "deccan"
  subnet_ids = var.private_subnet_ids
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "deccan"
  engine               = "redis"
  node_type            = "cache.t4g.small"
  num_cache_nodes      = 1
  subnet_group_name    = aws_elasticache_subnet_group.cache.name
  security_group_ids   = [aws_security_group.data.id]
}

output "database_host" { value = aws_db_instance.postgres.address }
output "redis_host" { value = aws_elasticache_cluster.redis.cache_nodes[0].address }
