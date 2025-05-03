CREATE TABLE "following" (
	"iri" text PRIMARY KEY NOT NULL,
	"follower_id" uuid NOT NULL,
	"followee_id" uuid NOT NULL,
	"accepted" timestamp with time zone,
	"created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "following_follower_id_followee_id_unique" UNIQUE("follower_id","followee_id")
);
--> statement-breakpoint
ALTER TABLE "following" ADD CONSTRAINT "following_follower_id_actors_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."actors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "following" ADD CONSTRAINT "following_followee_id_actors_id_fk" FOREIGN KEY ("followee_id") REFERENCES "public"."actors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "following_follower_id_index" ON "following" USING btree ("follower_id");--> statement-breakpoint
ALTER TABLE "actors" DROP COLUMN "inbox";--> statement-breakpoint
ALTER TABLE "actors" DROP COLUMN "outbox";