"use client";

import { useEffect, useMemo, useState } from "react";

import InputGroup from "@/components/FormElements/InputGroup";
import { Skeleton } from "@/components/ui/skeleton";

import { getCategories } from "./fetch";
import type { CategoryRecord } from "./types";

type CategoryParentSelectProps = {
  defaultValue?: string | null;
  excludeId?: string;
  label?: string;
  name?: string;
  required?: boolean;
};

export function CategoryParentSelect({
  defaultValue,
  excludeId,
  label = "Danh mục cha",
  name = "parent_id",
  required,
}: CategoryParentSelectProps) {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCategories({ page: 1, limit: 100 })
      .then((response) => {
        if (!isMounted) return;
        setCategories(response.rows);
      })
      .catch((err) => {
        console.error(err);
        if (!isMounted) return;
        setError("Không thể tải danh sách danh mục");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    if (!excludeId) return categories;
    return categories.filter((category) => category.id !== excludeId);
  }, [categories, excludeId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <label className="text-body-sm font-medium text-dark dark:text-white">
          {label}
        </label>
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <InputGroup
        label={label}
        name={name}
        placeholder="Nhập ID danh mục cha"
        type="text"
        defaultValue={defaultValue ?? ""}
        required={required}
      />
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-body-sm font-medium text-dark dark:text-white">
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </label>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
      >
        <option value="">-- Không có danh mục cha --</option>
        {filteredCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
