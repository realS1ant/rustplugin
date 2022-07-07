import http, { FractalResponseList } from '@/api/http';
import { RustWipeVariable } from '@/api/server/types';
import { rawDataToRustWipeVariable } from '@/api/transformers';

export interface RustWipeVariables {
    forceVariables: RustWipeVariable[];
    customVariables: RustWipeVariable[];
}

// export const rawDataToWipeVariablesObject = ({ data }: FractalResponseList): RustWipeVariables => ({
//     forceVariables: (data.map(rawDataToRustWipeVariable).filter(v => v.isForceOption)),
//     customVariables: (data.map(rawDataToRustWipeVariable).filter(v => !v.isForceOption)),
// });

export const rawDataToWipeVariablesObject = ({ data }: FractalResponseList): RustWipeVariables => {
    const variables = data.map(rawDataToRustWipeVariable);

    return {
        forceVariables: variables.filter(v => v.isForceOption),
        customVariables: variables.filter(v => !v.isForceOption),
    };
};

export default (uuid: string): Promise<RustWipeVariables> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}/rust_wipe`)
            .then(({ data }) => resolve(rawDataToWipeVariablesObject(data)))
            .catch(reject);
    });
};
