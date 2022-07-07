export type ServerStatus = 'installing' | 'install_failed' | 'suspended' | 'restoring_backup' | null;

export interface ServerBackup {
    uuid: string;
    isSuccessful: boolean;
    isLocked: boolean;
    name: string;
    ignoredFiles: string;
    checksum: string;
    bytes: number;
    createdAt: Date;
    completedAt: Date | null;
}

export interface ServerEggVariable {
    name: string;
    description: string;
    envVariable: string;
    defaultValue: string;
    serverValue: string;
    isEditable: boolean;
    rules: string[];
}

export interface RustWipeVariable {
    // id: int;
    name: string; // option
    value: string;
    isEggVariable: boolean; // is_egg_variable
    isForceOption: boolean; // is_force_option
}
