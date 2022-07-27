import http from '@/api/http';
import { AxiosResponse } from 'axios';

export default (uuid: string, schedule: string, timeOffset: number | undefined): Promise<{ success: boolean, message: string }> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/rust_wipe/addTask/${schedule}`, timeOffset ? { offset: timeOffset } : {}).then(({ data }) => resolve(data)).catch(reject);
    });
};
