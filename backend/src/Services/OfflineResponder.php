<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Template-based empathetic replies used when no Gemini key is configured
 * or the API is unreachable, so the app always stays usable.
 */
final class OfflineResponder
{
    private const OPENERS = [
        'happy'    => ["That's wonderful to hear, {name}! 😊", "I love that energy, {name}!", "Yay — this made me smile!"],
        'excited'  => ["Ooh, that sounds exciting! 🎉", "I can feel your excitement from here, {name}!", "That's big news — congrats!"],
        'grateful' => ["That's a lovely thing to feel grateful for. 🙏", "Gratitude looks good on you, {name}.", "Thank you for sharing that with me."],
        'calm'     => ["It sounds like you're in a peaceful place right now. 🌿", "That calm feeling is worth savouring.", "I'm glad you've found some ease today."],
        'neutral'  => ["I'm here and listening, {name}.", "Thanks for sharing that with me.", "Got it — tell me more whenever you like."],
        'sad'      => ["I'm really sorry you're feeling this way, {name}. 💙", "That sounds really heavy. It's okay to feel sad.", "I'm here with you. You don't have to carry this alone."],
        'lonely'   => ["Feeling lonely can be so hard. I'm glad you reached out. 💙", "You're not alone right now — I'm here with you, {name}.", "That sense of isolation is painful, and it's valid."],
        'anxious'  => ["That sounds really unsettling. Let's slow down together. 🌬️", "Anxiety can make everything feel urgent — you're safe to take a breath here.", "I hear how worried you are, {name}."],
        'stressed' => ["That's a lot on your plate, {name}. 😮‍💨", "No wonder you're feeling stretched thin.", "It makes sense that you're stressed with all of that."],
        'angry'    => ["That sounds genuinely frustrating. Your feelings make sense.", "I'd be upset too in that situation.", "It's okay to feel angry — let's talk it through."],
        'tired'    => ["It sounds like you're running on empty. 😴", "Being that exhausted is tough, {name}.", "Your body might be asking for a little rest."],
        'confused' => ["That does sound confusing — let's untangle it together. 🤔", "It's okay not to have it figured out yet.", "Let's break it down step by step."],
    ];

    private const FOLLOWUPS = [
        'happy'    => ["What's been the best part of it?", "What do you think made today go so well?"],
        'excited'  => ["What are you looking forward to most?", "Tell me everything — how did it happen?"],
        'grateful' => ["What made that moment so meaningful for you?", "Who or what else is bringing you joy lately?"],
        'calm'     => ["What helped you get to this calm place?", "Is there anything you'd like to reflect on while things are quiet?"],
        'neutral'  => ["How are you feeling about it?", "What's on your mind today?"],
        'sad'      => ["Would you like to tell me what happened?", "What's weighing on you the most right now?"],
        'lonely'   => ["Is there someone you've been missing lately?", "Would it help to talk about what's making you feel this way?"],
        'anxious'  => ["Try this with me: breathe in for 4, hold for 4, out for 6. What's the worry that feels biggest right now?", "What's one thing you can control in this situation?"],
        'stressed' => ["Would it help to list what's on your plate and pick just one small next step?", "What's the most urgent thing — and what could wait?"],
        'angry'    => ["What part of it bothered you the most?", "What would feel like a fair outcome to you?"],
        'tired'    => ["Have you had a chance to rest or eat something nourishing today?", "Is something keeping you from getting good sleep?"],
        'confused' => ["What are the options you're weighing?", "What part feels the most unclear?"],
    ];

    public static function reply(string $emotion, string $name, bool $crisis = false): string
    {
        if ($crisis) {
            return self::crisisMessage($name);
        }
        $opener   = self::pick(self::OPENERS[$emotion] ?? self::OPENERS['neutral']);
        $followup = self::pick(self::FOLLOWUPS[$emotion] ?? self::FOLLOWUPS['neutral']);
        return str_replace('{name}', $name, "$opener $followup");
    }

    public static function crisisMessage(string $name): string
    {
        return "{$name}, I'm really glad you told me, and I'm so sorry you're hurting this much. 💙 "
            . "You deserve support from a real person right now. If you're in immediate danger, please call your local emergency number. "
            . "You can also reach a crisis line — in the US call or text 988, in the UK & Ireland call Samaritans at 116 123, "
            . "in India call Tele-MANAS at 14416, or find a local helpline at findahelpline.com. "
            . "I'm here to keep talking with you too — would you tell me a little about what's going on?";
    }

    private static function pick(array $items): string
    {
        return $items[array_rand($items)];
    }
}
