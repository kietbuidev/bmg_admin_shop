"use client";

import { PasswordIcon } from "@/assets/icons";
import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { updateUserPassword } from "../_lib/user-api";

type PasswordFormState = {
  password: string;
  new_password: string;
  new_confirm_password: string;
};

const EMPTY_FORM: PasswordFormState = {
  password: "",
  new_password: "",
  new_confirm_password: "",
};

export function UpdatePasswordForm() {
  const [form, setForm] = useState<PasswordFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof PasswordFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const resetForm = () => setForm(EMPTY_FORM);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!form.password.trim()) {
      toast.error("Current password is required");
      return;
    }

    if (!form.new_password.trim()) {
      toast.error("New password is required");
      return;
    }

    if (form.new_password !== form.new_confirm_password) {
      toast.error("New password confirmation does not match");
      return;
    }

    if (form.new_password === form.password) {
      toast.error("New password must be different from current password");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserPassword({
        password: form.password,
        new_password: form.new_password,
        new_confirm_password: form.new_confirm_password,
      });
      toast.success("Password updated successfully");
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update password",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAllFields =
    form.password.trim() !== "" &&
    form.new_password.trim() !== "" &&
    form.new_confirm_password.trim() !== "";

  return (
    <ShowcaseSection title="Update Password" className="!p-7">
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputGroup
          label="Current Password"
          placeholder="Enter current password"
          type="password"
          name="password"
          value={form.password}
          handleChange={handleChange("password")}
          icon={<PasswordIcon />}
          iconPosition="left"
          height="sm"
          required
        />

        <InputGroup
          label="New Password"
          placeholder="Enter new password"
          type="password"
          name="new_password"
          value={form.new_password}
          handleChange={handleChange("new_password")}
          icon={<PasswordIcon />}
          iconPosition="left"
          height="sm"
          required
        />

        <InputGroup
          label="Confirm New Password"
          placeholder="Confirm new password"
          type="password"
          name="new_confirm_password"
          value={form.new_confirm_password}
          handleChange={handleChange("new_confirm_password")}
          icon={<PasswordIcon />}
          iconPosition="left"
          height="sm"
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={resetForm}
            disabled={isSubmitting || !hasAllFields}
            className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:text-white"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !hasAllFields}
            className="rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </ShowcaseSection>
  );
}
