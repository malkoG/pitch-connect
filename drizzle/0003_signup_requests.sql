-- Create signup_request_state enum type
CREATE TYPE "signup_request_state" AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create signup_requests table
CREATE TABLE IF NOT EXISTS "signup_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" text NOT NULL,
  "intro" text,
  "email" text NOT NULL,
  "state" "signup_request_state" NOT NULL DEFAULT 'pending',
  "invitation_account_id" uuid REFERENCES "accounts"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
