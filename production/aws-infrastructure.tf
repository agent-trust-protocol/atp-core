# Agent Trust Protocol™ - AWS Production Infrastructure
# Terraform configuration for enterprise-grade ATP deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket = "atp-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "atp-terraform-locks"
  }
}

# Provider Configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Agent Trust Protocol"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "ATP Infrastructure Team"
      CostCenter  = "Engineering"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "atp-production"
}

variable "node_instance_type" {
  description = "EC2 instance type for EKS nodes"
  type        = string
  default     = "m5.xlarge"
}

variable "min_nodes" {
  description = "Minimum number of nodes in EKS cluster"
  type        = number
  default     = 6
}

variable "max_nodes" {
  description = "Maximum number of nodes in EKS cluster"
  type        = number
  default     = 20
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Configuration
resource "aws_vpc" "atp_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.cluster_name}-vpc"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "atp_igw" {
  vpc_id = aws_vpc.atp_vpc.id

  tags = {
    Name = "${var.cluster_name}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.atp_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.cluster_name}-public-${count.index + 1}"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/elb" = "1"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.atp_vpc.id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.cluster_name}-private-${count.index + 1}"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count = 3

  vpc_id            = aws_vpc.atp_vpc.id
  cidr_block        = "10.0.${count.index + 21}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.cluster_name}-database-${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"
  depends_on = [aws_internet_gateway.atp_igw]

  tags = {
    Name = "${var.cluster_name}-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "atp_nat" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.cluster_name}-nat-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.atp_igw]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.atp_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.atp_igw.id
  }

  tags = {
    Name = "${var.cluster_name}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.atp_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.atp_nat[count.index].id
  }

  tags = {
    Name = "${var.cluster_name}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "eks_cluster" {
  name_prefix = "${var.cluster_name}-cluster-"
  vpc_id      = aws_vpc.atp_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-cluster-sg"
  }
}

resource "aws_security_group" "eks_nodes" {
  name_prefix = "${var.cluster_name}-nodes-"
  vpc_id      = aws_vpc.atp_vpc.id

  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port       = 1025
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-nodes-sg"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.cluster_name}-rds-"
  vpc_id      = aws_vpc.atp_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-rds-sg"
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.cluster_name}-redis-"
  vpc_id      = aws_vpc.atp_vpc.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  tags = {
    Name = "${var.cluster_name}-redis-sg"
  }
}

# IAM Roles
resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role" "eks_nodes" {
  name = "${var.cluster_name}-nodes-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes.name
}

# EKS Cluster
resource "aws_eks_cluster" "atp_cluster" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_cloudwatch_log_group.eks_cluster,
  ]

  tags = {
    Name = var.cluster_name
  }
}

# EKS Node Group
resource "aws_eks_node_group" "atp_nodes" {
  cluster_name    = aws_eks_cluster.atp_cluster.name
  node_group_name = "${var.cluster_name}-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = [var.node_instance_type]

  scaling_config {
    desired_size = var.min_nodes
    max_size     = var.max_nodes
    min_size     = var.min_nodes
  }

  update_config {
    max_unavailable = 1
  }

  remote_access {
    ec2_ssh_key = aws_key_pair.eks_nodes.key_name
    source_security_group_ids = [aws_security_group.eks_nodes.id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]

  tags = {
    Name = "${var.cluster_name}-nodes"
  }
}

# KMS Key for EKS
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "${var.cluster_name}-eks-key"
  }
}

resource "aws_kms_alias" "eks" {
  name          = "alias/${var.cluster_name}-eks"
  target_key_id = aws_kms_key.eks.key_id
}

# CloudWatch Log Group for EKS
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 30

  tags = {
    Name = "${var.cluster_name}-logs"
  }
}

# Key Pair for EKS Nodes
resource "aws_key_pair" "eks_nodes" {
  key_name   = "${var.cluster_name}-nodes"
  public_key = file("~/.ssh/id_rsa.pub") # You'll need to generate this key pair
}

# RDS Subnet Group
resource "aws_db_subnet_group" "atp_db" {
  name       = "${var.cluster_name}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "${var.cluster_name}-db-subnet-group"
  }
}

# RDS Parameter Group
resource "aws_db_parameter_group" "atp_postgres" {
  family = "postgres15"
  name   = "${var.cluster_name}-postgres-params"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name = "${var.cluster_name}-postgres-params"
  }
}

# RDS Instance
resource "aws_db_instance" "atp_postgres" {
  identifier = "${var.cluster_name}-postgres"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = 500
  max_allocated_storage = 2000
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds.arn

  db_name  = "atp_production"
  username = "atp_admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.atp_db.name
  parameter_group_name   = aws_db_parameter_group.atp_postgres.name

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  multi_az               = true
  publicly_accessible    = false
  auto_minor_version_upgrade = true

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.cluster_name}-postgres-final-snapshot"

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "${var.cluster_name}-postgres"
  }
}

# RDS Read Replicas
resource "aws_db_instance" "atp_postgres_replica" {
  count = 2

  identifier = "${var.cluster_name}-postgres-replica-${count.index + 1}"

  replicate_source_db = aws_db_instance.atp_postgres.identifier
  instance_class      = var.db_instance_class

  auto_minor_version_upgrade = true
  publicly_accessible       = false

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "${var.cluster_name}-postgres-replica-${count.index + 1}"
  }
}

# KMS Key for RDS
resource "aws_kms_key" "rds" {
  description             = "RDS Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "${var.cluster_name}-rds-key"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.cluster_name}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# Random Password for Database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store Database Password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.cluster_name}/database/password"
  
  tags = {
    Name = "${var.cluster_name}-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.atp_postgres.username
    password = random_password.db_password.result
    endpoint = aws_db_instance.atp_postgres.endpoint
    port     = aws_db_instance.atp_postgres.port
    dbname   = aws_db_instance.atp_postgres.db_name
  })
}

# IAM Role for RDS Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.cluster_name}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "atp_redis" {
  name       = "${var.cluster_name}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.cluster_name}-redis-subnet-group"
  }
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "atp_redis" {
  family = "redis7.x"
  name   = "${var.cluster_name}-redis-params"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = {
    Name = "${var.cluster_name}-redis-params"
  }
}

# ElastiCache Replication Group
resource "aws_elasticache_replication_group" "atp_redis" {
  replication_group_id       = "${var.cluster_name}-redis"
  description                = "ATP Redis Cluster"

  node_type            = var.redis_node_type
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.atp_redis.name

  num_cache_clusters = 3
  
  subnet_group_name  = aws_elasticache_subnet_group.atp_redis.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result

  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "sun:05:00-sun:07:00"

  auto_minor_version_upgrade = true

  tags = {
    Name = "${var.cluster_name}-redis"
  }
}

# Random Password for Redis
resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

# Store Redis Auth Token in Secrets Manager
resource "aws_secretsmanager_secret" "redis_auth" {
  name = "${var.cluster_name}/redis/auth"
  
  tags = {
    Name = "${var.cluster_name}-redis-auth"
  }
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    auth_token = random_password.redis_auth.result
    endpoint   = aws_elasticache_replication_group.atp_redis.primary_endpoint_address
    port       = aws_elasticache_replication_group.atp_redis.port
  })
}

# S3 Buckets
resource "aws_s3_bucket" "atp_backups" {
  bucket = "${var.cluster_name}-backups-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.cluster_name}-backups"
  }
}

resource "aws_s3_bucket" "atp_logs" {
  bucket = "${var.cluster_name}-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.cluster_name}-logs"
  }
}

resource "aws_s3_bucket" "atp_assets" {
  bucket = "${var.cluster_name}-assets-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.cluster_name}-assets"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Configurations
resource "aws_s3_bucket_versioning" "atp_backups" {
  bucket = aws_s3_bucket.atp_backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "atp_backups" {
  bucket = aws_s3_bucket.atp_backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "atp_backups" {
  bucket = aws_s3_bucket.atp_backups.id

  rule {
    id     = "backup_lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

# ECR Repositories
resource "aws_ecr_repository" "atp_services" {
  for_each = toset([
    "identity-service",
    "vc-service", 
    "permission-service",
    "audit-logger",
    "rpc-gateway",
    "demo-platform"
  ])

  name                 = "atp/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "atp-${each.key}"
  }
}

# ECR Lifecycle Policies
resource "aws_ecr_lifecycle_policy" "atp_services" {
  for_each = aws_ecr_repository.atp_services

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 production images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["prod"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep last 5 staging images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["staging"]
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 3
        description  = "Delete untagged images older than 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Application Load Balancer
resource "aws_lb" "atp_alb" {
  name               = "${var.cluster_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true

  tags = {
    Name = "${var.cluster_name}-alb"
  }
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.cluster_name}-alb-"
  vpc_id      = aws_vpc.atp_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-alb-sg"
  }
}

# Outputs
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.atp_cluster.endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_eks_cluster.atp_cluster.vpc_config[0].cluster_security_group_id
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN associated with EKS cluster"
  value       = aws_eks_cluster.atp_cluster.role_arn
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.atp_cluster.certificate_authority[0].data
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.atp_cluster.name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.atp_postgres.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_replication_group.atp_redis.primary_endpoint_address
  sensitive   = true
}

output "load_balancer_dns" {
  description = "Load balancer DNS name"
  value       = aws_lb.atp_alb.dns_name
}

output "ecr_repositories" {
  description = "ECR repository URLs"
  value = {
    for k, v in aws_ecr_repository.atp_services : k => v.repository_url
  }
}