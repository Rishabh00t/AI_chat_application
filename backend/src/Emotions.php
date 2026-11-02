<?php
declare(strict_types=1);

namespace App;

/** The emotion vocabulary shared by the detector, Gemini schema, mood tracker and app. */
final class Emotions
{
    public const ALL = [
        'happy', 'excited', 'grateful', 'calm', 'neutral',
        'sad', 'lonely', 'anxious', 'stressed', 'angry', 'tired', 'confused',
    ];

    public static function normalize(?string $e): string
    {
        $e = strtolower(trim((string) $e));
        return in_array($e, self::ALL, true) ? $e : 'neutral';
    }
}
