import { Dispatch, SetStateAction } from "react";

export type DateFieldProps = {
  value: string | null;
  onChange: Dispatch<SetStateAction<string | null>>;
  label?: string;
  className?: string
};