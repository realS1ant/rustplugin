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
// import Switch from '@/components/elements/Switch';
import Field from '@/components/elements/Field';
import useFlash from '@/plugins/useFlash';
import loadDirectory from '@/api/server/files/loadDirectory';
import addWipeTask from '@/api/server/addWipeTask';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import rustWipeManual from '@/api/server/rustWipeManual';
import Switch from '@/components/elements/FormikSwitch';

interface Values {
    HOSTNAME: string;
    DESCRIPTION: string;
    WORLD_SEED: string;
    WORLD_SIZE: number;
    MAP_URL: string;
    OXIDE: boolean; //boolean
    wipe_blueprints: boolean; //boolean
    files: string;
}
interface ForceValues {
    HOSTNAME: string;
    DESCRIPTION: string;
    WORLD_SEED: string;
    WORLD_SIZE: number;
    MAP_URL: string;
    OXIDE: boolean;
}

export default () => {
    const { addError, clearFlashes } = useFlash();

    const id = ServerContext.useStoreState(state => state.server.data!.id);
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const setSchedules = ServerContext.useStoreActions(actions => actions.schedules.setSchedules);
    let schedules = ServerContext.useStoreState(state => state.schedules.data);

    const vars = ServerContext.useStoreState(state => state.server.data!.variables);
    const getServerVar = (name: string) => vars.find(v => v.envVariable === name.toUpperCase())?.serverValue;
    // console.log(vars);

    const [loading, setLoading] = useState(true);
    const [wipeVariables, setWipeVariables] = useState<RustWipeVariables>();
    const [scheduledWipes, setScheduledWipes] = useState<Schedule[]>();
    const getCustomWipeVar = (name: string) => wipeVariables?.customVariables.find((v: RustWipeVariable) => v.name.toLowerCase() === name.toLowerCase())?.value;
    const getForceWipeVar = (name: string) => wipeVariables?.forceVariables.find((v: RustWipeVariable) => v.name.toLowerCase() === name.toLowerCase())?.value;
    // [HOSTNAME, DESCRIPTION, WORLD_SIZE, WORLD_SEED, MAP_URL, OXIDE [wipe_blueprints, files]]

    useEffect(() => {
        Promise.all([
            getServerSchedules(uuid).then(schedules => {
                setSchedules(schedules);

            }),
            getWipeVariables(uuid).then(variables => setWipeVariables(variables)),
        ]).catch(console.error);
        return () => {
            clearFlashes('wipe-options:custom');
            clearFlashes('wipe-options:force');
        };
    }, []);

    useEffect(() => {
        setScheduledWipes([...schedules].filter(sched => {
            return sched.tasks.find(task => task.action === 'rust_wipe') !== undefined && sched.isActive;
        }));
    }, [schedules]);

    const wipeNow = async () => {
        clearFlashes('rustwipe');
        addError({
            message: 'Wiping rust server.',
            key: 'rustwipe',
            type: 'info',
            title: 'WIPING',
        });
        try {
            const { success, message } = await rustWipeManual(uuid);
            //clear the first one from up there...
            clearFlashes('rustwipe');
            addError({
                message,
                key: 'rustwipe',
                type: success ? 'success' : 'warning',
                title: 'WIPE',
            });
        } catch (error) {
            clearFlashes('rustwipe');
            addError({
                message: 'Error performing manual wipe (' + error + ')',
                key: 'rustwipe',
                type: 'error',
                title: 'WIPE',
            });
        }
    };

    const scheduleHandler = async (values: FormikValues) => {
        const { success, message } = await addWipeTask(uuid, values.schedule, 35);
        clearFlashes('rustwipe');
        addError({
            message,
            key: 'rustwipe',
            type: success ? 'success' : 'error',
            title: 'Scheduled',
        });
    };

    /**
     *
     * @param values FormikValues
     *
     * @return [all exist, correctly formatted list]
     */
    const verifyFiles = async (values: Values): Promise<[boolean, string[]]> => {
        let files: string[] = [];
        if (values.files.includes('\n')) files = values.files.trim().split('\n').map(val => val.trim());
        else files.push(values.files.trim());

        files = files.map(x => x.split('\\').join('/')); //replace all back slashes with forward slashes

        const success = await files.every(async filePath => {
            let parent: string;
            let fileName: string;
            if (filePath.includes('/')) {
                let arr = filePath.split('/');
                parent = arr.slice(0, -1).join('/') || '/';
                fileName = arr.slice(-1).join('');
            } else {
                parent = '/';
                fileName = filePath;
            }
            if ((await loadDirectory(uuid, parent)).some(file => file.name == fileName)) return true;
            else {
                addError({
                    key: 'wipe-options:custom',
                    message: `${fileName} was not found in directory: ${parent}`,
                });
                return false;
            }
        });

        return [success, files];
    };

    const formValuesToRustWipeVariables = (isForce: boolean, values: Values): RustWipeVariable[] => {
        return [
            { name: 'HOSTNAME', value: values.HOSTNAME, isEggVariable: true, isForceOption: isForce },
            { name: 'DESCRIPTION', value: values.DESCRIPTION, isEggVariable: true, isForceOption: isForce },
            { name: 'WORLD_SEED', value: values.WORLD_SEED, isEggVariable: true, isForceOption: isForce },
            { name: 'WORLD_SIZE', value: values.WORLD_SIZE + '', isEggVariable: true, isForceOption: isForce },
            { name: 'MAP_URL', value: values.MAP_URL, isEggVariable: true, isForceOption: isForce },
            { name: 'OXIDE', value: values.OXIDE ? '1' : '0', isEggVariable: true, isForceOption: isForce },
            { name: 'wipe_blueprints', value: values.wipe_blueprints ? '1' : '0', isEggVariable: false, isForceOption: isForce },
            { name: 'files', value: values.files, isEggVariable: false, isForceOption: isForce },
        ];
    };
    const forceFormValuesToRustWipeVariables = (isForce: boolean, values: Values): RustWipeVariable[] => {
        return [
            { name: 'HOSTNAME', value: values.HOSTNAME, isEggVariable: true, isForceOption: isForce },
            { name: 'DESCRIPTION', value: values.DESCRIPTION, isEggVariable: true, isForceOption: isForce },
            { name: 'WORLD_SEED', value: values.WORLD_SEED, isEggVariable: true, isForceOption: isForce },
            { name: 'WORLD_SIZE', value: values.WORLD_SIZE + '', isEggVariable: true, isForceOption: isForce },
            { name: 'MAP_URL', value: values.MAP_URL, isEggVariable: true, isForceOption: isForce },
            { name: 'OXIDE', value: values.OXIDE ? '1' : '0', isEggVariable: true, isForceOption: isForce },
        ];
    };

    const submitCustomOptions = async (formValues: Values) => {
        clearFlashes('wipe-options:custom');
        clearFlashes('rustwipe');
        // check all files.
        let values = { ...formValues };
        const [passed, files] = await verifyFiles(values);
        if (!passed) return; // ^ already handles errors
        values.files = files.join(',');

        await setRustDBVars(uuid, false, formValuesToRustWipeVariables(false, values));

        addError({
            message: 'Updated custom rust wipe options.',
            key: 'rustwipe',
            type: 'success',
            title: 'UPDATE',
        });

    };

    const submitForceOptions = async (formValues: ForceValues) => {

        await setRustDBVars(uuid, true, forceFormValuesToRustWipeVariables(true, formValues));

        clearFlashes('rustwipe');
        addError({
            message: 'Updated force rust wipe options.',
            key: 'rustwipe',
            type: 'success',
            title: 'UPDATE',
        });
    };

    const initialCustomVariableValues = {
        HOSTNAME: getCustomWipeVar('HOSTNAME') || getServerVar('HOSTNAME') || '',
        DESCRIPTION: getCustomWipeVar('DESCRIPTION') || getServerVar('DESCRIPTION') || '',
        WORLD_SIZE: +(getCustomWipeVar('WORLD_SIZE') || getServerVar('WORLD_SIZE') || ''),
        WORLD_SEED: getCustomWipeVar('WORLD_SEED') || getServerVar('WORLD_SEED') || '', // able to leave blank for random seed.
        MAP_URL: getCustomWipeVar('MAP_URL') || getServerVar('MAP_URL') || '',
        OXIDE: (getCustomWipeVar('OXIDE') || getServerVar('OXIDE')) === '1' || true,
        wipe_blueprints: getCustomWipeVar('wipe_blueprints') === '1' || false,
        files: (getCustomWipeVar('files') || '/server/rust/user').split(',').join('\n'),
    };
    const initialForceVariableValues = {
        HOSTNAME: getForceWipeVar('HOSTNAME') || getServerVar('HOSTNAME') || '',
        DESCRIPTION: getForceWipeVar('DESCRIPTION') || getServerVar('DESCRIPTION') || '',
        WORLD_SIZE: +(getForceWipeVar('WORLD_SIZE') || getServerVar('WORLD_SIZE') || ''),
        WORLD_SEED: getForceWipeVar('WORLD_SEED') || getServerVar('WORLD_SEED') || '', // able to leave blank for random seed.
        MAP_URL: getForceWipeVar('MAP_URL') || getServerVar('MAP_URL') || '',
        OXIDE: (getForceWipeVar('OXIDE') || getServerVar('OXIDE')) === '1' || true,
    };

    return (
        <ServerContentBlock title={'Rust Wipe'} css={tw`w-full`}>
            <FlashMessageRender byKey={'rustwipe'} css={tw`mb-4`} />

            <TitledGreyBox title={'Initiate Wipe'} css={tw`my-6`}>
                <div css={tw`flex flex-row justify-around items-center w-full`}>
                    <div css={tw`text-left`}>
                        <Button color='red' onClick={wipeNow}>Wipe Now</Button>
                    </div>
                    {scheduledWipes &&
                        (<>
                            <div css={tw`text-center`}>
                                <h3 css={tw`text-lg text-center`}>Scheduled Wipes:</h3>
                                <ul css={'list-style: circle; margin: 15px auto; margin-top: 5px; padding-left: 40; width: fit-content;'}>
                                    {scheduledWipes.map(schedule => {
                                        let nr = schedule.nextRunAt;
                                        let date = nr?.toLocaleDateString('en-us', { 'weekday': 'long', }) + ', ' + nr?.toLocaleString();

                                        return (<li key={schedule.id} css='width: fit-content;'><strong>{schedule.name}</strong> - <strong>Next Run:</strong> {date}</li>);
                                    })}
                                </ul>
                            </div>
                        </>)
                    }
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
                    initialValues={initialCustomVariableValues}
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
                            <Switch name={'wipe_blueprints'} label={'Wipe Blueprints'} description={'If enabled, blue prints will be wiped.'} />
                            <Switch name={'OXIDE'} label={'Oxide Mod'} description={'Whether you want the server to use and auto update OxideMod'} />
                        </div>

                        <div css={tw`mt-6`}>
                            <Label>Files</Label>
                            <FormikField as={Textarea} name={'files'} rows={8} required />
                            <p css={tw`ml-1`} className={'input-help'}>Files or directories that need to be deleted when wiping based off of the server root directory separated by new lines. <strong>(Ex: /server/rust/user or /server/rust/userdata)</strong></p>
                        </div>

                        <div css={tw`mt-6 text-right`}>
                            <Button css={tw`mr-8`} color='primary' type={'submit'}>Save Changes</Button>
                        </div>
                    </Form>
                </Formik>
            </TitledGreyBox>

            <TitledGreyBox title={'Forced Wipe Options'} css={tw`my-6`}>
                <Formik
                    initialValues={initialForceVariableValues}
                    onSubmit={submitForceOptions}
                    enableReinitialize
                >
                    <Form>
                        <FlashMessageRender byKey={'wipe-options:force'} css={tw`mb-5`} />
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

                        <div css={tw`mt-6`}>
                            <Switch name={'OXIDE'} label={'Oxide Mod'} description={'Whether you want the server to use and auto update OxideMod'} />
                        </div>

                        <div css={tw`mt-6 text-right`}>
                            <Button css={tw`mr-8`} color='primary' type={'submit'}>Save Changes</Button>
                        </div>
                    </Form>
                </Formik>
            </TitledGreyBox>

        </ServerContentBlock>
    );
};
