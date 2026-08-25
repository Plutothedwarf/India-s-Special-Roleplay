const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) envVars[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function run() {
  const { data: rooms, error: roomError } = await supabase.from('games').select('id, name, created_at').order('created_at', { ascending: false }).limit(1);
  if (roomError) { console.error('Room err:', roomError); return; }
  const room = rooms[0];
  console.log('Latest room:', room.name, room.id);
  
  const { data: nations, error: nationError } = await supabase.from('nations').select('name').eq('game_id', room.id);
  if (nationError) { console.error('Nation err:', nationError); return; }
  
  console.log('Total Nations:', nations.length);
  console.log('Nations list:');
  nations.forEach(n => console.log(' - ' + n.name));
}
run();
