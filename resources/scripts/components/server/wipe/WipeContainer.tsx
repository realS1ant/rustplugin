import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import Button from '@/components/elements/Button';
import getServerSchedules, { rawDataToServerSchedule, Schedule } from '@/api/server/schedules/getServerSchedules';
import Select from '@/components/elements/Select';
import { Link } from 'react-router-dom';
import { Field as FormikField, Form, Formik, FormikValues } from 'formik';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import getWipeVariables, { RustWipeVariables } from '@/api/server/getWipeVariables';
import setRustDBVars from '@/api/server/setWipeVariables';
import { RustWipeVariable } from '@/api/server/types';
import Input, { Textarea } from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Switch from '@/components/elements/Switch';
import Field from '@/components/elements/Field';
import useFlash from '@/plugins/useFlash';
import loadDirectory from '@/api/server/files/loadDirectory';

interface Values {
    HOSTNAME: string;
    DESCRIPTION: string;
    WORLD_SEED: string;
    WORLD_SIZE: number;
    MAP_URL: string;
    OXIDE: number; //boolean
    wipe_blueprints: number; //boolean
    files: string;
}

export default () => {
    const { addError, clearFlashes } = useFlash();

    const id = ServerContext.useStoreState(state => state.server.data!.id);
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const setSchedules = ServerContext.useStoreActions(actions => actions.schedules.setSchedules);
    const schedules = ServerContext.useStoreState(state => state.schedules.data);

    const vars = ServerContext.useStoreState(state => state.server.data!.variables);
    const getServerVar = (name: string) => vars.find(v => v.envVariable === name.toUpperCase())?.serverValue;
    // console.log(vars);

    const [loading, setLoading] = useState(true);
    const [wipeVariables, setWipeVariables] = useState<RustWipeVariables>();
    const getCustomWipeVar = (name: string) => wipeVariables?.customVariables.find((v: RustWipeVariable) => v.name.toLowerCase() === name.toLowerCase())?.value;
    const getForceWipeVar = (name: string) => wipeVariables?.forceVariables.find((v: RustWipeVariable) => v.name.toLowerCase() === name.toLowerCase())?.value;
    // [HOSTNAME, DESCRIPTION, WORLD_SIZE, WORLD_SEED, MAP_URL, OXIDE [wipe_blueprints, files]]

    useEffect(() => {
        Promise.all([
            getServerSchedules(uuid).then(schedules => setSchedules(schedules)),
            getWipeVariables(uuid).then(variables => setWipeVariables(variables)),
        ]).catch(console.error);
        return () => {
            clearFlashes('wipe-options:custom');
            clearFlashes('wipe-options:force');
        }
    }, []);

    const scheduleHandler = (values: FormikValues) => {
        console.log(`Schedule ID: ${values.schedule}`);
    };

    /**
     * 
     * @param values FormikValues
     * 
     * @return whether or not all files/directories exist. 
     */
    const verifyFiles = (values: Values): boolean => {
        var files: String[] = [];
        if (values.files.includes('\n')) files = values.files.trim().split('\n').map(val => val.trim());
        else files.push(values.files.trim());

        console.log(files);
        // console.log(values.files);

        return true;
    }

    const formValuesToRustWipeVariables = (isForce: boolean, values: Values): RustWipeVariable[] => {
        return [
            { name: 'HOSTNAME', value: values.HOSTNAME, isEggVariable: true, isForceOption: isForce },
            { name: 'DESCRIPTION', value: values.DESCRIPTION, isEggVariable: true, isForceOption: isForce },
            { name: 'WORLD_SEED', value: values.WORLD_SEED, isEggVariable: true, isForceOption: isForce },
            { name: 'WORLD_SIZE', value: values.WORLD_SIZE + '', isEggVariable: true, isForceOption: isForce },
            { name: 'MAP_URL', value: values.MAP_URL, isEggVariable: true, isForceOption: isForce },
            { name: 'OXIDE', value: values.OXIDE + '', isEggVariable: true, isForceOption: isForce },
            { name: 'wipe_blueprints', value: values.wipe_blueprints + '', isEggVariable: false, isForceOption: isForce },
            { name: 'files', value: values.files, isEggVariable: false, isForceOption: isForce },
        ];
    };

    const submitCustomOptions = async (values: Values) => {
        clearFlashes('wipe-options:custom');

        // check all files.
        if (!verifyFiles(values)) return; // already handles errors by flashing.
        values.files = values.files.replace('\n', ',');
        console.log(values);

        console.log(await setRustDBVars(uuid, false, formValuesToRustWipeVariables(false, values)));

        console.log('Submitted Custom Options.');
    };

    // console.log(wipeVariables);

    const initialVariableValues = {
        HOSTNAME: getCustomWipeVar('HOSTNAME') || getServerVar('HOSTNAME') || '',
        DESCRIPTION: getCustomWipeVar('DESCRIPTION') || getServerVar('DESCRIPTION') || '',
        WORLD_SIZE: +(getCustomWipeVar('WORLD_SIZE') || getServerVar('WORLD_SIZE') || ''),
        WORLD_SEED: getCustomWipeVar('WORLD_SEED') || getServerVar('WORLD_SEED') || '', // able to leave blank for random seed.
        MAP_URL: getCustomWipeVar('MAP_URL') || getServerVar('MAP_URL') || '',
        OXIDE: +(getCustomWipeVar('OXIDE') || getServerVar('OXIDE') || 0),
        wipe_blueprints: +(getCustomWipeVar('wipe_blueprints') || 0),
        files: getCustomWipeVar('files')?.replace(',', '\n') || '/RustDedicated_Data',
    };

    // console.log(initialVariableValues);

    return (
        <ServerContentBlock title={'Rust Wipe'}>
            <FlashMessageRender byKey={'rustwipe'} css={tw`mb-4`} />

            <TitledGreyBox title={'Initiate Wipe'} css={tw`my-6`}>
                <div css={tw`flex flex-row justify-around items-center w-full`}>
                    <div css={tw`text-left`}>
                        <Button color='red'>Wipe Now</Button>
                    </div>
                    <div css={tw`text-right flex flex-row justify-between items-center text-center`}>
                        {schedules.length > 0 ?
                            <>
                                <Formik
                                    onSubmit={scheduleHandler}
                                    initialValues={{
                                        schedule: schedules[0].id,
                                    }}
                                >
                                    <Form css={tw`flex flex-row justify-between items-center text-center`}>
                                        <div>
                                            <FormikFieldWrapper name={'schedule'}>
                                                <FormikField as={Select} name={'schedule'}>
                                                    {schedules.map(schedule => (
                                                        <option key={schedule.id} value={schedule.id}>
                                                            {schedule.name}
                                                        </option>
                                                    ))}
                                                </FormikField>
                                            </FormikFieldWrapper>
                                        </div>
                                        <div>
                                            <Button css={tw`ml-7`} color='primary' type={'submit'}>Schedule</Button>
                                        </div>
                                    </Form>
                                </Formik>
                            </>
                            :
                            <>
                                <Link to={`/server/${id}/schedules`}>You must create a schedule first.</Link>
                                <Button css={tw`ml-7`} color='primary' disabled>Schedule</Button>
                            </>
                        }
                    </div>
                </div>
            </TitledGreyBox>

            <TitledGreyBox title={'Custom Wipe Options'} css={tw`my-6`}>
                <Formik
                    initialValues={initialVariableValues}
                    onSubmit={submitCustomOptions}
                    enableReinitialize
                >
                    <Form>
                        <FlashMessageRender byKey={'wipe-options:custom'} css={tw`mb-5`} />
                        <div css={tw`grid grid-cols-4 gap-5`}>
                            <div css={tw`col-span-1`}>
                                <Field
                                    name={'HOSTNAME'}
                                    label={'Server Name'}
                                    required
                                />
                            </div>
                            <div css={tw`col-span-3 mt-auto`}>
                                <Field
                                    name={'DESCRIPTION'}
                                    label={'Server Description'}
                                    required
                                />
                            </div>
                        </div>
                        <div css={tw`mt-5`}>
                        </div>
                        <div css={tw`grid grid-cols-2 gap-10 mt-5`}>
                            <Field name={'WORLD_SIZE'} label={'World Size'} description={'The world size for a procedural map.'} />
                            <Field name={'WORLD_SEED'} label={'World Seed'} description={'The seed for a procedural map, leave blank for a random seed.'} />
                        </div>
                        <div css={tw`mt-6`}>
                            <Field name={'MAP_URL'} label={'Custom Map Url'} />
                        </div>

                        <div css={tw`grid grid-cols-2 gap-10 mt-5`}>
                            <Switch name={'wipe_blueprints'} label={'Wipe Blueprints'} description={'If enabled, blue prints will be wiped.'} defaultChecked={initialVariableValues.wipe_blueprints === 1} />
                            <Switch name={'OXIDE'} label={'Oxide Mod'} description={'Whether you want the server to use and auto update OxideMod'} defaultChecked={initialVariableValues.OXIDE === 1} />
                        </div>

                        <div css={tw`mt-6`}>
                            <Label>Files</Label>
                            <FormikField as={Textarea} name={'files'} rows={8} required />
                            <p css={tw`ml-1`} className={'input-help'}>Files or directories that need to be deleted when wiping based off of the server root directory separated by new lines. <strong>(Ex: /RustDedicated_Data or /Bundles/maps)</strong></p>
                        </div>

                        <div css={tw`mt-6 text-right`}>
                            <Button css={tw`mr-8`} color='primary' type={'submit'}>Save Changes</Button>
                        </div>
                    </Form>
                </Formik>
            </TitledGreyBox>

            <TitledGreyBox title={'Forced Wipe Options'} css={tw`my-6`}>
            </TitledGreyBox>

            <TitledGreyBox title={'Scheduled Wipes'} css={tw`w-full mt-6 md:flex-1 md:mt-0`}>
            </TitledGreyBox>
        </ServerContentBlock>
    );
};
