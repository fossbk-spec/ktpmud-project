from django import forms
from django.contrib.auth import get_user_model

from .models import Hotel, RoomType, Room, HotelMembership

User = get_user_model()


class HotelCreateForm(forms.ModelForm):
    class Meta:
        model = Hotel
        fields = [
            "name",
            "address",
            "description",
            "check_in_time",
            "check_out_time",
            "cancel_policy",
            "bank_info",
        ]
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control"}),
            "address": forms.TextInput(attrs={"class": "form-control"}),
            "description": forms.Textarea(
                attrs={"class": "form-control", "rows": 3}
            ),
            "check_in_time": forms.TimeInput(
                attrs={"class": "form-control", "type": "time"}
            ),
            "check_out_time": forms.TimeInput(
                attrs={"class": "form-control", "type": "time"}
            ),
            "cancel_policy": forms.Textarea(
                attrs={"class": "form-control", "rows": 3}
            ),
            "bank_info": forms.Textarea(
                attrs={"class": "form-control", "rows": 3}
            ),
        }


class RoomTypeForm(forms.ModelForm):
    class Meta:
        model = RoomType
        fields = [
            "name",
            "capacity",
            "base_price",
            "amenities",
            "image",
            "is_active",
        ]
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control"}),
            "capacity": forms.NumberInput(
                attrs={"class": "form-control", "min": 1}
            ),
            "base_price": forms.NumberInput(
                attrs={"class": "form-control", "min": 0}
            ),
            "amenities": forms.Textarea(
                attrs={"class": "form-control", "rows": 3}
            ),
            "image": forms.ClearableFileInput(
                attrs={"class": "form-control"}
            ),
            "is_active": forms.CheckboxInput(
                attrs={"class": "form-check-input"}
            ),
        }

    def clean_capacity(self):
        capacity = self.cleaned_data["capacity"]

        if capacity < 1:
            raise forms.ValidationError("Sức chứa phải lớn hơn 0.")

        return capacity


class RoomForm(forms.ModelForm):
    class Meta:
        model = Room
        fields = [
            "room_code",
            "floor",
            "note",
            "is_active",
        ]
        widgets = {
            "room_code": forms.TextInput(
                attrs={"class": "form-control"}
            ),
            "floor": forms.NumberInput(
                attrs={"class": "form-control", "min": 0}
            ),
            "note": forms.TextInput(
                attrs={"class": "form-control"}
            ),
            "is_active": forms.CheckboxInput(
                attrs={"class": "form-check-input"}
            ),
        }

    def clean_room_code(self):
        room_code = self.cleaned_data["room_code"].strip()

        if not room_code:
            raise forms.ValidationError("Vui lòng nhập mã phòng.")

        return room_code

    def clean(self):
        cleaned_data = super().clean()

        if cleaned_data.get("is_active") is False and self.instance.pk:
            if self.instance.status in [
                Room.OCCUPIED,
                Room.CLEANING,
            ]:
                raise forms.ValidationError(
                    "Không thể ngừng kinh doanh phòng đang có khách "
                    "hoặc đang trong quá trình dọn."
                )

        return cleaned_data


class HotelMembershipForm(forms.ModelForm):
    class Meta:
        model = HotelMembership
        fields = ["user", "role"]
        widgets = {
            "user": forms.Select(
                attrs={"class": "form-select"}
            ),
            "role": forms.Select(
                attrs={"class": "form-select"}
            ),
        }

    def __init__(self, *args, **kwargs):
        self.hotel = kwargs.pop("hotel", None)
        super().__init__(*args, **kwargs)

        self.fields["user"].queryset = User.objects.filter(
            is_active=True,
            is_superuser=False,
        ).order_by("username")

    def clean(self):
        cleaned_data = super().clean()
        user = cleaned_data.get("user")

        if user and self.hotel:
            exists = HotelMembership.objects.filter(
                hotel=self.hotel,
                user=user,
            )

            if self.instance.pk:
                exists = exists.exclude(pk=self.instance.pk)

            if exists.exists():
                raise forms.ValidationError(
                    "Tài khoản này đã được thêm vào cơ sở."
                )

            if self.hotel.owner_id == user.id:
                raise forms.ValidationError(
                    "Chủ cơ sở không cần được thêm vào danh sách nhân viên."
                )

        return cleaned_data

class BulkRoomCreateForm(forms.Form):
    start_number = forms.IntegerField(
        label="Số phòng bắt đầu",
        min_value=1,
        widget=forms.NumberInput(
            attrs={
                "class": "form-control",
                "placeholder": "Ví dụ: 101",
                "min": 1,
            }
        ),
    )

    end_number = forms.IntegerField(
        label="Số phòng kết thúc",
        min_value=1,
        widget=forms.NumberInput(
            attrs={
                "class": "form-control",
                "placeholder": "Ví dụ: 107",
                "min": 1,
            }
        ),
    )

    floor = forms.IntegerField(
        label="Tầng",
        required=False,
        min_value=0,
        widget=forms.NumberInput(
            attrs={
                "class": "form-control",
                "placeholder": "Ví dụ: 1",
                "min": 0,
            }
        ),
    )

    def clean(self):
        cleaned_data = super().clean()
        start = cleaned_data.get("start_number")
        end = cleaned_data.get("end_number")

        if start is not None and end is not None:
            if end < start:
                raise forms.ValidationError(
                    "Số phòng kết thúc phải lớn hơn hoặc bằng số phòng bắt đầu."
                )

            if end - start + 1 > 200:
                raise forms.ValidationError(
                    "Mỗi lần chỉ được tạo tối đa 200 phòng."
                )

        return cleaned_data

class HotelBankSettingsForm(forms.ModelForm):
    class Meta:
        model = Hotel
        fields = [
            "bank_name",
            "bank_bin",
            "bank_account_number",
            "bank_account_name",
        ]
        widgets = {
            "bank_name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Ví dụ: Vietcombank",
                }
            ),
            "bank_bin": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Mã BIN ngân hàng",
                }
            ),
            "bank_account_number": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Số tài khoản nhận tiền",
                }
            ),
            "bank_account_name": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Tên chủ tài khoản, viết in hoa",
                }
            ),
        }
        labels = {
            "bank_name": "Tên ngân hàng",
            "bank_bin": "Mã BIN ngân hàng",
            "bank_account_number": "Số tài khoản",
            "bank_account_name": "Tên chủ tài khoản",
        }

    def clean(self):
        cleaned_data = super().clean()

        bank_fields = [
            cleaned_data.get("bank_name"),
            cleaned_data.get("bank_bin"),
            cleaned_data.get("bank_account_number"),
            cleaned_data.get("bank_account_name"),
        ]

        # Cho phép để trống toàn bộ nếu chưa muốn cài đặt.
        # Nhưng nếu nhập một trường thì phải nhập đủ các trường còn lại.
        if any(bank_fields) and not all(bank_fields):
            raise forms.ValidationError(
                "Vui lòng nhập đầy đủ tên ngân hàng, mã BIN, "
                "số tài khoản và tên chủ tài khoản."
            )

        bin_code = cleaned_data.get("bank_bin", "")
        if bin_code and not bin_code.isdigit():
            self.add_error(
                "bank_bin",
                "Mã BIN chỉ được chứa chữ số."
            )

        account_number = cleaned_data.get("bank_account_number", "")
        if account_number and not account_number.isdigit():
            self.add_error(
                "bank_account_number",
                "Số tài khoản chỉ được chứa chữ số."
            )

        return cleaned_data