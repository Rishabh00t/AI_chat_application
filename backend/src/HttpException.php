<?php
declare(strict_types=1);

namespace App;

/** Throw anywhere to send a JSON error response with the given status. */
final class HttpException extends \RuntimeException
{
    public function __construct(public readonly int $status, string $message, public readonly array $extra = [])
    {
        parent::__construct($message, $status);
    }
}
