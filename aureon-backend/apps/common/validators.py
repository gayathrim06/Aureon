from django.core.exceptions import ValidationError

def validate_positive_number(value):
    if value < 0:
        raise ValidationError("Value must be zero or a positive number.")

def validate_phone_number(value):
    if value and not value.replace('+', '').replace('-', '').isdigit():
        raise ValidationError("Enter a valid phone number.")
