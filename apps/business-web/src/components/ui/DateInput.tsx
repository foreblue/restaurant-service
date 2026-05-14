import { forwardRef, type InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/Input";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  invalid?: boolean;
};

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(props, ref) {
    return <Input ref={ref} type="date" {...props} />;
  },
);
