"use client";

import { useEffect, useState } from "react";

import InputGroup from "@/components/FormElements/InputGroup";
import { Skeleton } from "@/components/ui/skeleton";

import { getCategories } from "@/components/Categories/fetch";
import type { CategoryRecord } from "@/components/Categories/types";

type ProductCategorySelectProps = {
  defaultValue?: string;
  name?: string;
  required?: boolean;
  label?: string;
};

export function ProductCategorySelect({
  defaultValue,
  name = "category_id",
  required,
  label = "Danh mục sản phẩm",
}: ProductCategorySelectProps) {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories({ page: 1, limit: 100 })
      .then((res) => setCategories(res.rows))
      .catch((err) => {
        console.error(err);
        setError("Không thể tải danh mục");
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <label className="text-body-sm font-medium text-dark dark:text-white">
          Danh mục sản phẩm
        </label>
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <InputGroup
        label="Danh mục?"
        name={name}
        placeholder="Nhập ID danh mục"
        type="text"
        defaultValue={defaultValue}
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
        <option value="" disabled>
          -- Chọn danh mục --
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
