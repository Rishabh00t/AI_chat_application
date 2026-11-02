<?php
declare(strict_types=1);

namespace App;

/** Opaque bearer tokens: the client keeps the raw token, the DB keeps its SHA-256 hash. */
final class Auth
{
    private static ?array $user = null;

    public static function issueToken(int $userId): string
    {
        $token = bin2hex(random_bytes(32));
        $days  = max(1, (int) Config::get('TOKEN_TTL_DAYS', '30'));
        Database::run(
            'INSERT INTO auth_tokens (user_id, token_hash, expires_at) VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL ? DAY)',
            [$userId, hash('sha256', $token), $days]
        );
        // Opportunistic cleanup of expired tokens.
        Database::run('DELETE FROM auth_tokens WHERE expires_at < UTC_TIMESTAMP()');
        return $token;
    }

    public static function requireUser(): array
    {
        if (self::$user !== null) {
            return self::$user;
        }
        $token = Http::bearerToken();
        if ($token === null) {
            throw new HttpException(401, 'Please log in to continue.');
        }
        $user = Database::one(
            'SELECT u.id, u.name, u.email, u.avatar, u.theme, u.created_at
               FROM auth_tokens t JOIN users u ON u.id = t.user_id
              WHERE t.token_hash = ? AND t.expires_at > UTC_TIMESTAMP()',
            [hash('sha256', $token)]
        );
        if ($user === null) {
            throw new HttpException(401, 'Your session has expired. Please log in again.');
        }
        $user['id'] = (int) $user['id'];
        return self::$user = $user;
    }

    public static function revokeCurrent(): void
    {
        $token = Http::bearerToken();
        if ($token !== null) {
            Database::run('DELETE FROM auth_tokens WHERE token_hash = ?', [hash('sha256', $token)]);
        }
    }

    public static function publicUser(array $u): array
    {
        return [
            'id'         => (int) $u['id'],
            'name'       => $u['name'],
            'email'      => $u['email'],
            'avatar'     => $u['avatar'],
            'theme'      => $u['theme'],
            'created_at' => $u['created_at'],
        ];
    }
}
