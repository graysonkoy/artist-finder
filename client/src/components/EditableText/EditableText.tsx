import { ReactElement, useEffect, useState } from "react";
import AutosizeInput from "react-input-autosize";

import "./EditableText.scss";

interface EditableTextProps {
	text: string;
	onChange?: (newText: string) => void;
}

const EditableText = ({ text, onChange }: EditableTextProps): ReactElement => {
	const [value, setValue] = useState(text);

	useEffect(() => {
		setValue(text);
	}, [text]);

	return (
		<form
			className="editable-text-form"
			onSubmit={function (e) {
				if (onChange) onChange(value);
				e.preventDefault();

				// unfocus text input
				(e.target as any).querySelector(".editable-text").blur();
			}}
		>
			<AutosizeInput
				inputClassName="editable-text"
				type="text"
				value={value}
				onChange={(e) => {
					setValue(e.target.value);
				}}
			/>
		</form>
	);
};

export default EditableText;
