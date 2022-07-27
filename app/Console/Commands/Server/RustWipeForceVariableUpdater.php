<?php

namespace Pterodactyl\Console\Commands\Server;

use Pterodactyl\Models\Server;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Factory as ValidatorFactory;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Models\Egg;
use Pterodactyl\Services\RustWipe\RustWipeService;

class RustWipeForceVariableUpdater extends Command
{
    /**
     * @var string
     */
    protected $signature = 'p:server:rust-force-wipe';

    /**
     * @var string
     */
    protected $description = "Perform an update of the egg environment variables of every server with an egg with a name containing the word rust.";

    /**
     * @var \Pterodactyl\Services\RustWipe\RustWipeService;
     */
    protected $wipeService;

    public function __construct(RustWipeService $wipeService)
    {
        parent::__construct();

        $this->wipeService = $wipeService;
    }

    public function handle()
    {
        //get egg id of egg(s) with rust in the name.
        $ids = Egg::query()->where('name', 'LIKE', '%rust%')->get(['id'])->toArray();
        foreach ($ids as &$id) $id = $id['id'];

        //alternatively you can define the id you would like by commenting the above two line and uncommenting the below
        // $ids = [14];
        Log::debug($ids);
        //get servers with eggs in that list 
        foreach ($ids as $id) {
            if (isset($servers)) $servers = $servers->concat(Server::whereEggId($id)->get());
            else $servers = Server::whereEggId($id)->get();
        }

        foreach ($servers as $server) {
            $this->wipeService->wipe($server, false, true);
        }
    }
}
