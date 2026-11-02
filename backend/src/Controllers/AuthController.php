<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Http;
use App\HttpException;
use App\Validator;

final class AuthController
{
    public static function register(): void
    {
        $name     = trim((string) Http::input('name', ''));
        $email    = strtolower(trim((string) Http::input('email', '')));
        $password = (string) Http::input('password', '');

        (new Validator())
            ->require('name', $name, 'Name')->length('name', $name, 2, 80, 'Name')
            ->require('email', $email, 'Email')->email('email', $email)
            ->require('password', $password, 'Password')->length('password', $password, 6, 128, 'Password')
            ->validate();

        if (Database::one('SELECT id FROM users WHERE email = ?', [$email])) {
            throw new HttpException(409, 'An account with this email already exists.', ['errors' => ['email' => 'Email already registered.']]);
        }

        Database::run(
            'INSERT INTO users (name, email, password_hash, avatar) VALUES (?, ?, ?, ?)',
            [$name, $email, password_hash($password, PASSWORD_DEFAULT), '🙂']
        );
        $id   = Database::lastId();
        $user = Database::one('SELECT * FROM users WHERE id = ?', [$id]);

        Http::json(['token' => Auth::issueToken($id), 'user' => Auth::publicUser($user)], 201);
    }

    public static function login(): void
    {
        $email    = strtolower(trim((string) Http::input('email', '')));
        $password = (string) Http::input('password', '');

        (new Validator())
            ->require('email', $email, 'Email')->email('email', $email)
            ->require('password', $password, 'Password')
            ->validate();

        $user = Database::one('SELECT * FROM users WHERE email = ?', [$email]);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new HttpException(401, 'Incorrect email or password.');
        }
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            Database::run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $user['id']]);
        }

        Http::json(['token' => Auth::issueToken((int) $user['id']), 'user' => Auth::publicUser($user)]);
    }

    public static function logout(): void
    {
        Auth::revokeCurrent();
        Http::json(['message' => 'Logged out.']);
    }

    public static function me(array $params, array $user): void
    {
        $stats = Database::one(
            'SELECT
                (SELECT COUNT(*) FROM conversations WHERE user_id = :u) AS conversations,
                (SELECT COUNT(*) FROM messages m JOIN conversations c ON c.id = m.conversation_id WHERE c.user_id = :u2 AND m.role = \'user\') AS messages,
                (SELECT COUNT(*) FROM mood_entries WHERE user_id = :u3) AS mood_entries',
            ['u' => $user['id'], 'u2' => $user['id'], 'u3' => $user['id']]
        );
        Http::json(['user' => Auth::publicUser($user), 'stats' => array_map('intval', $stats)]);
    }
}
