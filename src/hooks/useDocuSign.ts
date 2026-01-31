
import { useState, useEffect } from 'react';

const DOCUSIGN_AUTH_URL = 'https://account-d.docusign.com/oauth/auth'; // Dev Environment
const DOCUSIGN_API_URL = 'https://demo.docusign.net/restapi/v2.1/accounts'; // Dev Environment

export function useDocuSign() {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [clientId, setClientId] = useState<string>(() => localStorage.getItem('docusign_client_id') || '');

    useEffect(() => {
        // Check for token in URL hash (callback from login)
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get('access_token');
            if (token) {
                setAccessToken(token);
                window.location.hash = ''; // Clear hash
                fetchUserInfo(token);
            }
        }
    }, []);

    const fetchUserInfo = async (token: string) => {
        try {
            const res = await fetch('https://account-d.docusign.com/oauth/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            const defaultAccount = data.accounts.find((a: any) => a.is_default);
            setAccountId(defaultAccount?.account_id);
            localStorage.setItem('docusign_account_id', defaultAccount?.account_id);
        } catch (err) {
            console.error('Failed to fetch user info', err);
        }
    };

    const login = (redirectUri: string) => {
        if (!clientId) {
            alert('Configure a Integration Key (Client ID) do DocuSign nas configurações.');
            return;
        }
        const url = `${DOCUSIGN_AUTH_URL}?response_type=token&scope=signature&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        window.location.href = url;
    };

    const sendEnvelope = async (pdfBase64: string, signerName: string, signerEmail: string) => {
        if (!accessToken || !accountId) throw new Error('Not authenticated');

        const envelopeDefinition = {
            emailSubject: "Termo de Recebimento de Equipamentos",
            documents: [{
                documentBase64: pdfBase64,
                name: "Termo de Entrega.pdf",
                fileExtension: "pdf",
                documentId: "1"
            }],
            recipients: {
                signers: [{
                    email: signerEmail,
                    name: signerName,
                    recipientId: "1",
                    routingOrder: "1",
                    tabs: {
                        signHereTabs: [{
                            anchorString: "Assinatura do Colaborador:",
                            anchorYOffset: "20",
                            anchorUnits: "pixels",
                            anchorXOffset: "0"
                        }]
                    }
                }]
            },
            status: "sent"
        };

        const res = await fetch(`${DOCUSIGN_API_URL}/${accountId}/envelopes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(envelopeDefinition)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to send envelope');
        }

        return await res.json();
    };

    return {
        accessToken,
        accountId,
        clientId,
        setClientId: (id: string) => { setClientId(id); localStorage.setItem('docusign_client_id', id); },
        login,
        sendEnvelope,
        isAuthenticated: !!accessToken && !!accountId
    };
}
