import { HTMLAttributes } from "react";

export function Button(props: HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`font-bold rounded-md p-4 bg-tyellow text-lg text-tred ${props.className ?? ""}`}
    />
  );
}
