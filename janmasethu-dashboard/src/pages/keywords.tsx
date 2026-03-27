import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Plus, Trash2, Search, AlertCircle, CheckCircle, Flame } from 'lucide-react';
import keywordService, { Keyword } from '../services/keywordService';

const SENTIMENT_COLORS: Record<string, string> = {
    red_plus: 'bg-red-600 text-white',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
};

const SENTIMENT_ICONS: Record<string, any> = {
    red_plus: Flame,
    red: AlertCircle,
    yellow: AlertCircle,
    green: CheckCircle,
};

export default function KeywordManager() {
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newKeyword, setNewKeyword] = useState('');
    const [newSentiment, setNewSentiment] = useState('yellow');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadKeywords();
    }, []);

    const loadKeywords = async () => {
        try {
            // In a real scenario, this calls the backend. 
            // For now, we'll mock if the endpoint doesn't exist yet.
            const data = await keywordService.getKeywords().catch(() => [
                { id: '1', text: 'bleeding', sentiment: 'red', created_at: new Date().toISOString() },
                { id: '2', text: 'chest pain', sentiment: 'red_plus', created_at: new Date().toISOString() },
                { id: '3', text: 'fever', sentiment: 'yellow', created_at: new Date().toISOString() },
            ]);
            setKeywords(data as Keyword[]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyword.trim()) return;

        try {
            await keywordService.addKeyword({ text: newKeyword.trim().toLowerCase(), sentiment: newSentiment });
            setNewKeyword('');
            loadKeywords();
        } catch (e) {
            // Mocking addition for now
            const mock: Keyword = {
                id: Math.random().toString(),
                text: newKeyword.trim().toLowerCase(),
                sentiment: newSentiment as any,
                created_at: new Date().toISOString(),
            };
            setKeywords([mock, ...keywords]);
            setNewKeyword('');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await keywordService.deleteKeyword(id);
            loadKeywords();
        } catch (e) {
            setKeywords(keywords.filter(k => k.id !== id));
        }
    };

    const filtered = keywords.filter(k => k.text.includes(search.toLowerCase()));

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Risk Keyword Management</h1>
                        <p className="text-slate-500 text-sm">Define triggers for AI escalation and risk grading.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Add Keyword Form */}
                    <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Add Trigger</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Keyword Phrase</label>
                                <input
                                    type="text"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    placeholder="e.g. sharp pain"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sentiment Link</label>
                                <select
                                    value={newSentiment}
                                    onChange={(e) => setNewSentiment(e.target.value)}
                                    className="w-full h-10 rounded-xl border border-slate-200 px-4 text-sm focus:border-blue-400 focus:outline-none bg-white"
                                >
                                    <option value="green">GREEN (Low Risk)</option>
                                    <option value="yellow">YELLOW (Elevated)</option>
                                    <option value="red">RED (High Risk)</option>
                                    <option value="red_plus">RED PLUS (Critical)</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={!newKeyword.trim()}
                                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                            >
                                <Plus size={18} />
                                <span>Add Keyword</span>
                            </button>
                        </form>
                    </div>

                    {/* List View */}
                    <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search keywords..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[60vh]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-3">Keyword</th>
                                        <th className="px-6 py-3">Sentiment</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((keyword) => {
                                        const Icon = SENTIMENT_ICONS[keyword.sentiment] || CheckCircle;
                                        return (
                                            <tr key={keyword.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-slate-700">{keyword.text}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${SENTIMENT_COLORS[keyword.sentiment]}`}>
                                                        <Icon size={10} />
                                                        <span>{keyword.sentiment.replace('_', ' ')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(keyword.id)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic text-sm">
                                                No keywords matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
