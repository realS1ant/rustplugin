<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Wipe\GetWipeRequest;
use Pterodactyl\Models\RustWipeVariable;
use Pterodactyl\Models\Schedule;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Task;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Transformers\Api\Client\RustWipeVariableTransformer;
use Pterodactyl\Services\RustWipe\RustWipeService;

class RustWipeController extends ClientApiController
{
    /**
     * @var \Pterodactyl\Services\RustWipe\RustWipeService
     */
    private $service;
    /**
     * @var \Pterodactyl\Repositories\Wings\DaemonServerRepository
     */
    private $serverRepository;

    public function __construct(DaemonServerRepository $serverRepository, RustWipeService $service)
    {
        parent::__construct();

        $this->serverRepository = $serverRepository;
        $this->service = $service;
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
            Log::debug($var);
            RustWipeVariable::query()
                ->updateOrCreate(
                    ['option' => $var['name'], 'server_id' => $server->id, 'is_force_option' => $var['isForceOption']],
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
        if (count($schedule->tasks()->getQuery()->where('action', 'rust_wipe')->get()) > 0) return new JsonResponse(['success' => false, 'message' => 'That schedule is already set up to wipe.']);

        Task::query()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => ($schedule->tasks()->orderByDesc('sequence_id')->first()->sequence_id ?? 0) + 1,
            'action' => 'power',
            'payload' => 'stop',
            'time_offset' => 0,
            'continue_on_failure' => false,
        ]);
        Task::query()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => ($schedule->tasks()->orderByDesc('sequence_id')->first()->sequence_id ?? 0) + 1,
            'action' => 'rust_wipe',
            'payload' => '',
            'time_offset' => $req->input('offset') ?? 35,
            'continue_on_failure' => true,
        ]);
        Task::query()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => ($schedule->tasks()->orderByDesc('sequence_id')->first()->sequence_id ?? 0) + 1,
            'action' => 'power',
            'payload' => 'start',
            'time_offset' => 35,
            'continue_on_failure' => false,
        ]);

        return new JsonResponse(['success' => true, 'message' => 'Set up wipe for ' . $schedule->name . ' schedule.']);
    }

    public function wipe(ClientApiRequest $req, Server $server): JsonResponse
    {
        Log::debug('we here??');
        // return new JsonResponse(['success' => true, 'message' => 'why no owwr0']);
        return new JsonResponse($this->service->wipe($server, $req->input('manual', true), false));
    }
}
