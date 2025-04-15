CREATE TABLE "actors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"preferred_username" text NOT NULL,
	"name" text,
	"summary" text,
	"inbox" text NOT NULL,
	"outbox" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "actors_preferred_username_unique" UNIQUE("preferred_username")
);
