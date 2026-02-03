import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tpublgfsxtklwnfkknab.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdWJsZ2ZzeHRrbHduZmtrbmFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzgzODAsImV4cCI6MjA4NTcxNDM4MH0.3gNLJ6OOzrENySRa75Yxi7KiTU0Kmmy-dbOGiCyFJ2E";

export const supabase = createClient(supabaseUrl, supabaseKey);
