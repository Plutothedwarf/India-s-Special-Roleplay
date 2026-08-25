const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) envVars[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function run() {
  const { data: rooms } = await supabase.from('games').select('id, name, created_at, map_source_name').order('created_at', { ascending: false }).limit(5);
  console.log('Recent rooms:');
  for (const room of rooms) {
    const { count } = await supabase.from('nations').select('id', { count: 'exact', head: true }).eq('game_id', room.id);
    console.log('-', room.name, 'Nations:', count, 'Map:', room.map_source_name);
  }
}
run();
