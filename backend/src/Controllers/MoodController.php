<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Emotions;
use App\Http;
use App\HttpException;
use App\Validator;

/**
 * Daily mood tracker. The client sends its *local* date (`today` / `date`)
 * so "today" matches the user's timezone rather than the server's.
 */
final class MoodController
{
    /** GET /moods?days=30&today=YYYY-MM-DD */
    public static function list(array $params, array $user): void
    {
        $today = self::clientDate(Http::query('today'));
        $days  = max(1, min(365, (int) Http::query('days', 30)));
        $from  = (new \DateTimeImmutable($today))->modify('-' . ($days - 1) . ' days')->format('Y-m-d');

        $rows = array_map([self::class, 'format'], Database::all(
            'SELECT id, mood, intensity, note, entry_date, updated_at FROM mood_entries
              WHERE user_id = ? AND entry_date BETWEEN ? AND ? ORDER BY entry_date DESC',
            [$user['id'], $from, $today]
        ));

        $counts = [];
        foreach ($rows as $r) {
            $counts[$r['mood']] = ($counts[$r['mood']] ?? 0) + 1;
        }
        arsort($counts);

        $todayEntry = null;
        foreach ($rows as $r) {
            if ($r['entry_date'] === $today) {
                $todayEntry = $r;
            }
        }

        Http::json([
            'entries' => $rows,
            'today'   => $todayEntry,
            'summary' => [
                'days'     => $days,
                'logged'   => count($rows),
                'top_mood' => $counts ? (string) array_key_first($counts) : null,
                'counts'   => $counts,
                'streak'   => self::streak($user['id'], $today),
            ],
        ]);
    }

    /** POST /moods { mood, intensity?, note?, date? } — one entry per day (upsert). */
    public static function save(array $params, array $user): void
    {
        $mood      = (string) Http::input('mood', '');
        $intensity = (int) Http::input('intensity', 3);
        $note      = trim((string) Http::input('note', ''));
        $date      = self::clientDate(Http::input('date'));

        $v = (new Validator())->in('mood', $mood, Emotions::ALL, 'Mood');
        if ($intensity < 1 || $intensity > 5) {
            $v->add('intensity', 'Intensity must be between 1 and 5.');
        }
        if (mb_strlen($note) > 500) {
            $v->add('note', 'Note must be at most 500 characters.');
        }
        $v->validate();

        Database::run(
            'INSERT INTO mood_entries (user_id, mood, intensity, note, entry_date) VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE mood = VALUES(mood), intensity = VALUES(intensity), note = VALUES(note)',
            [$user['id'], $mood, $intensity, $note !== '' ? $note : null, $date]
        );
        $entry = Database::one(
            'SELECT id, mood, intensity, note, entry_date, updated_at FROM mood_entries WHERE user_id = ? AND entry_date = ?',
            [$user['id'], $date]
        );
        Http::json(['entry' => self::format($entry), 'streak' => self::streak($user['id'], $date)], 201);
    }

    /** DELETE /moods/{id} */
    public static function delete(array $params, array $user): void
    {
        $n = Database::run('DELETE FROM mood_entries WHERE id = ? AND user_id = ?', [$params['id'], $user['id']])->rowCount();
        if ($n === 0) {
            throw new HttpException(404, 'Mood entry not found.');
        }
        Http::json(['message' => 'Mood entry deleted.']);
    }

    /** Accepts a YYYY-MM-DD within ±1 day of UTC "today" (covers every timezone). */
    private static function clientDate(mixed $value): string
    {
        $utc = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            $min = $utc->modify('-1 day')->format('Y-m-d');
            $max = $utc->modify('+1 day')->format('Y-m-d');
            if ($value >= $min && $value <= $max) {
                return $value;
            }
            throw new HttpException(422, 'Date must be today (YYYY-MM-DD).', ['errors' => ['date' => 'Invalid date.']]);
        }
        return $utc->format('Y-m-d');
    }

    /** Consecutive days with a check-in, ending today (or yesterday if today isn't logged yet). */
    private static function streak(int $userId, string $today): int
    {
        $dates = array_column(Database::all(
            'SELECT entry_date FROM mood_entries WHERE user_id = ? AND entry_date <= ? ORDER BY entry_date DESC LIMIT 400',
            [$userId, $today]
        ), 'entry_date');
        if (!$dates) {
            return 0;
        }
        $cursor = new \DateTimeImmutable($today);
        if ($dates[0] !== $cursor->format('Y-m-d')) {
            $cursor = $cursor->modify('-1 day');
        }
        $streak = 0;
        foreach ($dates as $d) {
            if ($d !== $cursor->format('Y-m-d')) {
                break;
            }
            $streak++;
            $cursor = $cursor->modify('-1 day');
        }
        return $streak;
    }

    private static function format(array $r): array
    {
        $r['id']        = (int) $r['id'];
        $r['intensity'] = (int) $r['intensity'];
        return $r;
    }
}
