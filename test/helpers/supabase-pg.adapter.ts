import { Pool, PoolClient } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * SupabasePgAdapter
 *
 * A thin adapter that mimics the @supabase/supabase-js query builder interface
 * using a raw `pg` Pool connected to a TestContainers PostgreSQL instance.
 *
 * This adapter is ONLY used in integration test environments. It allows all
 * repository code (which uses `SUPABASE_CLIENT`) to remain unchanged.
 *
 * Supported operations:
 *   .from(table).select('*').eq(col, val).single()
 *   .from(table).select('*').eq(col, val).order(col, {ascending})
 *   .from(table).insert([rows]).select().single()
 *   .from(table).update(data).eq(col1, val1).eq(col2, val2).select()
 *   .from(table).select('*').eq(col, val).order(col, opts)
 */
export class SupabasePgAdapter {
    constructor(private readonly pool: Pool) { }

    from(table: string): QueryBuilder {
        return new QueryBuilder(this.pool, table);
    }

    /**
     * Helper: run raw SQL for test assertions (not part of Supabase interface)
     */
    async rawQuery(sql: string, params?: any[]): Promise<any[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    /**
     * Apply the DB schema to the connected TestContainers database.
     */
    async applySchema(): Promise<void> {
        const schemaPath = join(__dirname, '..', '..', 'db', 'init-db.sql');
        const sql = readFileSync(schemaPath, 'utf8');
        const client = await this.pool.connect();
        try {
            await client.query(sql);
        } finally {
            client.release();
        }
    }
}

type FilterClause = { column: string; value: any };

class QueryBuilder {
    private _operation: 'select' | 'insert' | 'update' = 'select';
    private _selectCols: string = '*';
    private _insertRows: any[] = [];
    private _updateData: Record<string, any> = {};
    private _filters: FilterClause[] = [];
    private _orderCol?: string;
    private _orderAsc: boolean = true;
    private _single: boolean = false;
    private _returning: boolean = false;

    constructor(private readonly pool: Pool, private readonly table: string) { }

    // ---- Builder methods ----

    select(cols: string = '*'): this {
        this._operation = 'select';
        this._selectCols = cols;
        return this;
    }

    insert(rows: any[]): this {
        this._operation = 'insert';
        this._insertRows = rows;
        return this;
    }

    update(data: Record<string, any>): this {
        this._operation = 'update';
        this._updateData = data;
        return this;
    }

    eq(column: string, value: any): this {
        this._filters.push({ column, value });
        return this;
    }

    order(column: string, opts?: { ascending?: boolean }): this {
        this._orderCol = column;
        this._orderAsc = opts?.ascending !== false;
        return this;
    }

    single(): Promise<{ data: any; error: any }> {
        this._single = true;
        return this._execute();
    }

    // Terminal for insert().select() — returns this for chaining to .single()
    // OR resolves immediately for update().eq().select()
    then(resolve: (v: any) => any, reject?: (e: any) => any): Promise<any> {
        return this._execute().then(resolve, reject);
    }

    // ---- Execution ----

    private async _execute(): Promise<{ data: any; error: any }> {
        const client = await this.pool.connect();
        try {
            let result: any;

            if (this._operation === 'select') {
                result = await this._doSelect(client);
            } else if (this._operation === 'insert') {
                result = await this._doInsert(client);
            } else if (this._operation === 'update') {
                result = await this._doUpdate(client);
            }

            if (this._single) {
                return { data: result?.[0] ?? null, error: null };
            }
            return { data: result, error: null };
        } catch (err: any) {
            return { data: null, error: err };
        } finally {
            client.release();
        }
    }

    private async _doSelect(client: PoolClient): Promise<any[]> {
        const { whereClause, values } = this._buildWhere([]);
        let sql = `SELECT ${this._selectCols} FROM "${this.table}" ${whereClause}`;
        if (this._orderCol) {
            sql += ` ORDER BY "${this._orderCol}" ${this._orderAsc ? 'ASC' : 'DESC'}`;
        }
        const res = await client.query(sql, values);
        return res.rows;
    }

    private async _doInsert(client: PoolClient): Promise<any[]> {
        const rows = this._insertRows;
        if (!rows.length) return [];

        const keys = Object.keys(rows[0]);
        const placeholders = rows.map(
            (_, rowIdx) => `(${keys.map((_, colIdx) => `$${rowIdx * keys.length + colIdx + 1}`).join(', ')})`
        ).join(', ');
        const values = rows.flatMap(row => keys.map(k => {
            const v = row[k];
            if (v instanceof Date) return v.toISOString();
            if (typeof v === 'object' && v !== null) return JSON.stringify(v);
            return v;
        }));

        const cols = keys.map(k => `"${k}"`).join(', ');
        const sql = `INSERT INTO "${this.table}" (${cols}) VALUES ${placeholders} RETURNING *`;
        const res = await client.query(sql, values);
        return res.rows;
    }

    private async _doUpdate(client: PoolClient): Promise<any[]> {
        const keys = Object.keys(this._updateData);
        const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const values: any[] = keys.map(k => {
            const v = this._updateData[k];
            if (v instanceof Date) return v.toISOString();
            if (typeof v === 'object' && v !== null) return JSON.stringify(v);
            return v;
        });

        const { whereClause, values: whereValues } = this._buildWhere(values);
        const sql = `UPDATE "${this.table}" SET ${setClauses} ${whereClause} RETURNING *`;
        const res = await client.query(sql, whereValues);
        return res.rows;
    }

    private _buildWhere(existingValues: any[]): { whereClause: string; values: any[] } {
        if (!this._filters.length) {
            return { whereClause: '', values: existingValues };
        }
        const offset = existingValues.length;
        const clauses = this._filters.map((f, i) => `"${f.column}" = $${offset + i + 1}`).join(' AND ');
        const values = [...existingValues, ...this._filters.map(f => f.value)];
        return { whereClause: `WHERE ${clauses}`, values };
    }
}
