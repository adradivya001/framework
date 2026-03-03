const { createClient } = require('@supabase/supabase-js');
console.log('Testing Supabase Client...');
try {
    const supabase = createClient('https://vhedpucowbjabgiklyea.supabase.co', 'dummy-key');
    console.log('Supabase client created.');
    supabase.from('test').select('*').then(() => {
        console.log('Supabase query finished.');
        process.exit(0);
    }).catch(err => {
        console.log('Supabase error (expected if dummy key):', err.message);
        process.exit(0);
    });
} catch (e) {
    console.error('Supabase creation failed:', e);
    process.exit(1);
}

setTimeout(() => {
    console.log('Timed out');
    process.exit(0);
}, 5000);
