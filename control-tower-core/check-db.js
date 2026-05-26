const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://vhedpucowbjabgiklyea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZWRwdWNvd2JqYWJnaWtseWVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4OTQzNywiZXhwIjoyMDg3NTY1NDM3fQ._RBmUFpQgwSrTOnuB6A9w_W4jaD80Seaqd8ydV1tIk8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const tables = [
        'conversation_threads',
        'conversation_messages',
        'dfo_patients',
        'dfo_risk_logs',
        'dfo_summaries',
        'dfo_clinician_workload',
        'dfo_appointments',
        'dfo_consultations',
        'dfo_notification_logs',
        'dfo_prescriptions',
        'dfo_medical_reports',
        'dfo_doctors',
        'dfo_availability_slots',
        'audit_logs',
        'routing_events'
    ];

    console.log('Checking for required tables and data...');
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ Table '${table}' error: ${error.message}`);
        } else {
            console.log(`✅ Table '${table}' exists. Rows: ${count}`);
        }
    }

    console.log('\n--- Sample Data Verification ---');
    const { data: appData } = await supabase.from('dfo_appointments').select('*').limit(1);
    console.log('Sample Appointment:', JSON.stringify(appData?.[0], null, 2));

    const { data: conData } = await supabase.from('dfo_consultations').select('*').limit(1);
    console.log('Sample Consultation:', JSON.stringify(conData?.[0], null, 2));
}

checkTables();
