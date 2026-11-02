<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Lightweight, offline emotion detector (keywords + emojis + intensity cues).
 * Used as a fallback when Gemini is unavailable and as a sanity check.
 */
final class EmotionDetector
{
    /** emotion => [pattern => weight]. Patterns are matched on word boundaries. */
    private const LEXICON = [
        'happy'    => ['happy' => 3, 'glad' => 2, 'great' => 2, 'good' => 1, 'awesome' => 3, 'amazing' => 3, 'wonderful' => 3,
                       'joy' => 3, 'yay' => 3, 'love it' => 2, 'smil\w*' => 2, 'fantastic' => 3, 'cheerful' => 3, 'pleased' => 2,
                       '😊' => 3, '😄' => 3, '😁' => 3, '🙂' => 1, '😀' => 3, '❤️' => 2],
        'excited'  => ['excited' => 3, "can'?t wait" => 3, 'thrilled' => 3, 'pumped' => 3, 'stoked' => 3, 'hyped' => 3,
                       'finally' => 1, 'woo+' => 3, '🎉' => 3, '🤩' => 3, '🥳' => 3],
        'grateful' => ['thank\w*' => 2, 'grateful' => 3, 'appreciate\w*' => 3, 'blessed' => 3, 'thankful' => 3, '🙏' => 2],
        'calm'     => ['calm' => 3, 'peaceful' => 3, 'relaxed' => 3, 'content' => 2, 'at ease' => 3, 'chill' => 2, 'serene' => 3],
        'sad'      => ['sad' => 3, 'unhappy' => 3, 'depress\w*' => 3, 'cry\w*' => 3, 'cried' => 3, 'tears' => 3, 'heartbroken' => 3,
                       'miserable' => 3, 'down' => 1, 'hurt\w*' => 2, 'lost' => 1, 'grief' => 3, 'griev\w*' => 3, 'hopeless' => 3,
                       'miss (him|her|them|you)' => 3, 'broke up' => 3, 'passed away' => 3, 'died' => 2, 'upset' => 2,
                       '😢' => 3, '😭' => 3, '😞' => 3, '💔' => 3, '☹️' => 2, '🙁' => 2],
        'lonely'   => ['lonely' => 3, 'alone' => 2, 'isolated' => 3, 'no friends' => 3, 'no one (cares|understands)' => 3,
                       'nobody (cares|understands)' => 3, 'left out' => 3, 'by myself' => 1],
        'anxious'  => ['anxious' => 3, 'anxiety' => 3, 'nervous' => 3, 'worr\w*' => 3, 'scared' => 3, 'afraid' => 3, 'fear' => 2,
                       'panic\w*' => 3, 'uneasy' => 2, 'what if' => 1, 'overthink\w*' => 3, '😰' => 3, '😟' => 2, '😨' => 3],
        'stressed' => ['stress\w*' => 3, 'overwhelm\w*' => 3, 'pressure' => 2, 'deadline\w*' => 2, 'too much' => 2, 'burn(ed|t)? out' => 3,
                       'burnout' => 3, 'swamped' => 3, 'exam\w*' => 1, 'workload' => 2, "can'?t cope" => 3, 'hectic' => 2, '😫' => 3, '😩' => 3],
        'angry'    => ['angry' => 3, 'mad' => 2, 'furious' => 3, 'annoy\w*' => 2, 'irritat\w*' => 2, 'hate' => 2, 'pissed' => 3,
                       'frustrat\w*' => 3, 'unfair' => 2, 'sick of' => 3, 'fed up' => 3, 'rage' => 3, '😠' => 3, '😡' => 3, '🤬' => 3],
        'tired'    => ['tired' => 3, 'exhausted' => 3, 'sleepy' => 3, 'drained' => 3, 'fatigue\w*' => 3, 'no energy' => 3,
                       "can'?t sleep" => 2, 'insomnia' => 3, 'worn out' => 3, '😴' => 3, '🥱' => 3],
        'confused' => ['confus\w*' => 3, "don'?t understand" => 3, 'unsure' => 2, 'lost on' => 2, 'not sure' => 1, 'puzzled' => 3,
                       "don'?t know what to do" => 3, 'which should i' => 2, '🤔' => 2, '😕' => 2],
    ];

    private const INTENSIFIERS = '/\b(very|so|really|extremely|super|incredibly|totally|completely|absolutely|too)\b/i';
    private const NEGATION     = '/\b(not|never|no|isn\'?t|wasn\'?t|don\'?t|didn\'?t|aren\'?t|hardly)\s+(\w+\s+)?$/i';

    /** @return array{emotion: string, intensity: int, scores: array<string, float>} */
    public static function detect(string $text): array
    {
        $lower  = mb_strtolower($text);
        $scores = [];

        foreach (self::LEXICON as $emotion => $patterns) {
            foreach ($patterns as $pattern => $weight) {
                $isEmoji = !preg_match('/[a-z]/', $pattern);
                $regex   = $isEmoji ? '/' . preg_quote($pattern, '/') . '/u' : '/\b' . $pattern . '\b/u';
                if (!preg_match_all($regex, $lower, $matches, PREG_OFFSET_CAPTURE)) {
                    continue;
                }
                foreach ($matches[0] as [, $offset]) {
                    $before = substr($lower, max(0, $offset - 25), min(25, $offset));
                    // "not happy" should not count as happy.
                    if (!$isEmoji && preg_match(self::NEGATION, $before)) {
                        if (in_array($emotion, ['happy', 'excited', 'calm'], true)) {
                            $scores['sad'] = ($scores['sad'] ?? 0) + 1;
                        }
                        continue;
                    }
                    $scores[$emotion] = ($scores[$emotion] ?? 0) + $weight;
                }
            }
        }

        if ($scores === []) {
            return ['emotion' => 'neutral', 'intensity' => 2, 'scores' => []];
        }

        arsort($scores);
        $emotion = (string) array_key_first($scores);
        $raw     = $scores[$emotion];

        // Intensity 1..5 from score + cues like "very", "!!!", ALL CAPS.
        $boost = preg_match_all(self::INTENSIFIERS, $text)
            + (substr_count($text, '!') >= 2 ? 1 : 0)
            + (preg_match('/\b[A-Z]{4,}\b/', $text) ? 1 : 0);
        $intensity = (int) max(1, min(5, round($raw / 2) + $boost));

        return ['emotion' => $emotion, 'intensity' => $intensity, 'scores' => $scores];
    }

    /** True when the message suggests the user may be at risk of self-harm. */
    public static function isCrisis(string $text): bool
    {
        return (bool) preg_match(
            '/\b(kill myself|killing myself|suicid\w*|end my life|want to die|wanna die|self[- ]?harm|hurt myself|cut myself|no reason to live|better off dead)\b/i',
            $text
        );
    }
}
