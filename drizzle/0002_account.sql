-- Create account_status enum type
CREATE TYPE "account_status" AS ENUM ('invited', 'active', 'suspended', 'deleted');

-- Create accounts table
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" text NOT NULL UNIQUE,
  "intro" text,
  "email" text NOT NULL UNIQUE,
  "status" "account_status" NOT NULL DEFAULT 'invited',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
