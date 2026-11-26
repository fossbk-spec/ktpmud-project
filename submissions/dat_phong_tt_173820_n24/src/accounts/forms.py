
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, PasswordChangeForm
from django.core.validators import RegexValidator

from .models import OwnerAccount

User = get_user_model()


class OwnerRegisterForm(UserCreationForm):
    """
    Đăng ký:
    - Không có mã giới thiệu: đăng ký chủ cơ sở.
    - Có mã giới thiệu hợp lệ: đăng ký nhân viên.
    """

    email = forms.EmailField(
        required=True,
        label="Email",
        widget=forms.EmailInput(attrs={
            "class": "form-control",
            "placeholder": "Nhập email",
        }),
    )

    referral_code = forms.CharField(
        required=False,
        label="Mã giới thiệu (nếu có)",
        max_length=100,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "Nhập mã giới thiệu của chủ cơ sở",
            "autocomplete": "off",
        }),
    )

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "referral_code",
            "password1",
            "password2",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for name in ("username", "password1", "password2"):
            self.fields[name].widget.attrs.update({
                "class": "form-control",
            })

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError(
                "Email này đã được sử dụng."
            )

        return email

    def clean_referral_code(self):
        code = self.cleaned_data.get("referral_code", "").strip()

        if not code:
            self.referred_owner = None
            return ""

        try:
            owner = OwnerAccount.objects.select_related("user").get(
                referral_code__iexact=code,
                status=OwnerAccount.ACTIVE,
                user__is_active=True,
            )
        except OwnerAccount.DoesNotExist:
            raise forms.ValidationError(
                "Mã giới thiệu không hợp lệ hoặc chủ cơ sở "
                "chưa được kích hoạt."
            )

        self.referred_owner = owner
        return owner.referral_code

    def save(self, commit=True):
        if not commit:
            raise ValueError(
                "OwnerRegisterForm không hỗ trợ save(commit=False)."
            )

        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.is_staff = False
        user.is_superuser = False

        referral_code = self.cleaned_data.get("referral_code", "")

        if referral_code:
            # Nhân viên được phép đăng nhập nhưng chưa có quyền
            # vào khách sạn cho đến khi chủ cơ sở duyệt.
            user.is_active = True
        else:
            # Chủ cơ sở phải chờ Admin phê duyệt.
            user.is_active = False

        user.save()

        if referral_code:
            from .models import OwnerReferral

            OwnerReferral.objects.create(
                owner=self.referred_owner,
                referred_user=user,
                referral_code_used=referral_code,
                status=OwnerReferral.PENDING,
            )
        else:
            OwnerAccount.objects.create(
                user=user,
                status=OwnerAccount.PENDING,
            )

        return user


class AccountEmailForm(forms.Form):
    email = forms.EmailField(
        label="Email mới",
        widget=forms.EmailInput(attrs={
            "class": "form-control",
        }),
    )

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user

        if user:
            self.fields["email"].initial = user.email

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()

        exists = User.objects.filter(
            email__iexact=email
        ).exclude(pk=self.user.pk).exists()

        if exists:
            raise forms.ValidationError(
                "Email này đã được sử dụng bởi tài khoản khác."
            )

        return email


class ReferralSuffixForm(forms.Form):
    suffix = forms.CharField(
        label="Hậu tố mã giới thiệu",
        max_length=40,
        validators=[
            RegexValidator(
                regex=r"^[A-Za-z0-9]+$",
                message="Hậu tố chỉ được chứa chữ cái và chữ số.",
            )
        ],
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "placeholder": "Ví dụ: HOTEL2026",
        }),
        help_text=(
            "Chỉ thay đổi phần hậu tố. Số chủ cơ sở do hệ thống cấp "
            "không thể chỉnh sửa."
        ),
    )

    def clean_suffix(self):
        return self.cleaned_data["suffix"].strip().upper()


class AccountPasswordChangeForm(PasswordChangeForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for field in self.fields.values():
            field.widget.attrs.update({
                "class": "form-control",
            })
