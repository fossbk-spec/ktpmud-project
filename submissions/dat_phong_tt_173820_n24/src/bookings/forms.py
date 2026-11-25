from datetime import date

from django import forms


class SearchForm(forms.Form):
    check_in = forms.DateField(label='Ngày nhận phòng', widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}))
    check_out = forms.DateField(label='Ngày trả phòng', widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}))
    guests = forms.IntegerField(label='Số khách', min_value=1, max_value=20, initial=2,
                                widget=forms.NumberInput(attrs={'class': 'form-control'}))

    def clean(self):
        data = super().clean()
        check_in, check_out = data.get('check_in'), data.get('check_out')
        if check_in and check_out:
            if check_in < date.today():
                raise forms.ValidationError('Ngày nhận phòng không được ở quá khứ.')
            if check_out <= check_in:
                raise forms.ValidationError('Ngày trả phòng phải sau ngày nhận phòng.')
        return data


class GuestForm(forms.Form):
    full_name = forms.CharField(label='Họ và tên', max_length=100, widget=forms.TextInput(attrs={'class': 'form-control'}))
    phone = forms.CharField(label='Số điện thoại', max_length=20, widget=forms.TextInput(attrs={'class': 'form-control'}))
    email = forms.EmailField(label='Email (để nhận xác nhận)', required=False, widget=forms.EmailInput(attrs={'class': 'form-control'}))


class LookupForm(forms.Form):
    code = forms.CharField(label='Mã đặt phòng', max_length=12, widget=forms.TextInput(attrs={'class': 'form-control'}))
    phone = forms.CharField(label='Số điện thoại đã đặt', max_length=20, widget=forms.TextInput(attrs={'class': 'form-control'}))
