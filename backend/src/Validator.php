<?php
declare(strict_types=1);

namespace App;

/** Collects field errors and throws a single 422 response. */
final class Validator
{
    private array $errors = [];

    public function require(string $field, mixed $value, string $label): self
    {
        if (!is_string($value) || trim($value) === '') {
            $this->errors[$field] = "$label is required.";
        }
        return $this;
    }

    public function email(string $field, mixed $value): self
    {
        if (!isset($this->errors[$field]) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = 'Please enter a valid email address.';
        }
        return $this;
    }

    public function length(string $field, mixed $value, int $min, int $max, string $label): self
    {
        if (isset($this->errors[$field]) || !is_string($value)) {
            return $this;
        }
        $len = mb_strlen(trim($value));
        if ($len < $min) {
            $this->errors[$field] = "$label must be at least $min characters.";
        } elseif ($len > $max) {
            $this->errors[$field] = "$label must be at most $max characters.";
        }
        return $this;
    }

    public function in(string $field, mixed $value, array $allowed, string $label): self
    {
        if (!isset($this->errors[$field]) && !in_array($value, $allowed, true)) {
            $this->errors[$field] = "$label is not valid.";
        }
        return $this;
    }

    public function add(string $field, string $message): self
    {
        $this->errors[$field] = $message;
        return $this;
    }

    public function validate(): void
    {
        if ($this->errors !== []) {
            throw new HttpException(422, reset($this->errors), ['errors' => $this->errors]);
        }
    }
}
