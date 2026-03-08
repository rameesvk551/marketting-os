import client from '../../../api/client';

export const contactService = {
    getContacts: async () => {
        const { data } = await client.get('/contacts');
        return data.data;
    },

    importContactsCsv: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await client.post('/contacts/import/csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return data;
    }
};
