import http from '@/api/http';
import { RustWipeVariable } from '@/api/server/types';

export interface RustWipeVariables {
    forceVariables: RustWipeVariable[];
    customVariables: RustWipeVariable[];
}

// export const rawDataToWipeVariablesObject = ({ data }: FractalResponseList): RustWipeVariables => ({
//     forceVariables: (data.map(rawDataToRustWipeVariable).filter(v => v.isForceOption)),
//     customVariables: (data.map(rawDataToRustWipeVariable).filter(v => !v.isForceOption)),
// });

// export const rawDataToWipeVariablesObject = ({ data }: FractalResponseList): RustWipeVariables => {
//     const variables = data.map(rawDataToRustWipeVariable);

//     return {
//         forceVariables: variables.filter(v => v.isForceOption),
//         customVariables: variables.filter(v => !v.isForceOption),
//     };
// };

// export default (uuid: string): Promise<RustWipeVariables> => {
//     return new Promise((resolve, reject) => {
//         http.get(`/api/client/servers/${uuid}/rust_wipe`)
//             .then(({ data }) => resolve(rawDataToWipeVariablesObject(data)))
//             .catch(reject);
//     });
// };

export default async (uuid: string, force: boolean, variables: RustWipeVariable[]): Promise<any> => {
    return await http.post(`/api/client/servers/${uuid}/rust_wipe`, { variables }).then(res => {
        return res.data;
    });
};
