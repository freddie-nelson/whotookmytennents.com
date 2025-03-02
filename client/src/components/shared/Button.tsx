import { HTMLAttributes } from "react";

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {}

export function Button(props: ButtonProps) {
	return (
		<button
			{...props}
			className={`font-bold rounded-md p-4 bg-tyellow text-lg text-tred ${props.className ?? ""}`}
		/>
	);
}
