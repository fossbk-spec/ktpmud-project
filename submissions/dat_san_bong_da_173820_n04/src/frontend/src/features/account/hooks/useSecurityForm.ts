import { useState, type FormEvent } from "react";

import apiClient from "@/shared/api/apiClient";
import { getApiErrorMessage, logApiError } from "@/shared/utils/apiError";
import { toast } from "@/shared/utils/toast";
import { securitySchema } from "../schemas/security.schema";
import { defaultSecurityForm } from "../utils/security.utils";
import type { SecurityFormData } from "../types/security.types";

export function useSecurityForm() {
  const [securityForm, setSecurityForm] =
    useState<SecurityFormData>(defaultSecurityForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <Key extends keyof SecurityFormData>(
    key: Key,
    value: SecurityFormData[Key],
  ) => {
    setSecurityForm((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationResult = securitySchema.safeParse(securityForm);
    if (!validationResult.success) {
      setFormError(validationResult.error.issues[0]?.message ?? null);
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      await apiClient.patch("/users/me/password", {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setSecurityForm(defaultSecurityForm);
    } catch (error) {
      logApiError("useSecurityForm.handleSubmit", error);
      const message = getApiErrorMessage(error, "Không thể đổi mật khẩu.");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    securityForm,
    isSaving,
    formError,
    updateField,
    handleSubmit,
  };
}
