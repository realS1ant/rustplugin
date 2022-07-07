<?php

namespace Pterodactyl\Http\Requests\Api\Application\Servers;

use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class ServerWriteRequest extends ApplicationApiRequest
{
    /**
     * @var string
     */
    protected $resource = AdminAcl::RESOURCE_SERVERS;

    /**
     * @var int
     */
    protected $permission = AdminAcl::WRITE;
}
