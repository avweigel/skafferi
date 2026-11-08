import type { createClient } from "@/lib/supabase/server";

// the schema-pinned client type, so helpers accept what createClient returns
export type Db = Awaited<ReturnType<typeof createClient>>;
