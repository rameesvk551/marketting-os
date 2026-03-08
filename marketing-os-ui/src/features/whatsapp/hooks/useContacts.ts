import { useState, useEffect } from 'react';
import { contactService } from '../services/contactService';
import { message } from 'antd';

export function useContacts() {
    const [searchText, setSearchText] = useState('');
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const data = await contactService.getContacts();
            setContacts(data || []);
        } catch (error) {
            console.error('Failed to fetch contacts', error);
            message.error('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleImportCsv = async (file: File) => {
        try {
            setImporting(true);
            const res = await contactService.importContactsCsv(file);
            if (res.success) {
                message.success(`Successfully imported ${res.data?.successCount || 0} contacts.`);
                if (res.data?.errorCount > 0) {
                    message.warning(`Failed to import ${res.data?.errorCount} rows.`);
                }
                fetchContacts();
            } else {
                message.error(res.message || 'Import failed');
            }
        } catch (error) {
            console.error('Error importing CSV', error);
            message.error('Failed to import contacts from CSV');
        } finally {
            setImporting(false);
        }
    }

    const filteredContacts = contacts.filter((c) => {
        if (!searchText) return true;
        const q = searchText.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
    });

    return {
        searchText,
        setSearchText,
        selectedContact,
        setSelectedContact,
        contacts: filteredContacts,
        loading,
        importing,
        handleImportCsv,
        refetch: fetchContacts
    };
}
