<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Wipe\GetWipeRequest;
use Pterodactyl\Jobs\Schedule\RunTaskJob;
use Pterodactyl\Models\RustWipeVariable;
use Pterodactyl\Models\Schedule;
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

    public function post(ClientApiRequest $req, Server $server)
    {
        $vars = $req->input('variables');

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
        }
        return;
    }

    public function addTask(ClientApiRequest $req, Server $server, Schedule $schedule)
    {

        $lastTask = $schedule->tasks()->orderByDesc('sequence_id')->first();
        $task = Task::query()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => ($schedule->tasks()->orderByDesc('sequence_id')->first()->sequence_id ?? 0) + 1,
            'action' => 'rust_wipe',
            'payload' => '',
            'time_offset' => 0,
            'continue_on_failure' => 1,
        ]);

        return new JsonResponse($task);
    }

    public function wipe(ClientApiRequest $req, Server $server): JsonResponse
    {

        return new JsonResponse(['message' => 'this is ' . ($req->input('force', false) ? '' : 'not ') . 'a forced option.']);
    }

    // public function scheduleWipe(ClientApiRequest $req, Server $server) {
    //     $runtask = (new RunTaskJob(new Task([]), true))->onQueue();
    //     $runtask->dispatch($runtask);
    //     $this->dispatch($runtask)->onQ
    // }
}
