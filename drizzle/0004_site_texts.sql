CREATE TABLE "site_texts" (
	"key" text NOT NULL,
	"locale" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_texts_key_locale_pk" PRIMARY KEY("key","locale")
);
