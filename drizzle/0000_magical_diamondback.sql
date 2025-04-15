CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"content" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"iri" text NOT NULL,
	CONSTRAINT "posts_iri_unique" UNIQUE("iri")
);
