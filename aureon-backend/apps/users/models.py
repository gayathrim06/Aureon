import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from roles.models import Role

class UserManager(BaseUserManager):
    """Custom user manager using email as unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('account_status', 'ACTIVE')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    tbl_user Model for Aureon SaaS Platform.
    Uses UUID primary key and email as login username.
    """
    ACCOUNT_STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
        ('LOCKED', 'Locked'),
    )

    GENDER_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
        ('PREFER_NOT_TO_SAY', 'Prefer not to say'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee_id = models.CharField(max_length=50, unique=True, db_index=True, blank=True, null=True)
    full_name = models.CharField(max_length=255)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    email = models.EmailField(max_length=255, unique=True, db_index=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    
    department = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='PREFER_NOT_TO_SAY', blank=True, null=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    avatar_preset = models.TextField(blank=True, null=True)
    
    # Security & Recovery Questions
    date_of_birth = models.DateField(blank=True, null=True)
    pet_name = models.CharField(max_length=150, blank=True, null=True)
    school_friend_name = models.CharField(max_length=150, blank=True, null=True)
    
    first_login = models.BooleanField(default=True, help_text="Force password change on initial login.")
    must_change_password = models.BooleanField(default=True)
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUS_CHOICES, default='ACTIVE', db_index=True)
    email_verified = models.BooleanField(default=False)
    
    failed_login_attempts = models.IntegerField(default=0)
    lockout_until = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'tbl_user'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    @property
    def role_name(self):
        return self.role.name if self.role else 'Unassigned'

    @property
    def role_code(self):
        return self.role.code if self.role else None

    @property
    def avatar_url(self):
        if self.profile_image:
            try:
                return self.profile_image.url
            except Exception:
                pass
        if self.avatar_preset:
            return self.avatar_preset
        if self.gender == 'MALE':
            return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        elif self.gender == 'FEMALE':
            return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
        return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'

