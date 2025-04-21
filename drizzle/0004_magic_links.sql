-- Create magic_token_type enum type
CREATE TYPE "magic_token_type" AS ENUM ('signup', 'signin');

-- Create magic_links table
CREATE TABLE IF NOT EXISTS "magic_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid REFERENCES "accounts"("id"),
  "request_id" uuid REFERENCES "signup_requests"("id"),
  "token_hash" text NOT NULL,
  "type" "magic_token_type" NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Create partial unique index for active signup tokens
CREATE UNIQUE INDEX "request_token_idx" ON "magic_links" ("request_id", "type") 
WHERE (consumed_at IS NULL AND type = 'signup');
