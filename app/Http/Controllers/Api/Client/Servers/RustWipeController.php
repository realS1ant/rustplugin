<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Wipe\GetWipeRequest;
use Pterodactyl\Jobs\Schedule\RunTaskJob;
use Pterodactyl\Models\RustWipeVariable;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Task;
use Pterodactyl\Transformers\Api\Client\RustWipeVariableTransformer;

class RustWipeController extends ClientApiController
{
    public function __construct()
    {
        parent::__construct();
    }

    public function index(GetWipeRequest $req, Server $server)
    {
        // $server->id;
        // $variables = RustWipeVariable::query()->where('server_id', '=', 4); //where server_id = $server->id

        // $variables = RustWipeVariable::query()->where('server_id', 4);

        //works
        // $variables = $server->hasMany(RustWipeVariable::class, 'server_id', 'id')->getResults();

        return $this->fractal->collection(
            $server->hasMany(RustWipeVariable::class, 'server_id', 'id')->get()
        )
            ->transformWith($this->getTransformer(RustWipeVariableTransformer::class))->toArray();

        // return ['message' => 'hello', 'variables' => $variables];

    }

    public function post(ClientApiRequest $req, Server $server): JsonResponse
    {
        $vars = $req->input('variables');

        // $relation = $server->hasMany(RustWipeVariable::class, 'server_id', 'id');
        // return new JsonResponse([]);
        // $existingOptions = $relation->get(['option'])->all();

        // $existingOptions = array_map(function ($o) {
        //     return $o['option'];
        // }, $existingOptions);

        // return new JsonResponse($existingOptions);

        // $return = [];


        foreach ($vars as $var) {
            RustWipeVariable::query()
                ->updateOrCreate(
                    ['option' => $var['name'], 'server_id' => $server->id],
                    [
                        'option' => $var['name'],
                        'value' => $var['value'],
                        'is_egg_variable' => $var['isEggVariable'],
                        'is_force_option' => $var['isForceOption'],
                    ]
                );

            // RustWipeVariable::create();

            // return new JsonResponse($var['name']);
            // print($var);
            // $return[] = $var['name'];

            // if(in_array($var['name'], $existingOptions)) {
            //     $relation->where
            // }


            // $relation->get()->where('option', '=', $var['name'])->update

            // $relation->updateOrCreate(
            //     ['option' => $var['name']],
            //     [
            //         'option' => $var['name'],
            //         'value' => $var['value'],
            //         'is_egg_variable' => $var['isEggVariable'],
            //         'is_force_option' => $var['isForceOption'],
            //     ]
            // );
        }

        // $relation->updateOrCreate(['option' => 'hostname'], [
        //     // 'option' => 'hostname',
        //     'value' => 'welcome',
        //     'is_egg_variable' => 1,
        //     'is_force_option' => 0,
        // ]);

        return new JsonResponse([]);
    }

    // public function scheduleWipe(ClientApiRequest $req, Server $server) {
    //     $runtask = (new RunTaskJob(new Task([]), true))->onQueue();
    //     $runtask->dispatch($runtask);
    //     $this->dispatch($runtask)->onQ
    // }
}
