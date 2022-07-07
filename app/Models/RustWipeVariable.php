<?php

namespace Pterodactyl\Models;


/**
 * @property int $id
 * @property int $server_id
 * @property string $option
 * @property string $value
 * @property bool $is_egg_variable
 * @property bool $is_force_option
 */
class RustWipeVariable extends Model
{

    public const RESOURCE_NAME = 'rust_wipe_variable';
    public $timestamps = false;
    protected $table = 'rust_wipe_variables';
    protected $primaryKey = 'id';
    protected $guarded = ['id', 'created_at', 'updated_at']; //Guarded fields, not mass assignable TODO: might need created_at or updated_at here
    protected $casts = [
        'server_id' => 'integer',
        'is_egg_variable' => 'bool',
        'is_force_option' => 'bool',
        'option' => 'string',
    ];

    public static $validationRules = [
        'server_id' => 'required|exists:servers,id',
        'option' => 'required|string|between:1,20',
        'is_egg_variable' => 'boolean',
        'is_force_option' => 'boolean',
    ];

    protected $attributes = [
        'is_egg_variable' => 1,
        'is_force_option' => 0,
    ];

    // public function getRequiredAttribute() {
    //     return in_array('required', explode('|', $this->rules));
    // }

    /**
     * Returns the server this variable is associated with.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function getServer()
    {
        return $this->belongsTo(Server::class);
    }

    // public function getOptionName() {
    //     return $this->column
    // }

}
