import http from '@/api/http';
import { AxiosResponse } from 'axios';

export default (uuid: string, schedule: string): Promise<AxiosResponse> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/rust_wipe/addTask/${schedule}`).then(({ data }) => resolve(data)).catch(reject);
    });
};
