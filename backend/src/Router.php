<?php
declare(strict_types=1);

namespace App;

/** Tiny router: paths like /conversations/{id} map to callables. */
final class Router
{
    /** @var array<int, array{string, string, callable, bool}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler, bool $auth = true): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>\d+)', $pattern) . '$#';
        $this->routes[] = [$method, $regex, $handler, $auth];
    }

    public function dispatch(string $method, string $path): void
    {
        $pathMatched = false;
        foreach ($this->routes as [$m, $regex, $handler, $auth]) {
            if (!preg_match($regex, $path, $matches)) {
                continue;
            }
            $pathMatched = true;
            if ($m !== $method) {
                continue;
            }
            $params = array_map('intval', array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY));
            $user = $auth ? Auth::requireUser() : null;
            $handler($params, $user);
            return;
        }
        throw $pathMatched
            ? new HttpException(405, 'Method not allowed.')
            : new HttpException(404, "Endpoint not found: $method $path");
    }
}
