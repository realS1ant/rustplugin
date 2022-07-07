<?php

namespace Pterodactyl\Transformers\Api\Client;

use Pterodactyl\Models\RustWipeVariable;

class RustWipeVariableTransformer extends BaseClientTransformer
{
    public function getResourceName(): string
    {
        return RustWipeVariable::RESOURCE_NAME;
    }

    public function transform(RustWipeVariable $variable)
    {
        return [
            'id' => $variable->id,
            'option' => $variable->option,
            'value' => $variable->value,
            'is_egg_variable' => $variable->is_egg_variable,
            'is_force_option' => $variable->is_force_option,
        ];
    }

    public static function fromPost(mixed $variable)
    {
        return [
            'option' => $variable->name,
            'value' => $variable->value,
            'is_egg_variable' => $variable->isEggVariable,
            'is_force_option' => $variable->isForceOption,
        ];
    }
}
