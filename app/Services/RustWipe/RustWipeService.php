<?php

namespace Pterodactyl\Services\RustWipe;

use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\RustWipeVariable;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Eloquent\ServerVariableRepository;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;

class RustWipeService
{

    public function wipe(Server $server, bool $manual, bool $force = false)
    {
        /** @var \Pterodactyl\Repositories\Wings\DaemonServerRepository */
        $serverRepository = App::make(DaemonServerRepository::class)->setServer($server);
        /** @var \Pterodactyl\Repositories\Wings\DaemonFileRepository */
        $fileRepository = App::make(DaemonFileRepository::class)->setServer($server);
        /** @var \Pterodactyl\Repositories\Eloquent\ServerVariableRepository */
        $variableRepository = App::make(ServerVariableRepository::class);

        if ($manual) {
            $serverDetails = $serverRepository->setServer($server)->getDetails();

            if ($serverDetails['state'] != 'offline') {
                switch ($serverDetails['state']) {
                    case 'stopping':
                        return ['success' => false, 'message' => 'Wait for server to stop before wiping!'];
                    default:
                        return ['success' => false, 'message' => 'You must stop the server before wiping!'];
                }
            }
        }

        if (!$manual) Log::debug('Scheduled Wipe Run.');
        else Log::debug('Force wipe run.');

        //get variables
        $wipeVariables = $server->hasMany(RustWipeVariable::class, 'server_id', 'id')->get()->where('is_force_option', $force)->toArray();
        $vars = array(); //easier just to do it this way...
        foreach ($wipeVariables as $var) {
            $vars[$var['option']] = $var;
        }
        Log::debug($vars);
        if (!$force) {
            $files = explode(',', $vars['files']['value']);
            if ($vars['wipe_blueprints']['value'] === true) $files[] = '/server/rust'; //TODO: wipe blueprints directory

            //delete the correct files
            $fileRepository->deleteFiles('/', $files);
        }


        //update environment variables
        foreach ($vars as $var) {
            //filter out non_egg variables (usually only wipe_blueprints & files)
            if ($var['is_egg_variable'] != true) continue;

            $env = $var['option'];

            /** @var \Pterodactyl\Models\EggVariable */
            $serverVar = $server->variables()->getQuery()->where('env_variable', $env)->first();
            $variableRepository->updateOrCreate(
                ['server_id' => $server->id, 'variable_id' => $serverVar->id],
                ['variable_value' => $var['value'] ?? '']
            );

            $serverVar = $serverVar->refresh();
        }

        return ['success' => true, 'message' => 'Successfully wiped, you may now start up the server.'];
    }
}
