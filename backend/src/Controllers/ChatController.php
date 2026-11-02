<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Http;
use App\HttpException;
use App\Services\CompanionService;
use App\Validator;

final class ChatController
{
    /** GET /conversations — newest first, with a preview of the last message. */
    public static function listConversations(array $params, array $user): void
    {
        $rows = Database::all(
            'SELECT c.id, c.title, c.last_emotion, c.created_at, c.updated_at,
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
                    (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
               FROM conversations c
              WHERE c.user_id = ?
              ORDER BY c.updated_at DESC, c.id DESC',
            [$user['id']]
        );
        foreach ($rows as &$r) {
            $r['id']            = (int) $r['id'];
            $r['message_count'] = (int) $r['message_count'];
            $r['last_message']  = $r['last_message'] !== null ? mb_substr($r['last_message'], 0, 120) : null;
        }
        Http::json(['conversations' => $rows]);
    }

    /** POST /conversations — create an empty conversation. */
    public static function createConversation(array $params, array $user): void
    {
        $title = trim((string) Http::input('title', '')) ?: 'New conversation';
        Database::run('INSERT INTO conversations (user_id, title) VALUES (?, ?)', [$user['id'], mb_substr($title, 0, 120)]);
        Http::json(['conversation' => self::findConversation(Database::lastId(), $user['id'])], 201);
    }

    /** GET /conversations/{id}/messages */
    public static function messages(array $params, array $user): void
    {
        $conv = self::findConversation($params['id'], $user['id']);
        $rows = Database::all(
            'SELECT id, role, content, emotion, emotion_intensity, source, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC',
            [$conv['id']]
        );
        Http::json(['conversation' => $conv, 'messages' => array_map([self::class, 'formatMessage'], $rows)]);
    }

    /** DELETE /conversations/{id} */
    public static function deleteConversation(array $params, array $user): void
    {
        $conv = self::findConversation($params['id'], $user['id']);
        Database::run('DELETE FROM conversations WHERE id = ?', [$conv['id']]);
        Http::json(['message' => 'Conversation deleted.']);
    }

    /** DELETE /conversations — clear all chat history for the user. */
    public static function deleteAll(array $params, array $user): void
    {
        $count = Database::run('DELETE FROM conversations WHERE user_id = ?', [$user['id']])->rowCount();
        Http::json(['message' => 'All conversations deleted.', 'deleted' => $count]);
    }

    /**
     * POST /chat  { message, conversation_id? }
     * Saves the user's message, generates Aura's reply and returns both.
     */
    public static function send(array $params, array $user): void
    {
        $message = trim((string) Http::input('message', ''));
        $convId  = Http::input('conversation_id');

        (new Validator())->require('message', $message, 'Message')->length('message', $message, 1, 4000, 'Message')->validate();

        if ($convId) {
            $conv = self::findConversation((int) $convId, $user['id']);
        } else {
            Database::run('INSERT INTO conversations (user_id, title) VALUES (?, ?)', [$user['id'], self::titleFrom($message)]);
            $conv = self::findConversation(Database::lastId(), $user['id']);
        }

        Database::run('INSERT INTO messages (conversation_id, role, content) VALUES (?, \'user\', ?)', [$conv['id'], $message]);
        $userMsgId = Database::lastId();

        $ai = CompanionService::reply($user, $conv['id'], $message);

        Database::run('UPDATE messages SET emotion = ?, emotion_intensity = ? WHERE id = ?', [$ai['emotion'], $ai['intensity'], $userMsgId]);
        Database::run(
            'INSERT INTO messages (conversation_id, role, content, source) VALUES (?, \'assistant\', ?, ?)',
            [$conv['id'], $ai['reply'], $ai['source']]
        );
        $aiMsgId = Database::lastId();

        // Rename a placeholder title once the first real message arrives.
        $title = $conv['title'] === 'New conversation' ? self::titleFrom($message) : $conv['title'];
        Database::run('UPDATE conversations SET last_emotion = ?, title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [$ai['emotion'], $title, $conv['id']]);

        $rows = Database::all(
            'SELECT id, role, content, emotion, emotion_intensity, source, created_at FROM messages WHERE id IN (?, ?) ORDER BY id',
            [$userMsgId, $aiMsgId]
        );

        Http::json([
            'conversation' => self::findConversation($conv['id'], $user['id']),
            'user_message' => self::formatMessage($rows[0]),
            'ai_message'   => self::formatMessage($rows[1]),
            'emotion'      => ['label' => $ai['emotion'], 'intensity' => $ai['intensity']],
            'notice'       => $ai['notice'],
        ]);
    }

    private static function findConversation(int $id, int $userId): array
    {
        $conv = Database::one('SELECT id, title, last_emotion, created_at, updated_at FROM conversations WHERE id = ? AND user_id = ?', [$id, $userId]);
        if (!$conv) {
            throw new HttpException(404, 'Conversation not found.');
        }
        $conv['id'] = (int) $conv['id'];
        return $conv;
    }

    private static function formatMessage(array $m): array
    {
        $m['id']                = (int) $m['id'];
        $m['emotion_intensity'] = $m['emotion_intensity'] !== null ? (int) $m['emotion_intensity'] : null;
        return $m;
    }

    private static function titleFrom(string $message): string
    {
        $clean = preg_replace('/\s+/', ' ', $message);
        return mb_strlen($clean) > 48 ? rtrim(mb_substr($clean, 0, 45)) . '…' : $clean;
    }
}
