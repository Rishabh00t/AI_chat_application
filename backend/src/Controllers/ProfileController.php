<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Http;
use App\HttpException;
use App\Validator;

final class ProfileController
{
    /** PUT /profile — update any of: name, avatar (emoji), theme. */
    public static function update(array $params, array $user): void
    {
        $body   = Http::body();
        $fields = [];
        $v      = new Validator();

        if (array_key_exists('name', $body)) {
            $name = trim((string) $body['name']);
            $v->require('name', $name, 'Name')->length('name', $name, 2, 80, 'Name');
            $fields['name'] = $name;
        }
        if (array_key_exists('avatar', $body)) {
            $avatar = trim((string) $body['avatar']);
            $v->length('avatar', $avatar, 1, 8, 'Avatar');
            $fields['avatar'] = $avatar;
        }
        if (array_key_exists('theme', $body)) {
            $v->in('theme', $body['theme'], ['system', 'light', 'dark'], 'Theme');
            $fields['theme'] = $body['theme'];
        }
        $v->validate();

        if ($fields !== []) {
            $set = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
            Database::run("UPDATE users SET $set WHERE id = ?", [...array_values($fields), $user['id']]);
        }
        $fresh = Database::one('SELECT * FROM users WHERE id = ?', [$user['id']]);
        Http::json(['user' => Auth::publicUser($fresh)]);
    }

    /** PUT /profile/password — change password (requires current password). */
    public static function changePassword(array $params, array $user): void
    {
        $current = (string) Http::input('current_password', '');
        $new     = (string) Http::input('new_password', '');
        (new Validator())
            ->require('current_password', $current, 'Current password')
            ->require('new_password', $new, 'New password')->length('new_password', $new, 6, 128, 'New password')
            ->validate();

        $row = Database::one('SELECT password_hash FROM users WHERE id = ?', [$user['id']]);
        if (!password_verify($current, $row['password_hash'])) {
            throw new HttpException(422, 'Current password is incorrect.', ['errors' => ['current_password' => 'Incorrect password.']]);
        }
        Database::run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), $user['id']]);
        Http::json(['message' => 'Password updated.']);
    }
}
