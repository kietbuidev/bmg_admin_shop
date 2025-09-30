"use client";

import {
  CallIcon,
  EmailIcon,
  PencilSquareIcon,
  UserIcon,
} from "@/assets/icons";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import {
  fetchCurrentUser,
  type UpdateUserPayload,
  type UserProfile,
  updateCurrentUser,
} from "../_lib/user-api";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_code: string;
  country: string;
  address: string;
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  phone_code: "",
  country: "",
  address: "",
};

export function PersonalInfoForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const user = await fetchCurrentUser();
        if (!mounted) return;
        setProfile(user);
        setForm(mapProfileToForm(user));
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load profile";
        setError(message);
        toast.error(message);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const isDirty = useMemo(() => {
    if (!profile) return false;
    const original = mapProfileToForm(profile);
    return JSON.stringify(form) !== JSON.stringify(original);
  }, [form, profile]);

  const handleInputChange = (
    field: keyof FormState,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, address: value }));
  };

  const handleCancel = () => {
    if (profile) {
      setForm(mapProfileToForm(profile));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || !profile) return;

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("First and last name are required");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload: UpdateUserPayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        phone_code: form.phone_code.trim() || "",
        country: form.country.trim() || null,
        address: form.address.trim() || null,
      };

      const updated = await updateCurrentUser(payload);
      setProfile(updated);
      setForm(mapProfileToForm(updated));
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ShowcaseSection title="Personal Information" className="!p-7">
      {isLoading ? (
        <LoadingState />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-light-3 bg-red-light-6/60 px-4 py-3 text-sm text-red">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-5.5 sm:flex-row">
            <InputGroup
              className="w-full sm:w-1/2"
              type="text"
              name="first_name"
              label="First Name"
              placeholder="Enter first name"
              value={form.first_name}
              handleChange={handleInputChange("first_name")}
              icon={<UserIcon />}
              iconPosition="left"
              height="sm"
              required
            />

            <InputGroup
              className="w-full sm:w-1/2"
              type="text"
              name="last_name"
              label="Last Name"
              placeholder="Enter last name"
              value={form.last_name}
              handleChange={handleInputChange("last_name")}
              icon={<UserIcon />}
              iconPosition="left"
              height="sm"
              required
            />
          </div>

          <InputGroup
            className="w-full"
            type="email"
            name="email"
            label="Email Address"
            placeholder="Email"
            value={form.email}
            icon={<EmailIcon />}
            iconPosition="left"
            height="sm"
            disabled
          />

          <div className="flex flex-col gap-5.5 sm:flex-row">
            <InputGroup
              className="w-full sm:w-1/3"
              type="text"
              name="phone_code"
              label="Phone Code"
              placeholder="84"
              value={form.phone_code}
              handleChange={handleInputChange("phone_code")}
              icon={<CallIcon />}
              iconPosition="left"
              height="sm"
            />

            <InputGroup
              className="w-full sm:w-2/3"
              type="text"
              name="phone"
              label="Phone Number"
              placeholder="Enter phone number"
              value={form.phone}
              handleChange={handleInputChange("phone")}
              icon={<CallIcon />}
              iconPosition="left"
              height="sm"
              required
            />
          </div>

          <InputGroup
            className="w-full"
            type="text"
            name="country"
            label="Country"
            placeholder="Country code (e.g. vi)"
            value={form.country}
            handleChange={handleInputChange("country")}
            height="sm"
          />

          <TextAreaGroup
            className=""
            label="Address"
            placeholder="Enter address"
            icon={<PencilSquareIcon />}
            value={form.address}
            onChange={handleAddressChange}
          />

          <div className="flex justify-end gap-3 pt-3">
            <button
              className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:text-white"
              type="button"
              onClick={handleCancel}
              disabled={isSaving || !isDirty}
            >
              Cancel
            </button>

            <button
              className="rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSaving || !isDirty}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </ShowcaseSection>
  );
}

function mapProfileToForm(profile: UserProfile | null): FormState {
  if (!profile) {
    return { ...EMPTY_FORM };
  }

  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    phone_code: profile.phone_code ?? "",
    country: profile.country ?? "",
    address: profile.address ?? "",
  };
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5.5 sm:flex-row">
        <Skeleton className="h-12 w-full sm:w-1/2" />
        <Skeleton className="h-12 w-full sm:w-1/2" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <div className="flex flex-col gap-5.5 sm:flex-row">
        <Skeleton className="h-12 w-full sm:w-1/3" />
        <Skeleton className="h-12 w-full sm:w-2/3" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}
