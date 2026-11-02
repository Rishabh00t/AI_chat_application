<?php
declare(strict_types=1);

/**
 * Front controller for the Aura REST API.
 *   Dev server:  php -S 0.0.0.0:8000 -t public public/index.php   (run inside backend/)
 *   Apache:      point DocumentRoot at backend/public (see .htaccess)
 */

use App\Auth;
use App\Config;
use App\Controllers\AuthController;
use App\Controllers\ChatController;
use App\Controllers\MoodController;
use App\Controllers\ProfileController;
use App\Database;
use App\Http;
use App\HttpException;
use App\Router;
use App\Services\GeminiService;

// PSR-4 style autoloader for the App\ namespace -> src/
spl_autoload_register(function (string $class): void {
    if (str_starts_with($class, 'App\\')) {
        $file = __DIR__ . '/../src/' . str_replace('\\', '/', substr($class, 4)) . '.php';
        if (is_file($file)) {
            require $file;
        }
    }
});

Config::load(__DIR__ . '/../.env');
date_default_timezone_set('UTC');
ini_set('display_errors', '0');

Http::cors();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Normalise path: strip query string, any folder prefix before /api, and trailing slash.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (($pos = strpos($path, '/api')) !== false) {
    $path = substr($path, $pos + 4);
}
$path = '/' . trim($path, '/');

$router = new Router();

// Public
$router->add('GET',  '/',              fn() => Http::json(['name' => 'Aura API', 'version' => '1.0', 'docs' => 'See docs/API.md']), false);
$router->add('GET',  '/health',        function (): void {
    $db = 'ok';
    try { Database::pdo()->query('SELECT 1'); } catch (HttpException $e) { $db = $e->getMessage(); }
    Http::json(['status' => 'ok', 'database' => $db, 'ai' => GeminiService::isConfigured() ? 'gemini' : 'offline']);
}, false);
$router->add('POST', '/auth/register', fn() => AuthController::register(), false);
$router->add('POST', '/auth/login',    fn() => AuthController::login(), false);
$router->add('POST', '/auth/logout',   fn() => AuthController::logout(), false);

// Authenticated
$router->add('GET',    '/auth/me',                          [AuthController::class, 'me']);
$router->add('PUT',    '/profile',                          [ProfileController::class, 'update']);
$router->add('PUT',    '/profile/password',                 [ProfileController::class, 'changePassword']);
$router->add('GET',    '/conversations',                    [ChatController::class, 'listConversations']);
$router->add('POST',   '/conversations',                    [ChatController::class, 'createConversation']);
$router->add('DELETE', '/conversations',                    [ChatController::class, 'deleteAll']);
$router->add('GET',    '/conversations/{id}/messages',      [ChatController::class, 'messages']);
$router->add('DELETE', '/conversations/{id}',               [ChatController::class, 'deleteConversation']);
$router->add('POST',   '/chat',                             [ChatController::class, 'send']);
$router->add('GET',    '/moods',                            [MoodController::class, 'list']);
$router->add('POST',   '/moods',                            [MoodController::class, 'save']);
$router->add('DELETE', '/moods/{id}',                       [MoodController::class, 'delete']);

try {
    $router->dispatch($method, $path);
} catch (HttpException $e) {
    Http::json(array_filter(['error' => $e->getMessage()] + $e->extra, fn($v) => $v !== null), $e->status);
} catch (\Throwable $e) {
    error_log('[Aura] ' . $e);
    Http::json(array_filter([
        'error'  => 'Something went wrong on our side. Please try again.',
        'detail' => Config::bool('APP_DEBUG') ? $e->getMessage() : null,
    ]), 500);
}
