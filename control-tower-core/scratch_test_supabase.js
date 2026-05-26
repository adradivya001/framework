const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env', 'development.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env/development.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('dfo_patients').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase query failed:', error.message);
            process.exit(1);
        }
        console.log('Supabase connection successful! Patient count queried.');
        process.exit(0);
    } catch (e) {
        console.error('Supabase error:', e.message);
        process.exit(1);
    }
}

test();
