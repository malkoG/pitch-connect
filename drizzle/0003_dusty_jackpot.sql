CREATE TYPE "public"."actor_type" AS ENUM('Application', 'Group', 'Organization', 'Person', 'Service');--> statement-breakpoint
CREATE TABLE "instance" (
	"host" text PRIMARY KEY NOT NULL,
	"software" text,
	"software_version" text,
	"updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "instance_host_check" CHECK ("instance"."host" NOT LIKE '%@%')
);
--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "iri" text NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "type" "actor_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "instance_host" text NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "handle_host" text NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "handle" text GENERATED ALWAYS AS ('@' || "actors"."username" || '@' || "actors"."handle_host") STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "account_id" uuid;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "bio_html" text;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "header_url" text;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "inbox_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "shared_inbox_url" text;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "followers_url" text;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "featured_url" text;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "field_htmls" json DEFAULT '{}'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "sensitive" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "successor_id" uuid;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "aliases" text[] DEFAULT (ARRAY[]::text[]) NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "followees_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "followers_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "posts_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "url" text;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "actors" ADD COLUMN "publishedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_instance_host_instance_host_fk" FOREIGN KEY ("instance_host") REFERENCES "public"."instance"("host") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_successor_id_actors_id_fk" FOREIGN KEY ("successor_id") REFERENCES "public"."actors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_iri_unique" UNIQUE("iri");--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_account_id_unique" UNIQUE("account_id");--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actors_username_instance_host_unique" UNIQUE("username","instance_host");--> statement-breakpoint
ALTER TABLE "actors" ADD CONSTRAINT "actor_username_check" CHECK ("actors"."username" NOT LIKE '%@%');