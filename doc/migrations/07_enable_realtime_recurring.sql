-- Enable Realtime for recurringTemplates
-- It was missing from the supabase_realtime publication.

BEGIN;
  -- Check if table is already in publication to avoid error
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'recurringTemplates'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "recurringTemplates";
    END IF;
  END
  $$;
COMMIT;
