import api from "./api";

export interface Keyword {
    id: string;
    text: string;
    sentiment: 'green' | 'yellow' | 'red' | 'red_plus';
    created_at: string;
}

export const keywordService = {
    getKeywords: () => api.get<Keyword[]>("/janmasethu/keywords").then(res => res.data),
    addKeyword: (payload: { text: string; sentiment: string }) =>
        api.post<Keyword>("/janmasethu/keywords", payload).then(res => res.data),
    deleteKeyword: (id: string) =>
        api.delete(`/janmasethu/keywords/${id}`).then(res => res.data),
};

export default keywordService;
