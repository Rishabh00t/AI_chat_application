<?php
declare(strict_types=1);

namespace App\Services;

use App\Config;
use App\Emotions;

/**
 * Calls the Google Gemini generateContent REST API.
 * The API key never leaves the server.
 */
final class GeminiService
{
    private const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent';

    public static function isConfigured(): bool
    {
        return (string) Config::get('GEMINI_API_KEY', '') !== '';
    }

    /**
     * @param array<int, array{role: string, content: string}> $history oldest first, excluding $message
     * @return array{emotion: string, intensity: int, reply: string, model: string}
     * @throws \RuntimeException when every configured model fails
     */
    public static function respond(string $systemPrompt, array $history, string $message): array
    {
        $contents = [];
        foreach ($history as $m) {
            $role = $m['role'] === 'assistant' ? 'model' : 'user';
            if ($contents === [] && $role === 'model') {
                continue; // conversations must start with a user turn
            }
            $contents[] = ['role' => $role, 'parts' => [['text' => $m['content']]]];
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

        $payload = [
            'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
            'contents'           => $contents,
            'generationConfig'   => [
                'temperature'      => 0.85,
                'maxOutputTokens'  => 2048,
                'responseMimeType' => 'application/json',
                'responseSchema'   => [
                    'type'       => 'OBJECT',
                    'properties' => [
                        'emotion'   => ['type' => 'STRING', 'enum' => Emotions::ALL,
                                        'description' => "The user's dominant emotion in their latest message."],
                        'intensity' => ['type' => 'INTEGER', 'description' => 'Strength of that emotion from 1 (mild) to 5 (very strong).'],
                        'reply'     => ['type' => 'STRING', 'description' => 'Your empathetic reply to the user.'],
                    ],
                    'required' => ['emotion', 'intensity', 'reply'],
                ],
            ],
        ];

        $models = array_filter(array_map('trim', explode(',', Config::get('GEMINI_MODELS', 'gemini-3.8-flash,gemini-3.1-flash-lite'))));
        $errors = [];
        foreach ($models as $model) {
            try {
                return self::callModel($model, $payload) + ['model' => $model];
            } catch (\RuntimeException $e) {
                $errors[] = "$model: " . $e->getMessage();
                error_log('[Gemini] ' . end($errors));
            }
        }
        throw new \RuntimeException(implode(' | ', $errors) ?: 'No Gemini models configured.');
    }

    /** @return array{emotion: string, intensity: int, reply: string} */
    private static function callModel(string $model, array $payload): array
    {
        $ch = curl_init(sprintf(self::ENDPOINT, rawurlencode($model)));
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'x-goog-api-key: ' . Config::get('GEMINI_API_KEY'),
            ],
            CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT        => 45,
        ]);
        // Windows PHP often ships without a CA bundle: use a custom one, or the Windows certificate store.
        if ($ca = Config::get('CA_BUNDLE')) {
            curl_setopt($ch, CURLOPT_CAINFO, $ca);
        } elseif (PHP_OS_FAMILY === 'Windows' && !ini_get('curl.cainfo') && defined('CURLSSLOPT_NATIVE_CA')) {
            curl_setopt($ch, CURLOPT_SSL_OPTIONS, CURLSSLOPT_NATIVE_CA);
        }
        $raw    = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err    = curl_error($ch);

        if ($raw === false) {
            throw new \RuntimeException("network error: $err");
        }
        $data = json_decode((string) $raw, true);
        if ($status !== 200) {
            $msg = $data['error']['message'] ?? substr((string) $raw, 0, 200);
            throw new \RuntimeException("HTTP $status: $msg");
        }

        // Join the visible text parts (skip any "thought" parts).
        $text = '';
        foreach ($data['candidates'][0]['content']['parts'] ?? [] as $part) {
            if (empty($part['thought']) && isset($part['text'])) {
                $text .= $part['text'];
            }
        }
        $text = trim($text);
        if ($text === '') {
            $reason = $data['candidates'][0]['finishReason'] ?? ($data['promptFeedback']['blockReason'] ?? 'unknown');
            throw new \RuntimeException("empty response (reason: $reason)");
        }

        $json = json_decode(self::stripFences($text), true);
        if (!is_array($json) || empty($json['reply'])) {
            // Model ignored the JSON format: treat the whole text as the reply.
            return ['emotion' => '', 'intensity' => 0, 'reply' => $text];
        }
        return [
            'emotion'   => Emotions::normalize($json['emotion'] ?? null),
            'intensity' => (int) max(1, min(5, (int) ($json['intensity'] ?? 3))),
            'reply'     => trim((string) $json['reply']),
        ];
    }

    private static function stripFences(string $text): string
    {
        return preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $text) ?? $text;
    }
}
