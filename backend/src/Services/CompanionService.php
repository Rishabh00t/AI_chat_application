<?php
declare(strict_types=1);

namespace App\Services;

use App\Database;
use App\Emotions;

/**
 * Produces Aura's reply: detects emotion, builds a context-aware prompt
 * (name, recent mood, conversation history) and calls Gemini, falling back
 * to the offline responder when needed.
 */
final class CompanionService
{
    private const HISTORY_LIMIT = 20;

    /**
     * @return array{emotion: string, intensity: int, reply: string, source: string, notice: ?string}
     */
    public static function reply(array $user, int $conversationId, string $message): array
    {
        $local  = EmotionDetector::detect($message);
        $crisis = EmotionDetector::isCrisis($message);
        $name   = self::firstName($user['name']);
        if ($crisis && $local['emotion'] === 'neutral') {
            $local = ['emotion' => 'sad', 'intensity' => 5] + $local;
        }

        if (GeminiService::isConfigured()) {
            try {
                $history = self::history($conversationId);
                $result  = GeminiService::respond(self::systemPrompt($user, $crisis), $history, $message);
                $emotion = $result['emotion'] !== '' ? $result['emotion'] : $local['emotion'];
                $reply   = $result['reply'];
                if ($crisis && !preg_match('/988|116 123|helpline|crisis|emergency/i', $reply)) {
                    // Always surface real-world help for crisis messages.
                    $reply .= "\n\n" . OfflineResponder::crisisMessage($name);
                }
                return [
                    'emotion'   => Emotions::normalize($emotion),
                    'intensity' => $result['intensity'] ?: $local['intensity'],
                    'reply'     => $reply,
                    'source'    => 'gemini',
                    'notice'    => null,
                ];
            } catch (\RuntimeException $e) {
                $notice = 'Aura is in offline mode right now (the AI service was unreachable).';
            }
        } else {
            $notice = 'Offline mode: add GEMINI_API_KEY to backend/.env for full AI replies.';
        }

        return [
            'emotion'   => $local['emotion'],
            'intensity' => $local['intensity'],
            'reply'     => OfflineResponder::reply($local['emotion'], $name, $crisis),
            'source'    => 'offline',
            'notice'    => $notice,
        ];
    }

    /** @return array<int, array{role: string, content: string}> oldest first */
    private static function history(int $conversationId): array
    {
        // Latest N messages, excluding the user message that was just saved (handled separately).
        $rows = Database::all(
            'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ' . (self::HISTORY_LIMIT + 1),
            [$conversationId]
        );
        array_shift($rows); // drop the just-inserted user message
        return array_reverse($rows);
    }

    private static function systemPrompt(array $user, bool $crisis): string
    {
        $name  = self::firstName($user['name']);
        $mood  = Database::one(
            'SELECT mood, intensity, note, entry_date FROM mood_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT 1',
            [$user['id']]
        );
        $trend = Database::all(
            'SELECT mood, COUNT(*) c FROM mood_entries WHERE user_id = ? AND entry_date >= CURDATE() - INTERVAL 7 DAY GROUP BY mood ORDER BY c DESC LIMIT 3',
            [$user['id']]
        );

        $moodLine = $mood
            ? sprintf('Their latest mood check-in (%s) was "%s" (intensity %d/5)%s.', $mood['entry_date'], $mood['mood'], $mood['intensity'],
                $mood['note'] ? ' with the note: "' . mb_substr($mood['note'], 0, 200) . '"' : '')
            : 'They have not logged a mood check-in yet.';
        $trendLine = $trend
            ? 'Most common moods this week: ' . implode(', ', array_map(fn($t) => "{$t['mood']} ({$t['c']}x)", $trend)) . '.'
            : '';
        $emotions = implode(', ', Emotions::ALL);

        $prompt = <<<PROMPT
You are Aura, a warm, emotionally intelligent AI companion inside a wellbeing chat app.
You are talking with {$name}. {$moodLine} {$trendLine}

How to respond:
- First, silently identify the user's dominant emotion in their latest message (one of: {$emotions}) and its intensity 1-5.
- Acknowledge and validate the feeling naturally before offering anything else. Mirror their energy: celebrate joy, slow down for pain.
- Be conversational and human: 2-5 short sentences usually, plain language, no lists unless they ask for steps or advice.
- Remember and refer back to earlier details in this conversation to show you're truly listening.
- Offer gentle, practical support when it helps (a grounding exercise, a reframe, a small next step) and usually end with one caring, open question.
- Use the user's name occasionally, and an emoji at most once per reply, only when it fits the mood.
- You are not a therapist and do not diagnose. Encourage professional or trusted-person support when problems seem serious or persistent.
- Never be preachy, judgmental, or toxic-positive. Don't say "as an AI".
PROMPT;

        if ($crisis) {
            $prompt .= "\n\nIMPORTANT: The latest message may indicate a risk of self-harm. Respond with deep compassion, take it seriously, "
                . 'gently encourage them to contact local emergency services or a crisis line right now (e.g. 988 in the US, Samaritans 116 123 in the UK/Ireland, '
                . 'Tele-MANAS 14416 in India, or findahelpline.com), and invite them to keep talking. Set emotion to "sad" if unsure.';
        }

        return $prompt . "\n\nReturn JSON with keys: emotion, intensity, reply.";
    }

    private static function firstName(string $name): string
    {
        return explode(' ', trim($name))[0] ?: 'friend';
    }
}
