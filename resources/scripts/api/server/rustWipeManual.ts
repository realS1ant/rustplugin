import http from '@/api/http';

export default (uuid: string): Promise<{ success: boolean, message: string }> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/rust_wipe/wipe`, { manual: true, }).then(({ data }) => resolve(data)).catch(reject);
    });
};
