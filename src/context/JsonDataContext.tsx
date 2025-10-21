import { createContext, useContext, useEffect, useState } from 'react';
import { parsingJsonData } from '../utils/functions';

const JsonDataContext = createContext<any>(null);

async function fetchToken(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
        const formData = new FormData();
        formData.append("email", "api@qualificagroup.org");
        formData.append("password", "Api123@");

        const response = await fetch("/api/login", {
            method: "POST",
            body: formData
        });
        if (!response.ok) {
            return { success: false, error: `HTTP error! status: ${response.status}` };
        }
        const data = await response.json();
        if (data.accessToken) {
            return { success: true, token: data.accessToken };
        } else {
            return { success: false, error: data.error || "Unknown error" };
        }

    } catch (error) {
        console.error("Error fetching token:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error fetching token" };
    }
}


const fetchPageData = async (token: string, page?: number, data?: any) => {
    const response = await fetch(`/api/classi?page=${page || 1}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    const d = await response.json();

    const newData = { classi: [...(data?.classi || []), ...d.classi] };

    if (d.current_page < d.last_page) {
        return await fetchPageData(token, (page || 1) + 1 , newData);
    } 
    
    return newData;
}


async function fetchAllData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const token = await fetchToken();

        let data: any = await fetchPageData(token.token!);

        return { success: true, data };
        
    } catch (error) {
        console.error("Error fetching all data:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error fetching all data" };
    }
}


export function JsonDataProvider({ children }: { children: React.ReactNode }) {
    const [jsonData, setJsonData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const asyncFetching = async () => {
            const { success, data, error } = await fetchAllData();
            if (success) {
                // fare parsing e poi assegnare
                const parsedData = parsingJsonData(data.classi);
                setJsonData(parsedData);
            } else {
                setError(error || null);
            }
            setLoading(false);
        };
        asyncFetching();
    }, []);


    return (
        <JsonDataContext.Provider value={{ jsonData, loading, error }}>
            {children}
        </JsonDataContext.Provider>
    );
}

export function useJsonData() {
    return useContext(JsonDataContext);
}